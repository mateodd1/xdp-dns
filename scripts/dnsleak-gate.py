#!/usr/bin/env python3
"""dnsleak-gate — observador autoritativo efímero para _check.xdp.es (proyecto xpd-dns).
Escucha DNS (UDP+TCP) en GATE_IP:53 y expone API HTTP en 127.0.0.1:8088.
Las observaciones (token, ip_origen) viven <=120 s EN MEMORIA. Sin disco, sin logs.
Enriquecimiento opcional: ASN/organización del resolver vía Team Cymru (con caché)."""
import socket, struct, threading, time, re, json, subprocess, sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

GATE_IP   = "85.208.114.54"        # gate dns-leak (IPv4 pública dedicada)
GATE_IP6  = "2a0e:97c0:c40::54"     # gate dns-leak (IPv6 dedicada; ns-check publica A+AAAA)
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

QT_A, QT_NS, QT_SOA, QT_AAAA = 1, 2, 6, 28
ZONE_TTL = 60

def _soa_rr():
    rd = (enc_name("ns-check.xdp.es") + enc_name("hostmaster.xdp.es")
          + struct.pack("!IIIII", int(time.time()), 7200, 900, 1209600, 0))
    return enc_name(ZONE) + struct.pack("!HHIH", QT_SOA, 1, ZONE_TTL, len(rd)) + rd

def _ns_rr():
    rd = enc_name("ns-check.xdp.es")
    return enc_name(ZONE) + struct.pack("!HHIH", QT_NS, 1, ZONE_TTL, len(rd)) + rd

def _glue_rrs():
    a = (enc_name("ns-check.xdp.es") + struct.pack("!HHIH", QT_A, 1, ZONE_TTL, 4)
         + socket.inet_aton(GATE_IP))
    aaaa = (enc_name("ns-check.xdp.es") + struct.pack("!HHIH", QT_AAAA, 1, ZONE_TTL, 16)
            + socket.inet_pton(socket.AF_INET6, GATE_IP6))
    return a + aaaa

def _resp(qdata, qsec_end, rcode=0, an=0, ns=0, ar=0, ans=b"", auth=b"", add=b""):
    flags = 0x8500 | (rcode & 0x0F)                       # QR|AA|RD, RA=0
    return (qdata[:2] + struct.pack("!HHHHH", flags, 1, an, ns, ar)
            + qdata[12:qsec_end] + ans + auth + add)

def handle_dns(data, src_ip):
    if len(data) < 12:
        return None
    try:
        qname, qend = read_name(data, 12)
        if len(data) < qend + 4:
            return None
    except Exception:
        return None
    qtype = struct.unpack("!H", data[qend:qend + 2])[0]
    qsec_end = qend + 4
    q = qname.rstrip(".").lower()
    if not (q == ZONE or q.endswith("." + ZONE)):
        return _resp(data, qsec_end, rcode=3, ns=1, auth=_soa_rr())    # NXDOMAIN fuera de zona
    if q != ZONE:                                                      # subdominio -> posible token
        token = q[: -(len(ZONE) + 1)]
        if TOKEN_RE.match(token):
            record(token, src_ip)
    # Autoritativo sano: SOA/NS en el ápice y NODATA (NOERROR) en el resto de la zona.
    # NUNCA NXDOMAIN dentro de la zona: unbound (harden-below-nxdomain + qname-min) trataría
    # la delegación como rota y devolvería SERVFAIL sin llegar a observar el token.
    if q == ZONE and qtype == QT_SOA:
        return _resp(data, qsec_end, an=1, ans=_soa_rr())
    if q == ZONE and qtype == QT_NS:
        return _resp(data, qsec_end, an=1, ar=2, ans=_ns_rr(), add=_glue_rrs())
    return _resp(data, qsec_end, ns=1, auth=_soa_rr())                 # NODATA (NOERROR)

# ---------- listeners DNS ----------
def udp_loop(s):
    while True:
        data, addr = s.recvfrom(4096)
        try:
            resp = handle_dns(data, addr[0])
            if resp:
                s.sendto(resp, addr)
        except Exception:
            pass

def tcp_loop(s):
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

def bind_gate(retries=60, delay=2):
    """Bindea UDP+TCP en IPv4 (GATE_IP) e IPv6 (GATE_IP6), puerto 53, desde el
    hilo principal. Es todo-o-nada por intento: ns-check publica A+AAAA, así que
    ambas familias deben responder o la delegación queda coja en una de ellas.
    Si alguna IP dedicada aún no está asignada al arrancar (carrera con la red),
    reintenta en el propio proceso ~2 min antes de rendirse. No sale de inmediato:
    con RestartSec=100ms y StartLimitBurst=5, systemd abandonaría en <1 s."""
    targets = [(socket.AF_INET, GATE_IP), (socket.AF_INET6, GATE_IP6)]
    for attempt in range(retries):
        made = []
        try:
            for family, ip in targets:
                udp = socket.socket(family, socket.SOCK_DGRAM); made.append(("udp", udp))
                tcp = socket.socket(family, socket.SOCK_STREAM); made.append(("tcp", tcp))
                for s in (udp, tcp):
                    if family == socket.AF_INET6:
                        s.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 1)
                tcp.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                udp.bind((ip, 53))
                tcp.bind((ip, 53))
                tcp.listen(16)
            return made
        except OSError as e:
            for _, s in made:
                try: s.close()
                except Exception: pass
            print(f"bind gate:53 failed ({e}); retry {attempt+1}/{retries} in {delay}s",
                  file=sys.stderr, flush=True)
            time.sleep(delay)
    print(f"gate sockets unavailable after {retries} tries; exiting",
          file=sys.stderr, flush=True)
    sys.exit(1)

if __name__ == "__main__":
    for kind, s in bind_gate():
        loop = udp_loop if kind == "udp" else tcp_loop
        threading.Thread(target=loop, args=(s,), daemon=True).start()
    ThreadingHTTPServer(("127.0.0.1", 8088), Handler).serve_forever()
