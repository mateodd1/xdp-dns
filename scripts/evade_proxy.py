#!/usr/bin/env python3
# /root/xpd-dns/scripts/evade_proxy.py
# High-Performance Asynchronous DNS Evasion Proxy
# Intercepts DNS queries on 127.0.0.1:5335, forwards to Unbound (127.0.0.1:5336),
# and dynamically rewrites blocked Anycast IPs to contiguous unblocked IPs.

import asyncio
import os
import time
import socket
import struct
import ipaddress
import dns.message
import dns.rdatatype
import dns.rdataclass
import dns.rdata

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 5335
UPSTREAM_HOST = "127.0.0.1"
UPSTREAM_PORT = 5336

BLOCKED_IPV4_FILE = "/etc/unbound/blocked_ips.txt"
BLOCKED_IPV6_FILE = "/etc/unbound/blocked_ipv6.txt"

BLOCKED_IPS_V4 = set()
BLOCKED_IPS_V6 = set()

_last_v4_mtime = 0
_last_v6_mtime = 0
_last_check_time = 0

def load_blocked_ips(force=False):
    global _last_v4_mtime, _last_v6_mtime, _last_check_time, BLOCKED_IPS_V4, BLOCKED_IPS_V6
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
                        ip = line.strip()
                        if ip and not ip.startswith("#"):
                            new_v4.add(ip)
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
                        ip_str = line.strip()
                        if ip_str and not ip_str.startswith("#"):
                            try:
                                parsed = ipaddress.IPv6Address(ip_str)
                                new_v6.add(parsed.compressed)
                            except Exception:
                                new_v6.add(ip_str.lower())
                BLOCKED_IPS_V6 = new_v6
                _last_v6_mtime = mtime
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(BLOCKED_IPS_V6)} blocked IPv6s from {BLOCKED_IPV6_FILE}", flush=True)
        except Exception as e:
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {BLOCKED_IPV6_FILE}: {e}", flush=True)
    else:
        BLOCKED_IPS_V6 = set()

def get_contiguous_ipv4(ip_str):
    try:
        octets = [int(x) for x in ip_str.split('.')]
        for delta in [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12]:
            new_last = octets[3] + delta
            if 1 <= new_last <= 254:
                cand = f"{octets[0]}.{octets[1]}.{octets[2]}.{new_last}"
                if cand not in BLOCKED_IPS_V4:
                    return cand
        return f"{octets[0]}.{octets[1]}.{octets[2]}.{octets[3]+1}"
    except Exception:
        return ip_str

def get_contiguous_ipv6(ip_str):
    try:
        ip = ipaddress.IPv6Address(ip_str)
        ip_int = int(ip)
        for delta in [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 16, -16, 32, -32]:
            cand_int = ip_int + delta
            if 0 < cand_int < (1 << 128) - 1:
                cand = ipaddress.IPv6Address(cand_int)
                if cand.compressed not in BLOCKED_IPS_V6 and str(cand) not in BLOCKED_IPS_V6:
                    return cand.compressed
        return str(ipaddress.IPv6Address(ip_int + 1))
    except Exception:
        return ip_str

def rewrite_dns_payload(wire_data):
    load_blocked_ips()

    # Condition: Evasion is active only when BLOCKED_IPS_V4 is NOT empty (any.txt has blocked IPs)
    if not BLOCKED_IPS_V4:
        return wire_data

    try:
        msg = dns.message.from_wire(wire_data)
        modified = False

        for section in [msg.answer, msg.authority, msg.additional]:
            for rrset in section:
                # 1. Rewrite Blocked IPv4 (A records)
                if rrset.rdtype == dns.rdatatype.A:
                    new_rdatas = []
                    for rdata in rrset:
                        if rdata.address in BLOCKED_IPS_V4:
                            cont_ip = get_contiguous_ipv4(rdata.address)
                            new_rdatas.append(dns.rdata.from_text(rrset.rdclass, rrset.rdtype, cont_ip))
                            modified = True
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
                            alt_ip = get_contiguous_ipv6(rdata.address)
                            new_rdatas.append(dns.rdata.from_text(rrset.rdclass, rrset.rdtype, alt_ip))
                            modified = True
                        else:
                            new_rdatas.append(rdata)
                    if modified:
                        rrset.clear()
                        for rdata in new_rdatas:
                            rrset.add(rdata)

        if modified:
            return msg.to_wire()
    except Exception:
        pass

    return wire_data

class UDPDnsProtocol(asyncio.DatagramProtocol):
    def __init__(self, upstream_sock):
        self.upstream_sock = upstream_sock
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport

    def datagram_received(self, data, addr):
        asyncio.create_task(self.handle_query(data, addr))

    async def handle_query(self, data, addr):
        try:
            loop = asyncio.get_running_loop()
            # Send query to Unbound
            resp_data = await self.forward_udp(data)
            if resp_data:
                # Rewrite blocked IPs
                rewritten_data = rewrite_dns_payload(resp_data)
                self.transport.sendto(rewritten_data, addr)
        except Exception:
            pass

    async def forward_udp(self, data):
        loop = asyncio.get_running_loop()
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.setblocking(False)
        try:
            await loop.sock_connect(s, (UPSTREAM_HOST, UPSTREAM_PORT))
            await loop.sock_sendall(s, data)
            resp = await asyncio.wait_for(loop.sock_recv(s, 4096), timeout=3.0)
            return resp
        except Exception:
            return None
        finally:
            s.close()

async def handle_tcp_client(reader, writer):
    try:
        # Read 2-byte length prefix
        len_bytes = await reader.readexactly(2)
        query_len = struct.unpack("!H", len_bytes)[0]
        query_data = await reader.readexactly(query_len)

        # Forward TCP to Unbound
        up_reader, up_writer = await asyncio.open_connection(UPSTREAM_HOST, UPSTREAM_PORT)
        up_writer.write(len_bytes + query_data)
        await up_writer.drain()

        resp_len_bytes = await up_reader.readexactly(2)
        resp_len = struct.unpack("!H", resp_len_bytes)[0]
        resp_data = await up_reader.readexactly(resp_len)

        up_writer.close()
        await up_writer.wait_closed()

        # Rewrite payload
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

async def main():
    load_blocked_ips(force=True)
    loop = asyncio.get_running_loop()

    # UDP Server on 127.0.0.1:5335
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: UDPDnsProtocol(None),
        local_addr=(LISTEN_HOST, LISTEN_PORT),
        reuse_port=True
    )
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DNS Evasion Proxy UDP listening on {LISTEN_HOST}:{LISTEN_PORT}", flush=True)

    # TCP Server on 127.0.0.1:5335
    tcp_server = await asyncio.start_server(
        handle_tcp_client,
        LISTEN_HOST,
        LISTEN_PORT,
        reuse_port=True
    )
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] DNS Evasion Proxy TCP listening on {LISTEN_HOST}:{LISTEN_PORT}", flush=True)

    async with tcp_server:
        await asyncio.gather(
            tcp_server.serve_forever(),
            asyncio.Event().wait()
        )

if __name__ == "__main__":
    asyncio.run(main())
