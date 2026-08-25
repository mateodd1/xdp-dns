#!/usr/bin/env python3
"""dnsleak-gate — observador autoritativo efímero para _check.xdp.es (proyecto xpd-dns).
Escucha DNS (UDP+TCP) en GATE_IP:53 y expone API HTTP en 127.0.0.1:8088.
Las observaciones (token, ip_origen) viven <=120 s EN MEMORIA. Sin disco, sin logs.
Enriquecimiento opcional: ASN/organización del resolver vía Team Cymru (con caché)."""
import socket, struct, threading, time, re, json, subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GATE_IP   = "85.208.114.54"        # gate dns-leak (IPv4 pública dedicada)
ZONE      = "_check.xdp.es"
TOKEN_RE  = re.compile(r"^[0-9a-f]{6,32}$")
OBS_TTL   = 120                     # vida de una observación (segundos)
MAX_TOKENS= 50000                   # tope anti-abuso

obs = {}                            # token -> [{"src_ip":…, "ts":…}, …]
lock = threading.Lock()

def record(token, src_ip):
    now = time.time()
    with lock:
        lst = obs.setdefault(token, [])
        lst.append({"src_ip": src_ip, "ts": now})
        if len(obs) > MAX_TOKENS:                       # purga anti-abuso
            for k in sorted(obs, key=lambda k: obs[k][-1]["ts"])[:MAX_TOKENS // 2]:
                del obs[k]
        cutoff = now - OBS_TTL                          # purga perezosa por expiración
        for k in [k for k, v in obs.items() if v and v[-1]["ts"] < cutoff]:
            del obs[k]

# ---------- Enriquecimiento ASN (Team Cymru, igual que generate-blocked-json) ----------
_asn_cache = {}                     # ip -> {"asn": int|None, "org": str|None}
ASN_CACHE_TTL = 7 * 24 * 3600       # 7 días

def _dig_txt(query):
    try:
        r = subprocess.run(["/usr/bin/dig", "+short", "+time=2", "+tries=1", "TXT", query],
                           capture_output=True, timeout=4,
                           encoding="utf-8", errors="replace")
        lines = [l.strip().strip('"') for l in r.stdout.splitlines() if l.strip()]
        return lines[0] if lines else None
    except Exception:
        return None

def _short_as_name(raw):
    """Nombre legible del AS. Si el nombre corto trae guiones bajos o rarezas RIPE
    ('Telefonica_de_EspaNa'), usa la organización formal recortando país."""
    raw = raw.strip()
    if " - " in raw:
        short, org_full = [s.strip() for s in raw.split(" - ", 1)]
    else:
        short, org_full = raw, ""
    if "_" in short:
        return org_full.split(",")[0].strip() or short.replace("_", " ")
    return short.split(",")[0].replace("_", " ").strip() or raw

def lookup_asn(ip_str):
    """Devuelve {'asn': int|None, 'name': str|None} para una IP (con caché)."""
    cached = _asn_cache.get(ip_str)
    if cached and time.time() - cached[0] < ASN_CACHE_TTL:
        return cached[1]
    info = {"asn": None, "name": None}
    try:
        import ipaddress
        ip = ipaddress.ip_address(ip_str)
        zone = "origin.asn.cymru.com" if ip.version == 4 else "origin6.asn.cymru.com"
        base = ip.reverse_pointer.rsplit(".", 2)[0]
        raw = _dig_txt(f"{base}.{zone}")
        if raw and "|" in raw:
            fields = [f.strip() for f in raw.split("|")]
            if fields and fields[0].isdigit():
                info["asn"] = int(fields[0])
                org_raw = _dig_txt(f"AS{info['asn']}.asn.cymru.com")
                if org_raw and "|" in org_raw:
                    ofields = [f.strip() for f in org_raw.split("|")]
                    if len(ofields) >= 5 and ofields[4]:
                        info["name"] = _short_as_name(ofields[4])
    except Exception:
        pass
    _asn_cache[ip_str] = (time.time(), info)
    if len(_asn_cache) > 10000:
        _asn_cache.clear()          # salvaguarda anti-crecimiento
    return info

# ---------- DNS wire ----------
def read_name(data, off):
    labels, jumped, final = [], False, off
    while True:
        if off >= len(data): raise ValueError("truncated")
        l = data[off]
        if l == 0:
            off += 1
            break
        if l & 0xC0 == 0xC0:
            ptr = ((l & 0x3F) << 8) | data[off + 1]
            if not jumped:
                final = off + 2
            off, jumped = ptr, True
            continue
        labels.append(data[off + 1:off + 1 + l].decode("latin1"))
        off += 1 + l
    return ".".join(labels) + ".", (final if jumped else off)

def enc_name(name):
    out = b""
    for lab in name.rstrip(".").split("."):
        b = lab.encode()
        out += bytes([len(b)]) + b
    return out + b"\x00"

def nxdomain(qdata, qend):
    """NXDOMAIN AA con SOA de la zona (minimum=0 → sin caché negativa)."""
    soa_name = enc_name(ZONE)
    mname    = enc_name("ns-check.xdp.es")
    rname    = enc_name("hostmaster.xdp.es")
    rdata    = mname + rname + struct.pack("!IIIII", int(time.time()), 7200, 900, 1209600, 0)
    return (qdata[:2]
            + struct.pack("!HHHHH", 0x8503, 1, 0, 1, 0)   # QR|AA|RD, rcode=3 (NXDOMAIN)
            + qdata[12:qend]                              # eco de la sección question
            + soa_name + struct.pack("!HHIH", 6, 1, 0, len(rdata))
            + rdata)

def handle_dns(data, src_ip):
    if len(data) < 12:
        return None
    try:
        qname, qend = read_name(data, 12)
        if len(data) < qend + 4:
            return None
    except Exception:
        return None
    q = qname.rstrip(".").lower()
    if q.endswith("." + ZONE):
        token = q[: -(len(ZONE) + 1)]
        if TOKEN_RE.match(token):
            record(token, src_ip)
    return nxdomain(data, qend + 4)

# ---------- listeners DNS ----------
def udp_loop():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.bind((GATE_IP, 53))
    while True:
        data, addr = s.recvfrom(4096)
        try:
            resp = handle_dns(data, addr[0])
            if resp:
                s.sendto(resp, addr)
        except Exception:
            pass

def tcp_loop():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((GATE_IP, 53))
    s.listen(16)
    while True:
        conn, addr = s.accept()
        threading.Thread(target=tcp_session, args=(conn, addr), daemon=True).start()

def tcp_session(conn, addr):
    try:
        conn.settimeout(3)
        hdr = b""
        while len(hdr) < 2:
            chunk = conn.recv(2 - len(hdr))
            if not chunk:
                return
            hdr += chunk
        (ln,) = struct.unpack("!H", hdr)
        data = b""
        while len(data) < ln:
            chunk = conn.recv(ln - len(data))
            if not chunk:
                return
            data += chunk
        resp = handle_dns(data, addr[0])
        if resp:
            conn.sendall(struct.pack("!H", len(resp)) + resp)
    except Exception:
        pass
    finally:
        conn.close()

# ---------- API watch ----------
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):          # silencio total (coherente con zero-logs)
        pass
    def do_GET(self):
        if self.path == "/health":
            return self._json(200, {"ok": True})
        m = re.match(r"^/watch/([0-9a-fA-F]{6,32})$", self.path)
        if not m:
            return self._json(404, {"error": "not found"})
        tok = m.group(1).lower()
        now = time.time()
        seen_ips = []
        with lock:
            for o in obs.get(tok, []):
                if o["src_ip"] not in seen_ips and now - o["ts"] < OBS_TTL:
                    seen_ips.append(o["src_ip"])
        resolvers = []
        for ip in seen_ips:
            entry = {"src_ip": ip}
            if ip not in ("85.208.114.51", "85.208.114.52"):
                entry.update(lookup_asn(ip))          # ASN/nombre solo para resolutores externos
            resolvers.append(entry)
        self._json(200, {"seen": bool(seen_ips), "resolvers": resolvers})
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

if __name__ == "__main__":
    threading.Thread(target=udp_loop, daemon=True).start()
    threading.Thread(target=tcp_loop, daemon=True).start()
    ThreadingHTTPServer(("127.0.0.1", 8088), Handler).serve_forever()
