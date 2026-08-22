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
import dns.message
import dns.rdatatype
import dns.rdataclass
import dns.rdata

LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = 5335
UPSTREAM_HOST = "127.0.0.1"
UPSTREAM_PORT = 5336
BLOCKED_IPS_FILE = "/etc/unbound/blocked_ips.txt"

BLOCKED_IPS = set()
_last_mtime = 0
_last_check_time = 0

def load_blocked_ips(force=False):
    global _last_mtime, _last_check_time, BLOCKED_IPS
    now = time.time()
    if not force and (now - _last_check_time < 5):
        return
    _last_check_time = now

    if not os.path.exists(BLOCKED_IPS_FILE):
        BLOCKED_IPS = set()
        return

    try:
        mtime = os.path.getmtime(BLOCKED_IPS_FILE)
        if mtime != _last_mtime or force:
            new_set = set()
            with open(BLOCKED_IPS_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    ip = line.strip()
                    if ip and not ip.startswith("#"):
                        new_set.add(ip)
            BLOCKED_IPS = new_set
            _last_mtime = mtime
            print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Loaded {len(BLOCKED_IPS)} blocked IPs from {BLOCKED_IPS_FILE}", flush=True)
    except Exception as e:
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Error reading {BLOCKED_IPS_FILE}: {e}", flush=True)

def get_contiguous_ip(ip_str):
    try:
        octets = [int(x) for x in ip_str.split('.')]
        for delta in [1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12]:
            new_last = octets[3] + delta
            if 1 <= new_last <= 254:
                cand = f"{octets[0]}.{octets[1]}.{octets[2]}.{new_last}"
                if cand not in BLOCKED_IPS:
                    return cand
        return f"{octets[0]}.{octets[1]}.{octets[2]}.{octets[3]+1}"
    except Exception:
        return ip_str

def rewrite_dns_payload(wire_data):
    load_blocked_ips()
    if not BLOCKED_IPS:
        return wire_data

    try:
        msg = dns.message.from_wire(wire_data)
        modified = False

        for section in [msg.answer, msg.authority, msg.additional]:
            for rrset in section:
                if rrset.rdtype == dns.rdatatype.A:
                    new_rdatas = []
                    for rdata in rrset:
                        if rdata.address in BLOCKED_IPS:
                            cont_ip = get_contiguous_ip(rdata.address)
                            new_rdatas.append(dns.rdata.from_text(rrset.rdclass, rrset.rdtype, cont_ip))
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
