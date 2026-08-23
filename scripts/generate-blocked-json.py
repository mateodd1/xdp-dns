#!/usr/bin/env python3
# /root/xpd-dns/scripts/generate-blocked-json.py
# Generates data.json for /blocked dashboard

import json
import ipaddress
import bisect
import os
import sys
import datetime

BLOCKED_V4_FILE = "/etc/unbound/blocked_ips.txt"
BLOCKED_V6_FILE = "/etc/unbound/blocked_ipv6.txt"
CF_V4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"
CF_V6_FILE = "/etc/unbound/cloudflare_prefixes_v6.txt"

OUT_WEB = "/root/xpd-dns/web/blocked/data.json"
OUT_WWW = "/var/www/xdp.es/blocked/data.json"

# 1. Load Cloudflare IPv4 Prefixes
v4_intervals = []
v4_starts = []
if os.path.exists(CF_V4_FILE):
    try:
        nets = []
        with open(CF_V4_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    try:
                        nets.append(ipaddress.ip_network(line, strict=False))
                    except Exception:
                        pass
        ivs = sorted([(int(n.network_address), int(n.broadcast_address), str(n)) for n in nets])
        v4_intervals = ivs
        v4_starts = [iv[0] for iv in ivs]
    except Exception as e:
        print("Error loading CF v4:", e, file=sys.stderr)

# 2. Load Cloudflare IPv6 Prefixes
v6_intervals = []
v6_starts = []
if os.path.exists(CF_V6_FILE):
    try:
        nets = []
        with open(CF_V6_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    try:
                        nets.append(ipaddress.ip_network(line, strict=False))
                    except Exception:
                        pass
        ivs = sorted([(int(n.network_address), int(n.broadcast_address), str(n)) for n in nets])
        v6_intervals = ivs
        v6_starts = [iv[0] for iv in ivs]
    except Exception as e:
        print("Error loading CF v6:", e, file=sys.stderr)

def find_cf_v4(ip_str):
    if not v4_starts: return None
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        idx = bisect.bisect_right(v4_starts, ip_int) - 1
        if idx >= 0:
            s, e, net_str = v4_intervals[idx]
            if s <= ip_int <= e:
                return s, e, net_str
        return None
    except Exception:
        return None

def find_cf_v6(ip_str):
    if not v6_starts: return None
    try:
        ip_int = int(ipaddress.IPv6Address(ip_str))
        idx = bisect.bisect_right(v6_starts, ip_int) - 1
        if idx >= 0:
            s, e, net_str = v6_intervals[idx]
            if s <= ip_int <= e:
                return s, e, net_str
        return None
    except Exception:
        return None

# Load blocked IPs
blocked_v4 = []
if os.path.exists(BLOCKED_V4_FILE):
    with open(BLOCKED_V4_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked_v4.append(line)

blocked_v6 = []
if os.path.exists(BLOCKED_V6_FILE):
    with open(BLOCKED_V6_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked_v6.append(line)

blocked_v4_set = set(blocked_v4)
blocked_v6_set = set(blocked_v6)

def get_evasive_v4(ip_str):
    cf = find_cf_v4(ip_str)
    if not cf:
        return ip_str, None, False
    
    start_int, end_int, net_str = cf
    try:
        ip_int = int(ipaddress.IPv4Address(ip_str))
        octets = [int(x) for x in ip_str.split('.')]
        base_last = octets[3]

        for offset in range(1, 255):
            for delta in (offset, -offset):
                cand_last = base_last + delta
                if 1 <= cand_last <= 254:
                    cand_int = (ip_int & 0xFFFFFF00) | cand_last
                    if start_int <= cand_int <= end_int:
                        cand_str = f"{octets[0]}.{octets[1]}.{octets[2]}.{cand_last}"
                        if cand_str not in blocked_v4_set:
                            return cand_str, net_str, True

        max_search = min(65536, end_int - start_int + 1)
        for offset in range(1, max_search):
            for delta in (offset, -offset):
                cand_int = ip_int + delta
                if start_int <= cand_int <= end_int:
                    cand_last = cand_int & 0xFF
                    if 1 <= cand_last <= 254:
                        cand_str = str(ipaddress.IPv4Address(cand_int))
                        if cand_str not in blocked_v4_set:
                            return cand_str, net_str, True
        return ip_str, net_str, False
    except Exception:
        return ip_str, None, False

def get_evasive_v6(ip_str):
    cf = find_cf_v6(ip_str)
    if not cf:
        return ip_str, None, False
    start_int, end_int, net_str = cf
    try:
        ip_int = int(ipaddress.IPv6Address(ip_str))
        for offset in range(1, 1024):
            for delta in (offset, -offset):
                cand_int = ip_int + delta
                if start_int <= cand_int <= end_int:
                    cand = ipaddress.IPv6Address(cand_int)
                    if cand.compressed not in blocked_v6_set and str(cand) not in blocked_v6_set:
                        return cand.compressed, net_str, True
        return ip_str, net_str, False
    except Exception:
        return ip_str, None, False

entries = []

# Process IPv4
for ip in sorted(blocked_v4, key=lambda x: [int(p) for p in x.split('.') if p.isdigit()]):
    alt_ip, net_str, is_evaded = get_evasive_v4(ip)
    is_cf = net_str is not None
    entries.append({
        "blocked_ip": ip,
        "type": "IPv4",
        "is_cloudflare": is_cf,
        "prefix": net_str or "Non-Cloudflare",
        "alternative_ip": alt_ip,
        "status": "Evadida (Limpia)" if is_evaded else ("No Cloudflare (Intacta)" if not is_cf else "Sin alternativa disponible")
    })

# Process IPv6
for ip in sorted(blocked_v6):
    alt_ip, net_str, is_evaded = get_evasive_v6(ip)
    is_cf = net_str is not None
    entries.append({
        "blocked_ip": ip,
        "type": "IPv6",
        "is_cloudflare": is_cf,
        "prefix": net_str or "Non-Cloudflare",
        "alternative_ip": alt_ip,
        "status": "Evadida (Limpia)" if is_evaded else ("No Cloudflare (Intacta)" if not is_cf else "Sin alternativa disponible")
    })

total_blocked = len(entries)
cf_blocked_count = sum(1 for e in entries if e["is_cloudflare"])
evaded_count = sum(1 for e in entries if e["status"].startswith("Evadida"))

now_utc = datetime.datetime.now(datetime.timezone.utc)

data = {
    "last_updated": now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
    "timestamp": int(now_utc.timestamp()),
    "evasion_active": total_blocked > 0,
    "total_blocked": total_blocked,
    "cf_blocked_count": cf_blocked_count,
    "evaded_count": evaded_count,
    "entries": entries
}

for out_path in [OUT_WEB, OUT_WWW]:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    temp = out_path + ".tmp"
    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(temp, 0o644)
    os.replace(temp, out_path)

print(f"Blocked dashboard JSON generated: {total_blocked} blocked IPs ({evaded_count} successfully evaded).")
