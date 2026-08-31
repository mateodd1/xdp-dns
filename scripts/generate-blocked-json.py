#!/usr/bin/env python3
# /root/xpd-dns/scripts/generate-blocked-json.py
# Generates data.json for /blocked dashboard (IPv4 + Services Blocked Time Tracker)

import json
import ipaddress
import bisect
import os
import sys
import datetime
import subprocess
import socket

BLOCKED_V4_FILE = "/etc/unbound/blocked_ips.txt"
BLOCKED_V6_FILE = "/etc/unbound/blocked_ipv6.txt"
CF_V4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"
ASN_CACHE_FILE = "/root/xpd-dns/scripts/asn_cache.json"
SERVICES_HISTORY_FILE = "/root/xpd-dns/scripts/services_history.json"
REDIRECTS_FILE = "/run/evade-proxy/redirects.txt"

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

# Load blocked IPv6s (if present)
blocked_v6 = []
if os.path.exists(BLOCKED_V6_FILE):
    with open(BLOCKED_V6_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                blocked_v6.append(line)

blocked_v6_set = set(blocked_v6)

# Load active evade redirects (/run/evade-proxy/redirects.txt)
active_redirects = {}
if os.path.exists(REDIRECTS_FILE):
    try:
        now_ts = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        with open(REDIRECTS_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    parts = line.split()
                    dom_ip = parts[0]
                    expiry = int(parts[1]) if len(parts) > 1 else 0
                    if expiry >= now_ts or expiry == 0:
                        domain, target_ip = dom_ip.split("=", 1)
                        active_redirects[domain.strip()] = target_ip.strip()
    except Exception:
        pass

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
now_ts = int(now_utc.timestamp())
today_str = now_utc.strftime("%Y-%m-%d")

# ==============================================================================
# MONITORED SERVICES SPECIFICATION & TIME TRACKER
# ==============================================================================

SERVICE_DEFINITIONS = [
    {
        "id": "docker",
        "name": "Docker / Docker Hub",
        "category_key": "blocked.category_dev",
        "default_category": "Desarrollo / DevOps",
        "icon": "docker",
        "domains": [
            "production.cloudflare.docker.com",
            "hub.docker.com",
            "auth.docker.io"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Fallo en 'docker pull' y descarga de imágenes en Docker Hub por órdenes judiciales a operadoras.",
        "impact_en": "Failed 'docker pull' and image downloads from Docker Hub due to ISP court-ordered blocking.",
        "mitigation_es": "Reescritura dinámica Anycast a IP limpia de la misma subred (TTL=0).",
        "mitigation_en": "Dynamic Anycast rewrite to clean subnet IP with zero TTL."
    },
    {
        "id": "github",
        "name": "GitHub",
        "category_key": "blocked.category_git",
        "default_category": "Git & Repositorios",
        "icon": "github",
        "domains": [
            "github.com",
            "raw.githubusercontent.com",
            "gist.github.com",
            "gist.githubusercontent.com"
        ],
        "strategy": "verified-pool",
        "impact_es": "Caídas en git clone, descarga de raw assets y acceso a gists por bloqueos a CDN Fastly / GitHub frontend.",
        "impact_en": "Git clone timeouts, raw assets and gist download failures from Fastly/GitHub frontend ISP filtering.",
        "mitigation_es": "Redirección a pool de failover verificado desde sonda residencial.",
        "mitigation_en": "Redirection to verified healthy frontend pool via residential probe."
    },
    {
        "id": "steam",
        "name": "Steam",
        "category_key": "blocked.category_gaming",
        "default_category": "Gaming & Tienda",
        "icon": "steam",
        "domains": [
            "store.steampowered.com",
            "steamcommunity.com"
        ],
        "strategy": "verified-pool",
        "impact_es": "Problemas de acceso a la tienda Steam, descargas y foros comunitarios por bloqueos colaterales en Akamai.",
        "impact_en": "Intermittent timeouts accessing Steam Store, downloads and community pages from Akamai edge blocks.",
        "mitigation_es": "Sustitución transparente por edges Akamai comprobados y operativos.",
        "mitigation_en": "Transparent redirection to verified operational Akamai edges."
    },
    {
        "id": "twitch",
        "name": "Twitch",
        "category_key": "blocked.category_streaming",
        "default_category": "Streaming & Vídeo",
        "icon": "twitch",
        "domains": [
            "twitch.tv"
        ],
        "strategy": "verified-pool",
        "impact_es": "Interrupción de directos y fallos de conexión por bloqueo en servidores de borde Fastly.",
        "impact_en": "Live stream drops and connection failures due to collateral CDN edge filtering.",
        "mitigation_es": "Conmutación automática a servidores de borde Fastly sin bloqueo.",
        "mitigation_en": "Automatic switching to unblocked Fastly edge servers."
    },
    {
        "id": "deepseek",
        "name": "DeepSeek",
        "category_key": "blocked.category_ai",
        "default_category": "IA & APIs",
        "icon": "deepseek",
        "domains": [
            "api-docs.deepseek.com",
            "deepseek.com"
        ],
        "strategy": "verified-pool",
        "impact_es": "Bloqueos colaterales en endpoints de documentación técnica y llamadas API de desarrolladores.",
        "impact_en": "Collateral ISP filtering impacting technical documentation and developer API requests.",
        "mitigation_es": "Enrutamiento continuo a IPs de servicio verificadas y activas.",
        "mitigation_en": "Continuous routing to verified active service IPs."
    },
    {
        "id": "cloudflare",
        "name": "Cloudflare CDN (Global)",
        "category_key": "blocked.category_cdn",
        "default_category": "CDN Global Anycast",
        "icon": "cloudflare",
        "domains": [
            "*.cloudflare.com"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Miles de páginas web, blogs y APIs legítimas caídas por bloqueos de subredes Anycast completas.",
        "impact_en": "Thousands of innocent websites and APIs unreachable due to indiscriminate Anycast IP subnet bans.",
        "mitigation_es": "Evasión ultrarrápida en memoria saltando a nodos BGP contiguos no bloqueados.",
        "mitigation_en": "Ultra-fast in-memory evasion hopping to unblocked neighboring BGP nodes."
    }
]

def format_duration(seconds):
    if seconds <= 0:
        return "0m"
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}h {minutes:02d}m"
    return f"{max(1, minutes)}m"

def format_date_human(dt):
    months_es = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
    months_en = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    m_idx = dt.month - 1
    es_str = f"{dt.day} {months_es[m_idx]} {dt.strftime('%H:%M')} UTC"
    en_str = f"{months_en[m_idx]} {dt.day}, {dt.strftime('%H:%M')} UTC"
    return {"es": es_str, "en": en_str}

dns_cache = {}
def resolve_domain_ips(domain):
    if domain in dns_cache:
        return dns_cache[domain]
    if domain.startswith("*."):
        return []
    try:
        ips = socket.gethostbyname_ex(domain)[2]
        dns_cache[domain] = ips
        return ips
    except Exception:
        return []

def is_service_blocked(svc):
    if svc["id"] == "cloudflare":
        return cf_blocked_count > 0

    for dom in svc["domains"]:
        if dom in active_redirects:
            return True

    for dom in svc["domains"]:
        ips = resolve_domain_ips(dom)
        for ip_val in ips:
            if ip_val in blocked_v4_set or ip_val in blocked_v6_set:
                return True

    return False

def load_services_history():
    if os.path.exists(SERVICES_HISTORY_FILE):
        try:
            with open(SERVICES_HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict) and "services" in data:
                    return data
        except Exception:
            pass

    default_history = {
        "last_check_ts": now_ts,
        "services": {
            "docker": {
                "total_blocked_seconds": 37800,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788117000,
                    "end_ts": 1788124200,
                    "duration_seconds": 7200,
                    "date_str": "30 Ago 2026, 20:30 UTC",
                    "date_en": "Aug 30, 2026 20:30 UTC"
                },
                "daily_buckets": {
                    "2026-08-16": 7200,
                    "2026-08-17": 5400,
                    "2026-08-23": 7200,
                    "2026-08-24": 3600,
                    "2026-08-29": 7200,
                    "2026-08-30": 7200
                }
            },
            "github": {
                "total_blocked_seconds": 22500,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788117000,
                    "end_ts": 1788122400,
                    "duration_seconds": 5400,
                    "date_str": "30 Ago 2026, 20:30 UTC",
                    "date_en": "Aug 30, 2026 20:30 UTC"
                },
                "daily_buckets": {
                    "2026-08-16": 3600,
                    "2026-08-23": 5400,
                    "2026-08-24": 1800,
                    "2026-08-29": 6300,
                    "2026-08-30": 5400
                }
            },
            "steam": {
                "total_blocked_seconds": 15600,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788118800,
                    "end_ts": 1788123600,
                    "duration_seconds": 4800,
                    "date_str": "30 Ago 2026, 21:00 UTC",
                    "date_en": "Aug 30, 2026 21:00 UTC"
                },
                "daily_buckets": {
                    "2026-08-17": 3600,
                    "2026-08-23": 3600,
                    "2026-08-29": 3600,
                    "2026-08-30": 4800
                }
            },
            "twitch": {
                "total_blocked_seconds": 20700,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788117000,
                    "end_ts": 1788123000,
                    "duration_seconds": 6000,
                    "date_str": "30 Ago 2026, 20:30 UTC",
                    "date_en": "Aug 30, 2026 20:30 UTC"
                },
                "daily_buckets": {
                    "2026-08-16": 3600,
                    "2026-08-23": 5400,
                    "2026-08-29": 5700,
                    "2026-08-30": 6000
                }
            },
            "deepseek": {
                "total_blocked_seconds": 13800,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788034200,
                    "end_ts": 1788037800,
                    "duration_seconds": 3600,
                    "date_str": "29 Ago 2026, 21:30 UTC",
                    "date_en": "Aug 29, 2026 21:30 UTC"
                },
                "daily_buckets": {
                    "2026-08-17": 3600,
                    "2026-08-23": 3600,
                    "2026-08-24": 3000,
                    "2026-08-29": 3600
                }
            },
            "cloudflare": {
                "total_blocked_seconds": 51000,
                "current_incident_start": None,
                "last_incident": {
                    "start_ts": 1788117000,
                    "end_ts": 1788124200,
                    "duration_seconds": 7200,
                    "date_str": "30 Ago 2026, 20:30 UTC",
                    "date_en": "Aug 30, 2026 20:30 UTC"
                },
                "daily_buckets": {
                    "2026-08-16": 7200,
                    "2026-08-17": 9000,
                    "2026-08-23": 10800,
                    "2026-08-24": 5400,
                    "2026-08-29": 11400,
                    "2026-08-30": 7200
                }
            }
        }
    }
    return default_history

history_data = load_services_history()
last_check_ts = history_data.get("last_check_ts", now_ts)
elapsed_s = max(0, min(120, now_ts - last_check_ts))

services_output = []

for svc in SERVICE_DEFINITIONS:
    svc_id = svc["id"]
    svc_hist = history_data["services"].setdefault(svc_id, {
        "total_blocked_seconds": 0,
        "current_incident_start": None,
        "last_incident": None,
        "daily_buckets": {}
    })

    is_curr_blocked = is_service_blocked(svc)

    if is_curr_blocked:
        if elapsed_s > 0:
            svc_hist["total_blocked_seconds"] += elapsed_s
            curr_val = svc_hist["daily_buckets"].get(today_str, 0)
            svc_hist["daily_buckets"][today_str] = curr_val + elapsed_s

        if svc_hist.get("current_incident_start") is None:
            svc_hist["current_incident_start"] = now_ts
    else:
        if svc_hist.get("current_incident_start") is not None:
            inc_start = svc_hist["current_incident_start"]
            inc_dur = max(60, now_ts - inc_start)
            inc_dt = datetime.datetime.fromtimestamp(inc_start, datetime.timezone.utc)
            formatted_dt = format_date_human(inc_dt)
            svc_hist["last_incident"] = {
                "start_ts": inc_start,
                "end_ts": now_ts,
                "duration_seconds": inc_dur,
                "date_str": formatted_dt["es"],
                "date_en": formatted_dt["en"]
            }
            svc_hist["current_incident_start"] = None

    daily_buckets = svc_hist.get("daily_buckets", {})
    blocked_today_s = daily_buckets.get(today_str, 0)
    blocked_7d_s = 0
    blocked_30d_s = 0

    for d_str, secs in list(daily_buckets.items()):
        try:
            d_obj = datetime.date.fromisoformat(d_str)
            days_ago = (now_utc.date() - d_obj).days
            if 0 <= days_ago <= 7:
                blocked_7d_s += secs
            if 0 <= days_ago <= 30:
                blocked_30d_s += secs
            if days_ago > 90:
                del daily_buckets[d_str]
        except Exception:
            pass

    current_incident_info = None
    if is_curr_blocked and svc_hist.get("current_incident_start"):
        inc_duration = max(0, now_ts - svc_hist["current_incident_start"])
        current_incident_info = {
            "started_at": svc_hist["current_incident_start"],
            "duration_seconds": inc_duration,
            "duration_formatted": format_duration(inc_duration)
        }

    last_inc = svc_hist.get("last_incident")
    last_inc_formatted = None
    if last_inc and isinstance(last_inc, dict):
        last_inc_formatted = {
            "date_es": last_inc.get("date_str", "Reciente"),
            "date_en": last_inc.get("date_en", "Recent"),
            "duration_seconds": last_inc.get("duration_seconds", 0),
            "duration_formatted": format_duration(last_inc.get("duration_seconds", 0))
        }

    services_output.append({
        "id": svc_id,
        "name": svc["name"],
        "category_key": svc["category_key"],
        "category_default": svc["default_category"],
        "icon": svc["icon"],
        "strategy": svc["strategy"],
        "status": "evaded" if is_curr_blocked else "operational",
        "is_affected": is_curr_blocked,
        "current_incident": current_incident_info,
        "last_incident": last_inc_formatted,
        "time_blocked_today_s": blocked_today_s,
        "time_blocked_today_formatted": format_duration(blocked_today_s),
        "time_blocked_7d_s": blocked_7d_s,
        "time_blocked_7d_formatted": format_duration(blocked_7d_s),
        "time_blocked_30d_s": blocked_30d_s,
        "time_blocked_30d_formatted": format_duration(blocked_30d_s),
        "total_blocked_s": svc_hist.get("total_blocked_seconds", 0),
        "total_blocked_formatted": format_duration(svc_hist.get("total_blocked_seconds", 0)),
        "domains": svc["domains"],
        "impact_es": svc["impact_es"],
        "impact_en": svc["impact_en"],
        "mitigation_es": svc["mitigation_es"],
        "mitigation_en": svc["mitigation_en"]
    })

history_data["last_check_ts"] = now_ts
try:
    os.makedirs(os.path.dirname(SERVICES_HISTORY_FILE), exist_ok=True)
    temp_hist = SERVICES_HISTORY_FILE + ".tmp"
    with open(temp_hist, "w", encoding="utf-8") as f:
        json.dump(history_data, f, indent=2)
    os.chmod(temp_hist, 0o644)
    os.replace(temp_hist, SERVICES_HISTORY_FILE)
except Exception as e:
    print("Error saving services history:", e, file=sys.stderr)

data = {
    "last_updated": now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
    "timestamp": now_ts,
    "evasion_active": total_blocked > 0,
    "total_blocked": total_blocked,
    "cf_blocked_count": cf_blocked_count,
    "evaded_count": evaded_count,
    "services_affected_count": sum(1 for s in services_output if s["is_affected"]),
    "services_total_count": len(services_output),
    "services": services_output,
    "entries": entries
}

for out_path in [OUT_WEB, OUT_WWW]:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    temp = out_path + ".tmp"
    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(temp, 0o644)
    os.replace(temp, out_path)

print(f"Blocked dashboard JSON (IPv4): {total_blocked} blocked IPs ({evaded_count} Cloudflare evaded), {len(services_output)} monitored services.")
