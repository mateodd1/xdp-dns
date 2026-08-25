#!/usr/bin/env python3
# /root/xpd-dns/scripts/generate-blocked-json.py
# Generates data.json for /blocked dashboard (IPv4 Only)

import json
import ipaddress
import bisect
import os
import sys
import datetime
import subprocess

BLOCKED_V4_FILE = "/etc/unbound/blocked_ips.txt"
CF_V4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"
ASN_CACHE_FILE = "/root/xpd-dns/scripts/asn_cache.json"

# Proxy de evasión en Rust (xdp-evade-proxy.service): consume estos mismos ficheros
# y expone contadores agregados. Fuente primaria HTTP, fallback al fichero que persiste.
EVADE_METRICS_URL = "http://127.0.0.1:5339/stats"
EVADE_STATS_FILE = "/root/xpd-dns/scripts/evade_stats.json"

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

# Load ASN Cache
def load_asn_cache():
    if os.path.exists(ASN_CACHE_FILE):
        try:
            with open(ASN_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def get_origin_info(ip_str, cache):
    cached = cache.get(ip_str)
    if cached and isinstance(cached, dict):
        return {
            "origin_asn": f"AS{cached.get('asn', '0')}",
            "org": cached.get("name", "Desconocido"),
            "bgp_prefix": cached.get("prefix")
        }
    try:
        rev = ".".join(reversed(ip_str.split("."))) + ".origin.asn.cymru.com"
        cmd = ["dig", "@127.0.0.1", "-p", "53", "+short", "TXT", rev]
        out = subprocess.check_output(cmd, timeout=1.5).decode("utf-8").strip().strip('"')
        if out:
            parts = [p.strip() for p in out.split("|")]
            asn = parts[0].split()[0]
            prefix = parts[1] if len(parts) > 1 else None
            return {
                "origin_asn": f"AS{asn}",
                "org": f"AS{asn}",
                "bgp_prefix": prefix
            }
    except Exception:
        pass
    return None

# Load blocked IPv4s
blocked_v4 = []
if os.path.exists(BLOCKED_V4_FILE):
    with open(BLOCKED_V4_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked_v4.append(line)

blocked_v4_set = set(blocked_v4)

# NOTA DE PARIDAD: este algoritmo replica 1:1 a `evasive_v4` del proxy Rust
# (evade-proxy/src/main.rs). Si se cambia aquí, cambiar allí también — y viceversa —
# o el dashboard mostrará alternativas distintas de las que entrega el proxy en real.
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

entries = []
origin_cache = load_asn_cache()

# Process IPv4 Only
for ip in sorted(blocked_v4, key=lambda x: [int(p) for p in x.split('.') if p.isdigit()]):
    alt_ip, net_str, is_evaded = get_evasive_v4(ip)
    is_cf = net_str is not None
    origin = None if is_cf else get_origin_info(ip, origin_cache)
    prefix = net_str
    if prefix is None and origin:
        prefix = origin.get("bgp_prefix")

    entry = {
        "blocked_ip": ip,
        "type": "IPv4",
        "is_cloudflare": is_cf,
        "prefix": prefix or "Otros",
        "alternative_ip": alt_ip,
        "status": "Evadida (Limpia)" if is_evaded else ("Otros (Intacta)" if not is_cf else "Sin alternativa disponible")
    }
    if origin and not is_cf:
        entry["origin_asn"] = origin.get("origin_asn")
        entry["org"] = origin.get("org")
    entries.append(entry)

total_blocked = len(entries)
cf_blocked_count = sum(1 for e in entries if e["is_cloudflare"])
evaded_count = sum(1 for e in entries if e["status"].startswith("Evadida"))

now_utc = datetime.datetime.now(datetime.timezone.utc)

def evasion_proxy_state():
    """Contadores en vivo del proxy Rust (:5339). Fallback al fichero que persiste."""
    import urllib.request
    try:
        req = urllib.request.Request(EVADE_METRICS_URL, headers={"User-Agent": "BlockedDashboard/1.0"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception:
        pass
    try:
        with open(EVADE_STATS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

proxy_state = evasion_proxy_state()

data = {
    "last_updated": now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
    "timestamp": int(now_utc.timestamp()),
    "evasion_active": total_blocked > 0,
    "total_blocked": total_blocked,
    "cf_blocked_count": cf_blocked_count,
    "evaded_count": evaded_count,
    "evasion_proxy": {
        "evaded_queries_total": int(proxy_state.get("evaded_queries_total", 0)),
        "evaded_records_total": int(proxy_state.get("evaded_records_total", 0)),
        "total_queries_processed": int(proxy_state.get("total_queries_processed", 0)),
        "last_evasion_timestamp": proxy_state.get("last_evasion_timestamp"),
        "source": "evade-proxy-rust"
    },
    "entries": entries
}

for out_path in [OUT_WEB, OUT_WWW]:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    temp = out_path + ".tmp"
    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(temp, 0o644)
    os.replace(temp, out_path)

print(f"Blocked dashboard JSON (IPv4): {total_blocked} blocked IPs ({evaded_count} Cloudflare evaded).")
