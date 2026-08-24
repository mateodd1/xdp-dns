#!/usr/bin/env python3
# /root/xpd-dns/scripts/evade_proxy.py
# High-Performance Asynchronous DNS Evasion Proxy with Replaced Resolutions Tracking
# Intercepts DNS queries on:
#   - 127.0.0.1:5335 -> forwards to Unbound Adblock (127.0.0.1:5336) [.51 egress]
#   - 127.0.0.1:5337 -> forwards to Unbound Lite (127.0.0.1:5338) [.52 egress]
# Dynamically rewrites blocked Anycast IPs ONLY IF they belong to Cloudflare (AS13335)
# to unblocked contiguous Cloudflare Anycast IPs, and tracks resolution statistics.

import asyncio
import os
import time
import socket
import struct
import ipaddress
import bisect
import json
import dns.message
import dns.rdatatype
import dns.rdataclass
import dns.rdata

LISTEN_HOST = "127.0.0.1"
UPSTREAM_HOST = "127.0.0.1"
METRICS_PORT = 5339

PORT_PAIRS = [
    (5335, 5336),  # Adblock (.51 egress)
    (5337, 5338)   # Lite (.52 egress)
]

BLOCKED_IPV4_FILE = "/etc/unbound/blocked_ips.txt"
BLOCKED_IPV6_FILE = "/etc/unbound/blocked_ipv6.txt"
CF_IPV4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"
CF_IPV6_FILE = "/etc/unbound/cloudflare_prefixes_v6.txt"
EVADE_STATS_FILE = "/root/xpd-dns/scripts/evade_stats.json"

BLOCKED_IPS_V4 = set()
BLOCKED_IPS_V6 = set()

CF_V4_INTERVALS = []
CF_V4_STARTS = []

CF_V6_INTERVALS = []
CF_V6_STARTS = []

_last_v4_mtime = 0
_last_v6_mtime = 0
_last_cf_v4_mtime = 0
_last_cf_v6_mtime = 0
_last_check_time = 0

EVADED_QUERIES_COUNT = 0
EVADED_RECORDS_COUNT = 0
TOTAL_QUERIES_COUNT = 0
LAST_EVADED_TIME = 0
_last_save_time = 0

def load_evade_stats():
    global EVADED_QUERIES_COUNT, EVADED_RECORDS_COUNT, TOTAL_QUERIES_COUNT, LAST_EVADED_TIME
    if os.path.exists(EVADE_STATS_FILE):
        try:
            with open(EVADE_STATS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                EVADED_QUERIES_COUNT = int(data.get("evaded_queries_total", 0))
                EVADED_RECORDS_COUNT = int(data.get("evaded_records_total", 0))
                TOTAL_QUERIES_COUNT = int(data.get("total_queries_processed", 0))
                LAST_EVADED_TIME = float(data.get("last_evasion_timestamp", 0))
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded evasion stats: {EVADED_QUERIES_COUNT} queries evaded ({EVADED_RECORDS_COUNT} records replaced)", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Warning loading {EVADE_STATS_FILE}: {e}", flush=True)

def save_evade_stats(force=False):
    global _last_save_time
    now = time.time()
    if not force and (now - _last_save_time < 2):
        return
    _last_save_time = now
    try:
        data = {
            "evaded_queries_total": EVADED_QUERIES_COUNT,
            "evaded_records_total": EVADED_RECORDS_COUNT,
            "total_queries_processed": TOTAL_QUERIES_COUNT,
            "last_evasion_timestamp": LAST_EVADED_TIME,
            "last_updated": now
        }
        temp_file = f"{EVADE_STATS_FILE}.tmp"
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        os.replace(temp_file, EVADE_STATS_FILE)
    except Exception:
        pass

def load_data(force=False):
    global _last_v4_mtime, _last_v6_mtime, _last_cf_v4_mtime, _last_cf_v6_mtime, _last_check_time
    global BLOCKED_IPS_V4, BLOCKED_IPS_V6, CF_V4_INTERVALS, CF_V4_STARTS, CF_V6_INTERVALS, CF_V6_STARTS
    
    now = time.time()
    if not force and (now - _last_check_time < 5):
        return
    _last_check_time = now

    # 1. Load IPv4 Blocked Anycast List
    if os.path.exists(BLOCKED_IPV4_FILE):
        try:
            mtime = os.path.getmtime(BLOCKED_IPV4_FILE)
            if mtime != _last_v4_mtime or force:
                new_v4 = set()
                with open(BLOCKED_IPV4_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            new_v4.add(line)
                BLOCKED_IPS_V4 = new_v4
                _last_v4_mtime = mtime
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(BLOCKED_IPS_V4)} blocked IPv4s from {BLOCKED_IPV4_FILE}", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {BLOCKED_IPV4_FILE}: {e}", flush=True)
    else:
        BLOCKED_IPS_V4 = set()

    # 2. Load IPv6 Blocked Anycast List
    if os.path.exists(BLOCKED_IPV6_FILE):
        try:
            mtime = os.path.getmtime(BLOCKED_IPV6_FILE)
            if mtime != _last_v6_mtime or force:
                new_v6 = set()
                with open(BLOCKED_IPV6_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            try:
                                ip_obj = ipaddress.IPv6Address(line)
                                new_v6.add(ip_obj.compressed)
                                new_v6.add(str(ip_obj))
                            except Exception:
                                new_v6.add(line.lower())
                BLOCKED_IPS_V6 = new_v6
                _last_v6_mtime = mtime
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(BLOCKED_IPS_V6)} blocked IPv6s from {BLOCKED_IPV6_FILE}", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {BLOCKED_IPV6_FILE}: {e}", flush=True)
    else:
        BLOCKED_IPS_V6 = set()

    # 3. Load Cloudflare AS13335 IPv4 Prefixes
    if os.path.exists(CF_IPV4_FILE):
        try:
            mtime = os.path.getmtime(CF_IPV4_FILE)
            if mtime != _last_cf_v4_mtime or force:
                nets = []
                with open(CF_IPV4_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            try:
                                net = ipaddress.ip_network(line, strict=False)
                                nets.append((int(net.network_address), int(net.broadcast_address)))
                            except Exception:
                                pass
                nets.sort()
                merged = []
                for s, e in nets:
                    if merged and s <= merged[-1][1] + 1:
                        merged[-1] = (merged[-1][0], max(merged[-1][1], e))
                    else:
                        merged.append((s, e))
                CF_V4_INTERVALS = merged
                CF_V4_STARTS = [x[0] for x in merged]
                _last_cf_v4_mtime = mtime
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(CF_V4_INTERVALS)} Cloudflare IPv4 prefix intervals", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {CF_IPV4_FILE}: {e}", flush=True)

    # 4. Load Cloudflare AS13335 IPv6 Prefixes
    if os.path.exists(CF_IPV6_FILE):
        try:
            mtime = os.path.getmtime(CF_IPV6_FILE)
            if mtime != _last_cf_v6_mtime or force:
                nets_v6 = []
                with open(CF_IPV6_FILE, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#"):
                            try:
                                net = ipaddress.ip_network(line, strict=False)
                                nets_v6.append((int(net.network_address), int(net.broadcast_address)))
                            except Exception:
                                pass
                nets_v6.sort()
                merged_v6 = []
                for s, e in nets_v6:
                    if merged_v6 and s <= merged_v6[-1][1] + 1:
                        merged_v6[-1] = (merged_v6[-1][0], max(merged_v6[-1][1], e))
                    else:
                        merged_v6.append((s, e))
                CF_V6_INTERVALS = merged_v6
                CF_V6_STARTS = [x[0] for x in merged_v6]
                _last_cf_v6_mtime = mtime
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(CF_V6_INTERVALS)} Cloudflare IPv6 prefix intervals", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {CF_IPV6_FILE}: {e}", flush=True)

def find_cf_v4(ip_str):
    if not CF_V4_STARTS:
        return None
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        idx = bisect.bisect_right(CF_V4_STARTS, ip_int) - 1
        if idx >= 0:
            s, e = CF_V4_INTERVALS[idx]
            if s <= ip_int <= e:
                return (s, e)
    except Exception:
        pass
    return None

def find_cf_v6(ip_str):
    if not CF_V6_STARTS:
        return None
    try:
        ip_int = int(ipaddress.IPv6Address(ip_str))
        idx = bisect.bisect_right(CF_V6_STARTS, ip_int) - 1
        if idx >= 0:
            s, e = CF_V6_INTERVALS[idx]
            if s <= ip_int <= e:
                return (s, e)
    except Exception:
        pass
    return None

def get_evasive_ipv4(ip_str):
    cf_range = find_cf_v4(ip_str)
    if not cf_range:
        return ip_str

    start_int, end_int = cf_range
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        octets = [int(x) for x in ip_str.split('.')]
        base_last = octets[3]

        # 1. Search alternating nearby offsets in same /24 within Cloudflare bounds
        for offset in range(1, 255):
            for delta in (offset, -offset):
                cand_last = base_last + delta
                if 1 <= cand_last <= 254:
                    cand_int = (ip_int & 0xFFFFFF00) | cand_last
                    if start_int <= cand_int <= end_int:
                        cand_str = f"{octets[0]}.{octets[1]}.{octets[2]}.{cand_last}"
                        if cand_str not in BLOCKED_IPS_V4:
                            return cand_str

        # 2. Search across the enclosing Cloudflare prefix
        max_search = min(65536, end_int - start_int + 1)
        for offset in range(1, max_search):
            for delta in (offset, -offset):
                cand_int = ip_int + delta
                if start_int <= cand_int <= end_int:
                    cand_last = cand_int & 0xFF
                    if 1 <= cand_last <= 254:
                        cand_str = str(ipaddress.IPv4Address(cand_int))
                        if cand_str not in BLOCKED_IPS_V4:
                            return cand_str

        return ip_str
    except Exception:
        return ip_str

def get_evasive_ipv6(ip_str):
    cf_range = find_cf_v6(ip_str)
    if not cf_range:
        return ip_str

    start_int, end_int = cf_range
    try:
        ip_obj = ipaddress.IPv6Address(ip_str)
        ip_int = int(ip_obj)

        for offset in range(1, 1024):
            for delta in (offset, -offset):
                cand_int = ip_int + delta
                if start_int <= cand_int <= end_int:
                    cand = ipaddress.IPv6Address(cand_int)
                    if cand.compressed not in BLOCKED_IPS_V6 and str(cand) not in BLOCKED_IPS_V6:
                        return cand.compressed

        return ip_str
    except Exception:
        return ip_str

def rewrite_dns_payload(wire_data):
    global EVADED_QUERIES_COUNT, EVADED_RECORDS_COUNT, TOTAL_QUERIES_COUNT, LAST_EVADED_TIME
    TOTAL_QUERIES_COUNT += 1
    load_data()

    # Evasion is active only when BLOCKED_IPS_V4 is NOT empty
    if not BLOCKED_IPS_V4 and not BLOCKED_IPS_V6:
        return wire_data

    try:
        msg = dns.message.from_wire(wire_data)
        modified = False
        records_replaced = 0

        for section in [msg.answer, msg.authority, msg.additional]:
            for rrset in section:
                # 1. Rewrite Blocked IPv4 (A records)
                if rrset.rdtype == dns.rdatatype.A:
                    new_rdatas = []
                    for rdata in rrset:
                        if rdata.address in BLOCKED_IPS_V4:
                            cont_ip = get_evasive_ipv4(rdata.address)
                            if cont_ip != rdata.address:
                                new_rdatas.append(dns.rdata.from_text(rrset.rdclass, rrset.rdtype, cont_ip))
                                modified = True
                                records_replaced += 1
                            else:
                                new_rdatas.append(rdata)
                        else:
                            new_rdatas.append(rdata)
                    if modified:
                        rrset.clear()
                        for rdata in new_rdatas:
                            rrset.add(rdata)

                # 2. Rewrite Blocked IPv6 (AAAA records)
                elif rrset.rdtype == dns.rdatatype.AAAA:
                    new_rdatas = []
                    for rdata in rrset:
                        try:
                            norm_ip = ipaddress.IPv6Address(rdata.address).compressed
                        except Exception:
                            norm_ip = str(rdata.address).lower()

                        if norm_ip in BLOCKED_IPS_V6 or str(rdata.address) in BLOCKED_IPS_V6:
                            alt_ip = get_evasive_ipv6(rdata.address)
                            if alt_ip != rdata.address and alt_ip != norm_ip:
                                new_rdatas.append(dns.rdata.from_text(rrset.rdclass, rrset.rdtype, alt_ip))
                                modified = True
                                records_replaced += 1
                            else:
                                new_rdatas.append(rdata)
                        else:
                            new_rdatas.append(rdata)
                    if modified:
                        rrset.clear()
                        for rdata in new_rdatas:
                            rrset.add(rdata)

        if modified:
            EVADED_QUERIES_COUNT += 1
            EVADED_RECORDS_COUNT += records_replaced
            LAST_EVADED_TIME = time.time()
            save_evade_stats()
            return msg.to_wire()
    except Exception:
        pass

    return wire_data

class UDPDnsProtocol(asyncio.DatagramProtocol):
    def __init__(self, upstream_port):
        self.upstream_port = upstream_port
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        asyncio.create_task(self.handle_query(data, addr))

    async def handle_query(self, data, addr):
        try:
            loop = asyncio.get_running_loop()
            resp_data = await self.forward_udp(data)
            if resp_data:
                rewritten_data = rewrite_dns_payload(resp_data)
                self.transport.sendto(rewritten_data, addr)
        except Exception:
            pass

    async def forward_udp(self, data):
        loop = asyncio.get_running_loop()
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setblocking(False)
        try:
            await loop.sock_connect(s, (UPSTREAM_HOST, self.upstream_port))
            await loop.sock_sendall(s, data)
            resp = await asyncio.wait_for(loop.sock_recv(s, 4096), timeout=3.0)
            return resp
        except Exception:
            return None
        finally:
            s.close()

    def error_received(self, exc):
        pass

def make_tcp_handler(upstream_port):
    async def handle_tcp_client(reader, writer):
        try:
            len_bytes = await reader.readexactly(2)
            query_len = struct.unpack("!H", len_bytes)[0]
            query_data = await reader.readexactly(query_len)

            up_reader, up_writer = await asyncio.open_connection(UPSTREAM_HOST, upstream_port)
            up_writer.write(len_bytes + query_data)
            await up_writer.drain()

            resp_len_bytes = await up_reader.readexactly(2)
            resp_len = struct.unpack("!H", resp_len_bytes)[0]
            resp_data = await up_reader.readexactly(resp_len)

            up_writer.close()
            await up_writer.wait_closed()

            rewritten = rewrite_dns_payload(resp_data)
            new_len_bytes = struct.pack("!H", len(rewritten))

            writer.write(new_len_bytes + rewritten)
            await writer.drain()
        except Exception:
            pass
        finally:
            try:
                writer.close()
                await writer.wait_closed()
            except Exception:
                pass
    return handle_tcp_client

async def handle_http_metrics(reader, writer):
    try:
        line = await asyncio.wait_for(reader.readline(), timeout=2.0)
        req_line = line.decode('utf-8', errors='ignore').strip()
        parts = req_line.split()
        path = parts[1] if len(parts) > 1 else "/"

        # Consume remaining headers
        while True:
            h_line = await asyncio.wait_for(reader.readline(), timeout=1.0)
            if not h_line or h_line == b"\r\n" or h_line == b"\n":
                break

        if path.startswith("/metrics"):
            body = (
                f"# HELP xdp_evade_queries_total Total DNS queries rewritten for block evasion\n"
                f"# TYPE xdp_evade_queries_total counter\n"
                f"xdp_evade_queries_total {EVADED_QUERIES_COUNT}\n"
                f"# HELP xdp_evade_records_total Total DNS records replaced for block evasion\n"
                f"# TYPE xdp_evade_records_total counter\n"
                f"xdp_evade_records_total {EVADED_RECORDS_COUNT}\n"
                f"# HELP xdp_evade_queries_processed Total queries processed by evasion proxy\n"
                f"# TYPE xdp_evade_queries_processed counter\n"
                f"xdp_evade_queries_processed {TOTAL_QUERIES_COUNT}\n"
            ).encode('utf-8')
            content_type = "text/plain; version=0.0.4"
        else:
            payload = {
                "evaded_queries_total": EVADED_QUERIES_COUNT,
                "evaded_records_total": EVADED_RECORDS_COUNT,
                "total_queries_processed": TOTAL_QUERIES_COUNT,
                "last_evasion_timestamp": LAST_EVADED_TIME
            }
            body = json.dumps(payload, indent=2).encode('utf-8')
            content_type = "application/json"

        header = (
            f"HTTP/1.1 200 OK\r\n"
            f"Content-Type: {content_type}\r\n"
            f"Content-Length: {len(body)}\r\n"
            f"Connection: close\r\n\r\n"
        ).encode('utf-8')

        writer.write(header + body)
        await writer.drain()
    except Exception:
        pass
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except Exception:
            pass

async def stats_persister_task():
    while True:
        await asyncio.sleep(5)
        save_evade_stats(force=True)

async def main():
    load_evade_stats()
    load_data(force=True)
    loop = asyncio.get_running_loop()

    servers = []
    for listen_p, upstream_p in PORT_PAIRS:
        # UDP Server
        transport, protocol = await loop.create_datagram_endpoint(
            lambda up_p=upstream_p: UDPDnsProtocol(up_p),
            local_addr=(LISTEN_HOST, listen_p),
            reuse_port=True
        )
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DNS Evasion Proxy UDP listening on {LISTEN_HOST}:{listen_p} -> upstream {UPSTREAM_HOST}:{upstream_p}", flush=True)

        # TCP Server
        tcp_server = await asyncio.start_server(
            make_tcp_handler(upstream_p),
            LISTEN_HOST,
            listen_p,
            reuse_port=True
        )
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DNS Evasion Proxy TCP listening on {LISTEN_HOST}:{listen_p} -> upstream {UPSTREAM_HOST}:{upstream_p}", flush=True)
        servers.append(tcp_server)

    # HTTP Metrics Server
    http_metrics_server = await asyncio.start_server(
        handle_http_metrics,
        LISTEN_HOST,
        METRICS_PORT,
        reuse_port=True
    )
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DNS Evasion Proxy Metrics HTTP listening on {LISTEN_HOST}:{METRICS_PORT}", flush=True)
    servers.append(http_metrics_server)

    asyncio.create_task(stats_persister_task())

    await asyncio.gather(
        *(s.serve_forever() for s in servers),
        asyncio.Event().wait()
    )

if __name__ == "__main__":
    asyncio.run(main())
