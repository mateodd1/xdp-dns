#!/usr/bin/env python3
# /root/xpd-dns/scripts/generate-blocked-json.py
# Generates data.json for /blocked dashboard (IPv4+IPv6 + measured service tracker)

import json
import ipaddress
import bisect
import os
import sys
import datetime
import subprocess

BLOCKED_V4_FILE = "/etc/unbound/blocked_ips.txt"
BLOCKED_V6_FILE = "/etc/unbound/blocked_ipv6.txt"
CF_V4_FILE = "/etc/unbound/cloudflare_prefixes_v4.txt"
CF_V6_FILE = "/etc/unbound/cloudflare_prefixes_v6.txt"
ASN_CACHE_FILE = "/root/xpd-dns/scripts/asn_cache.json"
SERVICES_HISTORY_FILE = "/root/xpd-dns/scripts/services_history.json"
REDIRECTS_FILE = "/run/evade-proxy/redirects.txt"

OUT_WEB = "/root/xpd-dns/web/blocked/data.json"
OUT_WWW = "/var/www/xdp.es/blocked/data.json"

HISTORY_SCHEMA_VERSION = 3
MAX_INCIDENT_IPS = 12
# Cloudflare "global CDN" incident only if the live block is more than leftover noise.
# IPv6 OONI dump is shown in the table but does NOT open service incidents (stale).
CF_MASS_V4_MIN = 8
CF_MASS_V6_MIN = 16
CF_MASS_SLASH24_MIN = 2
ASN_LOOKUP_BUDGET = 8
DNS_RESOLVERS = ("1.1.1.1", "8.8.8.8")
PROBE_V6_FILE = "/etc/unbound/probe_blocked_ipv6.txt"

LEGAL_BASIS = (
    "Reglamento (UE) 2015/2120 art. 3 (acceso a internet abierta) y art. 3.3.a "
    "(excepción de cumplimiento de resoluciones judiciales, sujeta a proporcionalidad). "
    "Ley 11/2022 arts. 76 y 78."
)

CAUSE_ES = (
    "Coincidencia entre las IPs resueltas de este servicio y la lista de direcciones "
    "filtradas en operadoras españolas (hayahora.futbol y/o sonda residencial). "
    "En jornadas deportivas esos filtros suelen ejecutarse al amparo de resoluciones "
    "judiciales; esta ficha no identifica por sí sola al autor del bloqueo."
)
CAUSE_EN = (
    "Resolved IPs for this service match the Spanish ISP blocklist (hayahora.futbol "
    "and/or the residential probe). On match days those filters are typically applied "
    "under court orders; this record does not by itself identify who ordered the block."
)

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

cf_v6_nets = []
if os.path.exists(CF_V6_FILE):
    try:
        with open(CF_V6_FILE) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    try:
                        cf_v6_nets.append(ipaddress.ip_network(line, strict=False))
                    except Exception:
                        pass
    except Exception as e:
        print("Error loading CF v6:", e, file=sys.stderr)


def find_cf_v4(ip_str):
    if not v4_starts:
        return None
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
    try:
        ip = ipaddress.IPv6Address(ip_str)
    except Exception:
        return None
    for net in cf_v6_nets:
        if ip in net:
            return str(net)
    return None


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


def load_ip_list(path):
    out = []
    if not os.path.exists(path):
        return out
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                out.append(line)
    return out


blocked_v4 = load_ip_list(BLOCKED_V4_FILE)
blocked_v6 = load_ip_list(BLOCKED_V6_FILE)
blocked_v4_set = set(blocked_v4)
blocked_v6_set = set(blocked_v6)
# High-confidence current IPv6 (residential probe). The OONI dump is static and noisy.
probe_v6_set = set(load_ip_list(PROBE_V6_FILE))
live_v6_set = probe_v6_set

# Load active evade redirects
active_redirects = {}
now_utc = datetime.datetime.now(datetime.timezone.utc)
now_ts = int(now_utc.timestamp())
today_str = now_utc.strftime("%Y-%m-%d")

if os.path.exists(REDIRECTS_FILE):
    try:
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
# (evade-proxy/src/main.rs). Si se cambia aquí, cambiar allí también — y viceversa.
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
asn_lookups_used = 0

for ip in sorted(blocked_v4, key=lambda x: [int(p) for p in x.split('.') if p.isdigit()]):
    alt_ip, net_str, is_evaded = get_evasive_v4(ip)
    is_cf = net_str is not None
    origin = None
    if not is_cf:
        if ip in origin_cache or asn_lookups_used < ASN_LOOKUP_BUDGET:
            if ip not in origin_cache:
                asn_lookups_used += 1
            origin = get_origin_info(ip, origin_cache)
    prefix = net_str
    if prefix is None and origin:
        prefix = origin.get("bgp_prefix")

    entry = {
        "blocked_ip": ip,
        "type": "IPv4",
        "is_cloudflare": is_cf,
        "list_source": "live",
        "prefix": prefix or "Otros",
        "alternative_ip": alt_ip,
        "status": "Evadida (Limpia)" if is_evaded else ("Otros (Intacta)" if not is_cf else "Sin alternativa disponible")
    }
    if origin and not is_cf:
        entry["origin_asn"] = origin.get("origin_asn")
        entry["org"] = origin.get("org")
    entries.append(entry)


def v6_sort_key(ip_str):
    try:
        return int(ipaddress.IPv6Address(ip_str))
    except Exception:
        return 0


for ip in sorted(blocked_v6, key=v6_sort_key):
    net_str = find_cf_v6(ip)
    is_cf = net_str is not None
    entry = {
        "blocked_ip": ip,
        "type": "IPv6",
        "is_cloudflare": is_cf,
        "list_source": "probe" if ip in probe_v6_set else "ooni",
        "prefix": net_str or "Otros",
        "alternative_ip": ip,
        "status": "Listada (IPv6)" if is_cf else "Otros (Intacta)"
    }
    entries.append(entry)

total_blocked = len(entries)
cf_blocked_count = sum(1 for e in entries if e["is_cloudflare"])
cf_v4_blocked_count = sum(1 for e in entries if e["is_cloudflare"] and e["type"] == "IPv4")
cf_v6_blocked_count = sum(1 for e in entries if e["is_cloudflare"] and e["type"] == "IPv6")
evaded_count = sum(1 for e in entries if e["status"].startswith("Evadida"))

cf_v4_slash24 = set()
for e in entries:
    if e["is_cloudflare"] and e["type"] == "IPv4":
        parts = e["blocked_ip"].split(".")
        if len(parts) == 4:
            cf_v4_slash24.add(".".join(parts[:3]))

probe_cf_v6_count = sum(1 for ip in live_v6_set if find_cf_v6(ip))
cf_mass_block = (
    cf_v4_blocked_count >= CF_MASS_V4_MIN
    or probe_cf_v6_count >= CF_MASS_V6_MIN
)

# ==============================================================================
# MONITORED SERVICES
# ==============================================================================

SERVICE_DEFINITIONS = [
    {
        "id": "docker",
        "name": "Docker / Docker Hub",
        "category_key": "blocked.category_dev",
        "default_category": "Desarrollo / DevOps",
        "icon": "docker",
        "critical": True,
        "domains": [
            "production.cloudflare.docker.com",
            "hub.docker.com",
            "auth.docker.io"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Fallo en 'docker pull' y descarga de imágenes en Docker Hub cuando las IPs anycast coinciden con la blocklist.",
        "impact_en": "Failed 'docker pull' and Docker Hub image downloads when anycast IPs match the blocklist.",
        "mitigation_es": "Reescritura dinámica Anycast a IP limpia de la misma subred (TTL=0).",
        "mitigation_en": "Dynamic Anycast rewrite to a clean subnet IP with zero TTL."
    },
    {
        "id": "github",
        "name": "GitHub",
        "category_key": "blocked.category_git",
        "default_category": "Git & Repositorios",
        "icon": "github",
        "critical": True,
        "domains": [
            "github.com",
            "raw.githubusercontent.com",
            "gist.github.com",
            "gist.githubusercontent.com"
        ],
        "strategy": "verified-pool",
        "impact_es": "Caídas en git clone, raw assets y gists cuando el frontend (Fastly / GitHub) está en la blocklist o la sonda fuerza un redirect.",
        "impact_en": "git clone, raw assets and gist failures when the frontend is on the blocklist or the probe installs a redirect.",
        "mitigation_es": "Redirección a pool de failover verificado desde sonda residencial.",
        "mitigation_en": "Redirection to a verified healthy frontend pool via residential probe."
    },
    {
        "id": "gitlab",
        "name": "GitLab",
        "category_key": "blocked.category_git",
        "default_category": "Git & Repositorios",
        "icon": "gitlab",
        "critical": True,
        "domains": [
            "gitlab.com",
            "registry.gitlab.com"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Interrupción de git, CI y registry de GitLab si sus IPs Cloudflare/Fastly coinciden con el filtro.",
        "impact_en": "Git, CI and GitLab registry interruption if Cloudflare/Fastly IPs match the filter.",
        "mitigation_es": "Evasión Anycast o redirect a IP verificada cuando la sonda lo confirma.",
        "mitigation_en": "Anycast evasion or redirect to a verified IP when the probe confirms it."
    },
    {
        "id": "npm",
        "name": "npm registry",
        "category_key": "blocked.category_pkg",
        "default_category": "Paquetes / CI",
        "icon": "npm",
        "critical": True,
        "domains": [
            "registry.npmjs.org",
            "npmjs.com"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Fallo de 'npm install' / 'yarn' / 'pnpm' en pipelines y estaciones de trabajo.",
        "impact_en": "'npm install' / yarn / pnpm failures in pipelines and workstations.",
        "mitigation_es": "Reescritura Anycast a IP Cloudflare no filtrada (TTL=0).",
        "mitigation_en": "Anycast rewrite to an unfiltered Cloudflare IP (TTL=0)."
    },
    {
        "id": "pypi",
        "name": "PyPI",
        "category_key": "blocked.category_pkg",
        "default_category": "Paquetes / CI",
        "icon": "pypi",
        "critical": True,
        "domains": [
            "pypi.org",
            "files.pythonhosted.org"
        ],
        "strategy": "verified-pool",
        "impact_es": "Fallo de 'pip install' y descarga de wheels alojados en Fastly.",
        "impact_en": "'pip install' and wheel download failures on Fastly-hosted PyPI.",
        "mitigation_es": "Redirect a un edge Fastly no presente en la blocklist cuando la sonda lo verifica.",
        "mitigation_en": "Redirect to a Fastly edge not present on the blocklist when the probe verifies it."
    },
    {
        "id": "letsencrypt",
        "name": "Let's Encrypt (ACME)",
        "category_key": "blocked.category_pki",
        "default_category": "Certificados TLS",
        "icon": "letsencrypt",
        "critical": True,
        "domains": [
            "acme-v02.api.letsencrypt.org",
            "letsencrypt.org"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Fallo de emisión/renovación de certificados (HTTP-01 / ACME) si el API cae en IPs filtradas.",
        "impact_en": "Certificate issuance/renewal failures (HTTP-01 / ACME) if the API lands on filtered IPs.",
        "mitigation_es": "Reescritura Anycast del API ACME cuando su frontend Cloudflare está en la lista.",
        "mitigation_en": "Anycast rewrite of the ACME API when its Cloudflare frontend is listed."
    },
    {
        "id": "cloudflare",
        "name": "Cloudflare CDN (Global)",
        "category_key": "blocked.category_cdn",
        "default_category": "CDN Global Anycast",
        "icon": "cloudflare",
        "critical": True,
        "domains": [
            "*.cloudflare.com"
        ],
        "strategy": "cf-anycast",
        "impact_es": "Sitios y APIs ajenos al objeto del bloqueo quedan inalcanzables al filtrar IPs anycast compartidas.",
        "impact_en": "Unrelated sites and APIs become unreachable when shared anycast IPs are filtered.",
        "mitigation_es": "Sustitución en memoria por direcciones del mismo prefijo BGP no presentes en la blocklist.",
        "mitigation_en": "In-memory replacement with same-BGP-prefix addresses not present on the blocklist."
    },
    {
        "id": "steam",
        "name": "Steam",
        "category_key": "blocked.category_gaming",
        "default_category": "Gaming & Tienda",
        "icon": "steam",
        "critical": False,
        "domains": [
            "store.steampowered.com",
            "steamcommunity.com"
        ],
        "strategy": "verified-pool",
        "impact_es": "Timeouts en tienda y comunidad Steam si los edges Akamai coinciden con la blocklist.",
        "impact_en": "Steam Store and community timeouts if Akamai edges match the blocklist.",
        "mitigation_es": "Sustitución por edges Akamai comprobados por la sonda.",
        "mitigation_en": "Replacement with Akamai edges verified by the probe."
    },
    {
        "id": "twitch",
        "name": "Twitch",
        "category_key": "blocked.category_streaming",
        "default_category": "Streaming & Vídeo",
        "icon": "twitch",
        "critical": False,
        "domains": [
            "twitch.tv"
        ],
        "strategy": "verified-pool",
        "impact_es": "Cortes de directos si el edge Fastly de Twitch está filtrado.",
        "impact_en": "Live stream drops if Twitch's Fastly edge is filtered.",
        "mitigation_es": "Conmutación a un edge Fastly no filtrado verificado por la sonda.",
        "mitigation_en": "Failover to an unfiltered Fastly edge verified by the probe."
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


MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def format_date_human(dt):
    m_idx = dt.month - 1
    es_str = f"{dt.day} {MONTHS_ES[m_idx]} {dt.strftime('%H:%M')} UTC"
    en_str = f"{MONTHS_EN[m_idx]} {dt.day}, {dt.strftime('%H:%M')} UTC"
    return {"es": es_str, "en": en_str}


def format_date_only(dt):
    m_idx = dt.month - 1
    return {
        "es": f"{dt.day} {MONTHS_ES[m_idx]} {dt.year}",
        "en": f"{MONTHS_EN[m_idx]} {dt.day}, {dt.year}"
    }


def is_ip_literal(value):
    try:
        ipaddress.ip_address(value)
        return True
    except Exception:
        return False


dns_cache = {}


def resolve_domain_ips(domain):
    if domain in dns_cache:
        return dns_cache[domain]
    if domain.startswith("*."):
        dns_cache[domain] = []
        return []
    found = []
    for rtype in ("A", "AAAA"):
        answers = []
        for server in DNS_RESOLVERS:
            try:
                cmd = ["dig", f"@{server}", "+short", "+time=1", "+tries=1", rtype, domain]
                out = subprocess.check_output(cmd, timeout=2.0).decode("utf-8", errors="replace")
                for line in out.splitlines():
                    token = line.strip().rstrip(".")
                    if is_ip_literal(token):
                        answers.append(token)
                if answers:
                    break
            except Exception:
                continue
        found.extend(answers)
    # unique, stable
    seen = set()
    ips = []
    for ip_val in found:
        if ip_val not in seen:
            seen.add(ip_val)
            ips.append(ip_val)
    dns_cache[domain] = ips
    return ips


def clip_ips(ips):
    unique = []
    seen = set()
    for ip_val in ips:
        if ip_val not in seen:
            seen.add(ip_val)
            unique.append(ip_val)
    return unique[:MAX_INCIDENT_IPS], len(unique)


def inspect_service(svc):
    """Return (is_blocked, matched_ips, matched_domains, sources)."""
    matched_ips = []
    matched_domains = []
    sources = set()

    if svc["id"] == "cloudflare":
        if not cf_mass_block:
            return False, [], [], set()
        sources.add("blocklist")
        cf_ips = [e["blocked_ip"] for e in entries if e["is_cloudflare"]]
        return True, cf_ips, list(svc["domains"]), sources

    for dom in svc["domains"]:
        if dom in active_redirects:
            sources.add("probe")
            matched_domains.append(dom)
            target = active_redirects.get(dom)
            if target:
                matched_ips.append(target)

        for ip_val in resolve_domain_ips(dom):
            try:
                ver = ipaddress.ip_address(ip_val).version
            except Exception:
                continue
            hit = False
            if ver == 4 and ip_val in blocked_v4_set:
                hit = True
            elif ver == 6 and ip_val in live_v6_set:
                hit = True
            if hit:
                sources.add("blocklist")
                matched_ips.append(ip_val)
                if dom not in matched_domains:
                    matched_domains.append(dom)

    is_blocked = bool(sources)
    return is_blocked, matched_ips, matched_domains or list(svc["domains"]), sources


def source_label(sources):
    if sources >= {"blocklist", "probe"}:
        return {
            "id": "blocklist+probe",
            "es": "Blocklist pública + sonda residencial",
            "en": "Public blocklist + residential probe"
        }
    if "probe" in sources:
        return {
            "id": "probe",
            "es": "Sonda residencial (redirect verificado)",
            "en": "Residential probe (verified redirect)"
        }
    return {
        "id": "blocklist",
        "es": "Lista pública de IPs bloqueadas",
        "en": "Public blocked-IP list"
    }


def empty_service_hist():
    return {
        "total_blocked_seconds": 0,
        "current_incident_start": None,
        "last_incident": None,
        "daily_buckets": {}
    }


def empty_history():
    return {
        "schema_version": HISTORY_SCHEMA_VERSION,
        "last_check_ts": now_ts,
        "active_incidents": {},
        "incidents": [],
        "services": {}
    }


def is_measured_incident(inc):
    src = inc.get("source") or inc.get("source_id")
    return src in ("blocklist", "probe", "blocklist+probe")


def last_incident_from(inc):
    start_ts = inc.get("start_ts") or 0
    start_dt = datetime.datetime.fromtimestamp(start_ts, datetime.timezone.utc) if start_ts else now_utc
    formatted = format_date_human(start_dt)
    return {
        "start_ts": start_ts,
        "end_ts": inc.get("end_ts"),
        "duration_seconds": inc.get("duration_seconds", 0),
        "date_str": formatted["es"],
        "date_en": formatted["en"]
    }


def migrate_history(data):
    measured = [inc for inc in data.get("incidents", []) if is_measured_incident(inc)]
    old_services = data.get("services") or {}
    new_services = {}

    for svc in SERVICE_DEFINITIONS:
        sid = svc["id"]
        old = old_services.get(sid) or {}
        start = old.get("current_incident_start")
        keep_start = None
        if isinstance(start, int) and start > 0 and (now_ts - start) < 48 * 3600:
            keep_start = start

        today_secs = 0
        buckets = old.get("daily_buckets") or {}
        if keep_start and today_str in buckets:
            today_secs = int(buckets.get(today_str) or 0)

        resolved = [i for i in measured if i.get("service_id") == sid and i.get("status") == "resolved"]
        resolved.sort(key=lambda x: x.get("start_ts", 0), reverse=True)

        total = sum(int(i.get("duration_seconds") or 0) for i in resolved)
        if keep_start:
            total += max(0, now_ts - keep_start)

        last = last_incident_from(resolved[0]) if resolved else None
        new_services[sid] = {
            "total_blocked_seconds": total,
            "current_incident_start": keep_start,
            "last_incident": last,
            "daily_buckets": {today_str: today_secs} if today_secs else {}
        }

    old_active = data.get("active_incidents") or {}
    new_active = {}
    for sid, inc in old_active.items():
        if is_measured_incident(inc) or (isinstance(inc, dict) and inc.get("status") == "ongoing"):
            if not inc.get("source"):
                inc = dict(inc)
                inc["source"] = "blocklist"
                inc["source_es"] = "Lista pública de IPs bloqueadas"
                inc["source_en"] = "Public blocked-IP list"
            new_active[sid] = inc

    return {
        "schema_version": HISTORY_SCHEMA_VERSION,
        "last_check_ts": data.get("last_check_ts", now_ts),
        "active_incidents": new_active,
        "incidents": measured,
        "services": new_services
    }


def load_services_history():
    if os.path.exists(SERVICES_HISTORY_FILE):
        try:
            with open(SERVICES_HISTORY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and "services" in data:
                # v2 opened false Cloudflare/LE incidents from the static OONI IPv6 dump.
                if data.get("schema_version", 1) < 3:
                    return empty_history()
                if data.get("schema_version", 1) < HISTORY_SCHEMA_VERSION:
                    return migrate_history(data)
                # Still strip leftover seed rows if a v2 file was edited by hand
                data["incidents"] = [i for i in data.get("incidents", []) if is_measured_incident(i)]
                data.setdefault("active_incidents", {})
                return data
        except Exception as e:
            print("Error loading services history:", e, file=sys.stderr)
    return empty_history()


def build_incident(svc, start_ts, matched_ips, matched_domains, sources, status="ongoing"):
    start_dt = datetime.datetime.fromtimestamp(start_ts, datetime.timezone.utc)
    date_only = format_date_only(start_dt)
    shown, total_ips = clip_ips(matched_ips)
    src = source_label(sources)
    payload = {
        "id": f"INC-{start_dt.strftime('%Y%m%d')}-{svc['id'].upper()}-{start_dt.strftime('%H%M')}",
        "service_id": svc["id"],
        "service_name": svc["name"],
        "status": status,
        "start_ts": start_ts,
        "end_ts": None,
        "date_es": date_only["es"],
        "date_en": date_only["en"],
        "time_window_es": f"{start_dt.strftime('%H:%M')} UTC – En curso",
        "time_window_en": f"{start_dt.strftime('%H:%M')} UTC – Ongoing",
        "affected_targets": matched_domains or list(svc["domains"]),
        "blocked_ips": shown,
        "blocked_ips_total": total_ips,
        "cause_es": CAUSE_ES,
        "cause_en": CAUSE_EN,
        "impact_es": svc["impact_es"],
        "impact_en": svc["impact_en"],
        "mitigation_es": svc["mitigation_es"],
        "mitigation_en": svc["mitigation_en"],
        "legal_basis": LEGAL_BASIS,
        "source": src["id"],
        "source_es": src["es"],
        "source_en": src["en"]
    }
    if svc["id"] == "cloudflare":
        payload["cause_es"] = (
            f"Lista en vivo con {cf_v4_blocked_count} IPv4 Cloudflare "
            f"(umbral de incidencia: ≥{CF_MASS_V4_MIN} IPv4 o ≥{CF_MASS_V6_MIN} IPv6 de sonda). "
            "Las IPv6 OONI se listan en la tabla pero no abren por sí solas esta incidencia. "
            "No se atribuye el autor más allá de la coincidencia con la lista pública / sonda."
        )
        payload["cause_en"] = (
            f"Live list contains {cf_v4_blocked_count} Cloudflare IPv4 addresses "
            f"(incident threshold: ≥{CF_MASS_V4_MIN} IPv4 or ≥{CF_MASS_V6_MIN} probe IPv6). "
            "OONI IPv6 rows are shown in the table but do not open this incident by themselves. "
            "This record does not by itself identify who ordered the block."
        )
        payload["impact_es"] = (
            f"{cf_v4_blocked_count} IPv4 y {cf_v6_blocked_count} IPv6 anycast de Cloudflare en la lista; "
            "cualquier sitio que resuelva a esas IPs queda cortado en las operadoras que aplican el filtro."
        )
        payload["impact_en"] = (
            f"{cf_v4_blocked_count} IPv4 and {cf_v6_blocked_count} IPv6 Cloudflare anycast addresses listed; "
            "any site resolving to those IPs is cut off on ISPs applying the filter."
        )
    return payload


history_data = load_services_history()
last_check_ts = history_data.get("last_check_ts", now_ts)
elapsed_s = max(0, min(180, now_ts - last_check_ts))

active_inc_map = history_data.setdefault("active_incidents", {})
all_incidents_list = history_data.setdefault("incidents", [])
history_data.setdefault("services", {})

services_output = []
inspections = {}

for svc in SERVICE_DEFINITIONS:
    inspections[svc["id"]] = inspect_service(svc)

for svc in SERVICE_DEFINITIONS:
    svc_id = svc["id"]
    svc_hist = history_data["services"].setdefault(svc_id, empty_service_hist())
    is_curr_blocked, matched_ips, matched_domains, sources = inspections[svc_id]

    if is_curr_blocked:
        if elapsed_s > 0:
            svc_hist["total_blocked_seconds"] = int(svc_hist.get("total_blocked_seconds") or 0) + elapsed_s
            buckets = svc_hist.setdefault("daily_buckets", {})
            buckets[today_str] = int(buckets.get(today_str, 0)) + elapsed_s

        if svc_hist.get("current_incident_start") is None:
            svc_hist["current_incident_start"] = now_ts

        start_ts = svc_hist["current_incident_start"]
        if svc_id not in active_inc_map:
            active_inc_map[svc_id] = build_incident(
                svc, start_ts, matched_ips, matched_domains, sources, status="ongoing"
            )
        else:
            act = active_inc_map[svc_id]
            shown, total_ips = clip_ips(matched_ips)
            src = source_label(sources)
            act["blocked_ips"] = shown
            act["blocked_ips_total"] = total_ips
            act["affected_targets"] = matched_domains or act.get("affected_targets") or list(svc["domains"])
            act["source"] = src["id"]
            act["source_es"] = src["es"]
            act["source_en"] = src["en"]
            act["status"] = "ongoing"
            start_dt = datetime.datetime.fromtimestamp(act.get("start_ts") or start_ts, datetime.timezone.utc)
            act["time_window_es"] = f"{start_dt.strftime('%H:%M')} UTC – En curso"
            act["time_window_en"] = f"{start_dt.strftime('%H:%M')} UTC – Ongoing"
            if not act.get("legal_basis"):
                act["legal_basis"] = LEGAL_BASIS
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

            if svc_id in active_inc_map:
                act = active_inc_map.pop(svc_id)
                act["status"] = "resolved"
                act["end_ts"] = now_ts
                act["duration_seconds"] = inc_dur
                act["duration_formatted"] = format_duration(inc_dur)
                act["time_window_es"] = f"{inc_dt.strftime('%H:%M')} – {now_utc.strftime('%H:%M')} UTC"
                act["time_window_en"] = f"{inc_dt.strftime('%H:%M')} – {now_utc.strftime('%H:%M')} UTC"
                if not is_measured_incident(act):
                    src = source_label(sources or {"blocklist"})
                    act["source"] = src["id"]
                    act["source_es"] = src["es"]
                    act["source_en"] = src["en"]
                all_incidents_list.insert(0, act)

    daily_buckets = svc_hist.get("daily_buckets", {})
    blocked_today_s = int(daily_buckets.get(today_str, 0) or 0)
    blocked_7d_s = 0
    blocked_30d_s = 0

    for d_str, secs in list(daily_buckets.items()):
        try:
            d_obj = datetime.date.fromisoformat(d_str)
            days_ago = (now_utc.date() - d_obj).days
            if 0 <= days_ago < 7:
                blocked_7d_s += int(secs or 0)
            if 0 <= days_ago <= 30:
                blocked_30d_s += int(secs or 0)
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
        "critical": svc.get("critical", False),
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
        "total_blocked_s": int(svc_hist.get("total_blocked_seconds", 0) or 0),
        "total_blocked_formatted": format_duration(int(svc_hist.get("total_blocked_seconds", 0) or 0)),
        "domains": svc["domains"],
        "impact_es": svc["impact_es"],
        "impact_en": svc["impact_en"],
        "mitigation_es": svc["mitigation_es"],
        "mitigation_en": svc["mitigation_en"]
    })

display_incidents = []
for act in active_inc_map.values():
    dur = max(0, now_ts - int(act.get("start_ts") or now_ts))
    display_incidents.append({
        **act,
        "duration_seconds": dur,
        "duration_formatted": format_duration(dur)
    })

for inc in all_incidents_list:
    if is_measured_incident(inc):
        display_incidents.append(inc)

display_incidents.sort(key=lambda x: x.get("start_ts", 0), reverse=True)

history_data["schema_version"] = HISTORY_SCHEMA_VERSION
history_data["last_check_ts"] = now_ts
history_data["incidents"] = [i for i in all_incidents_list if is_measured_incident(i)]
try:
    os.makedirs(os.path.dirname(SERVICES_HISTORY_FILE), exist_ok=True)
    temp_hist = SERVICES_HISTORY_FILE + ".tmp"
    with open(temp_hist, "w", encoding="utf-8") as f:
        json.dump(history_data, f, indent=2)
    os.chmod(temp_hist, 0o644)
    os.replace(temp_hist, SERVICES_HISTORY_FILE)
except Exception as e:
    print("Error saving services history:", e, file=sys.stderr)

total_incident_duration_s = sum(int(inc.get("duration_seconds") or 0) for inc in display_incidents)

data = {
    "last_updated": now_utc.strftime("%Y-%m-%d %H:%M:%S UTC"),
    "timestamp": now_ts,
    "evasion_active": total_blocked > 0,
    "total_blocked": total_blocked,
    "cf_blocked_count": cf_blocked_count,
    "cf_v4_blocked_count": cf_v4_blocked_count,
    "cf_v6_blocked_count": cf_v6_blocked_count,
    "evaded_count": evaded_count,
    "cf_mass_block": cf_mass_block,
    "services_affected_count": sum(1 for s in services_output if s["is_affected"]),
    "services_total_count": len(services_output),
    "services": services_output,
    "incidents_summary": {
        "total_incidents": len(display_incidents),
        "total_duration_seconds": total_incident_duration_s,
        "total_duration_formatted": format_duration(total_incident_duration_s),
        "affected_services_count": len(set(inc.get("service_id") for inc in display_incidents))
    },
    "incidents": display_incidents,
    "entries": entries
}

for out_path in [OUT_WEB, OUT_WWW]:
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    temp = out_path + ".tmp"
    with open(temp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    os.chmod(temp, 0o644)
    os.replace(temp, out_path)

print(
    f"Blocked dashboard JSON: {total_blocked} IPs "
    f"(CF v4={cf_v4_blocked_count} v6={cf_v6_blocked_count}, mass={cf_mass_block}), "
    f"{len(services_output)} services, {len(display_incidents)} measured incidents."
)
