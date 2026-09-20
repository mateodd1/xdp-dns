#!/usr/bin/env python3
"""Packet tests in a disposable network namespace; never send to production.

Run: unshare -n python3 security/test-ddos-guard.py
"""
import importlib.util
import json
import os
from pathlib import Path
import socket
import struct
import subprocess
import time

if os.readlink('/proc/self/ns/net') == os.readlink('/proc/1/ns/net'):
    raise SystemExit('Refusing host network namespace: use unshare -n')
spec = importlib.util.spec_from_file_location('guard', Path(__file__).with_name('generate-ddos-guard.py'))
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

def run(*args, **kw):
    return subprocess.run(args, check=True, capture_output=True, **kw)

run('ip', 'link', 'add', 'guard-out', 'type', 'veth', 'peer', 'name', 'guard-in')
for name in ('guard-out', 'guard-in', 'lo'):
    run('ip', 'link', 'set', name, 'up')
run('ip', 'addr', 'add', '198.18.0.1/24', 'dev', 'guard-in')
run('ip', '-6', 'addr', 'add', 'fd00::1/64', 'dev', 'guard-in', 'nodad')
sock = socket.socket(socket.AF_PACKET, socket.SOCK_RAW)
sock.bind(('guard-out', 0))
dstmac = bytes.fromhex(json.loads(run('ip', '-j', 'link', 'show', 'guard-in', text=True).stdout)[0]['address'].replace(':', ''))

def reset():
    subprocess.run(['nft', 'delete', 'table', 'inet', 'xdp_ddos'], capture_output=True)
    run('nft', '-f', '-', input=guard.render('test'), text=True)

def checksum(data):
    if len(data) % 2:
        data += b'\0'
    total = sum(struct.unpack('!' + 'H' * (len(data) // 2), data))
    while total >> 16:
        total = (total & 65535) + (total >> 16)
    return (~total) & 65535

def packet(port=53, source=2, v6=False, udp=False, ack=False):
    proto = 17 if udp else 6
    src = socket.inet_pton(socket.AF_INET6 if v6 else socket.AF_INET,
                           f'fd00::{source:x}' if v6 else f'198.18.0.{source}')
    dst = socket.inet_pton(socket.AF_INET6 if v6 else socket.AF_INET,
                           'fd00::1' if v6 else '198.18.0.1')
    if udp:
        segment = struct.pack('!HHHH', 40000, port, 8, 0)
    else:
        segment = struct.pack('!HHIIBBHHH', 40000, port, 1, 1 if ack else 0, 80,
                              16 if ack else 2, 8192, 0, 0)
    pseudo = src + dst + (struct.pack('!I3xB', len(segment), proto) if v6
                          else struct.pack('!BBH', 0, proto, len(segment)))
    offset = 6 if udp else 16
    segment = segment[:offset] + struct.pack('!H', checksum(pseudo + segment)) + segment[offset+2:]
    if v6:
        header = struct.pack('!IHBB', 6 << 28, len(segment), proto, 64) + src + dst
    else:
        header = struct.pack('!BBHHHBBH', 69, 0, 20 + len(segment), 1, 0, 64, proto, 0) + src + dst
        header = header[:10] + struct.pack('!H', checksum(header)) + header[12:]
    return dstmac + b'\x02\x00\x00\x00\x00\x02' + struct.pack('!H', 0x86dd if v6 else 0x800) + header + segment

def send(count, **kwargs):
    data = packet(**kwargs)
    for _ in range(count):
        sock.send(data)
    time.sleep(.03)

def counts():
    data = json.loads(run('nft', '-j', 'list', 'counters', 'table', 'inet', 'xdp_ddos', text=True).stdout)
    return {x['counter']['name']: x['counter']['packets'] for x in data['nftables'] if 'counter' in x}

for v6 in (False, True):
    reset(); send(250, v6=v6)
    c = counts()
    assert c['syn_dns_source'] > 100 and c['syn_pass'] >= 100, c
    print('PASS per-source TCP SYN IPv' + ('6' if v6 else '4'), c)
reset(); send(1500, ack=True)
assert sum(counts().values()) == 0, counts()
print('PASS established TCP ACK/data bypasses SYN limits')
reset(); send(90); send(90, port=853)
assert counts()['syn_pass'] == 180 and counts()['syn_dns_source'] == 0, counts()
print('PASS DNS and DoT have independent per-source buckets')
reset()
for source in range(2, 102):
    for _ in range(10):
        sock.send(packet(source=source))
time.sleep(.03)
c = counts()
assert c['syn53_global'] > 300 and c['syn_dns_source'] == 0, c
print('PASS distributed SYN flood hits aggregate ceiling', c)
for v6 in (False, True):
    reset(); send(3000, udp=True, v6=v6)
    c = counts()
    assert c['dns_udp_source'] > 300 and c['dnsudp_pass'] >= 2000, c
    print('PASS DNS UDP per-source IPv' + ('6' if v6 else '4'), c)
reset(); send(14000, port=443, udp=True)
c = counts()
assert c['quic_udp_source'] > 500 and c['quic_pass'] >= 10000, c
print('PASS QUIC UDP per-source ceiling', c)
reset(); send(10, port=443); send(10, udp=True); send(10, udp=True, port=853)
c = counts()
assert c['syn_pass'] == c['dnsudp_pass'] == c['quic_pass'] == 10, c
assert all(v == 0 for k, v in c.items() if not k.endswith('_pass')), c
print('PASS ordinary HTTPS, DNS and DoQ traffic')
