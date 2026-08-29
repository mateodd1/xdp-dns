#!/usr/bin/env bash
# Publica/actualiza el registro HTTPS (ech=...) en Cloudflare con las claves ECH activas de Caddy.
# Caddy rota las claves cada 30 días (mantiene las viejas 90) -> este script corre a diario (timer).
# Registro: dns.xdp.es / lite.xdp.es / xdp.es  ->  "1 . alpn=h2,h3 ech=<ECHConfigList b64>"
set -euo pipefail
STORE=/var/lib/caddy/.local/share/caddy/ech/configs
CF_INI=/etc/letsencrypt/cloudflare.ini
ZONE=65c508acfd10024f250728f5e56ed49e
NAMES=(dns.xdp.es lite.xdp.es xdp.es)
TOK=$(grep -E '^dns_cloudflare_api_token' "$CF_INI" | sed 's/.*=\s*//')
LIST=$(python3 - "$STORE" <<'PY'
import glob,json,base64,struct,sys
S=sys.argv[1]; cfgs=[]
for d in sorted(glob.glob(S+"/*")):
    try: m=json.load(open(d+"/meta.json"))
    except Exception: continue
    r=m.get("Replaced","")
    if r and not r.startswith("0001-"): continue          # clave ya rotada: no anunciar
    cfgs.append(open(d+"/config.bin","rb").read())
body=b"".join(cfgs)
if not body: sys.exit("sin configs ECH en storage")
print(base64.b64encode(struct.pack("!H",len(body))+body).decode())
PY
)
VALUE="alpn=\"h2,h3\" ech=\"$LIST\""
api() { curl -s --max-time 15 -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" "$@"; }
for n in "${NAMES[@]}"; do
  # GUARDA: un HTTPS explícito hace que el nombre "exista" y el wildcard *.xdp.es deje de cubrirlo
  # (RFC 4592). Solo publicar si el nombre tiene A/AAAA/CNAME explícitos; si no, saltar y avisar.
  nrr=$(api "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records?name=$n" | python3 -c 'import sys,json;print(sum(1 for x in json.load(sys.stdin)["result"] if x["type"] in ("A","AAAA","CNAME")))')
  if [[ "$nrr" == "0" ]]; then echo "ech-publish: $n SIN A/AAAA/CNAME explícitos; no publico HTTPS (rompería el wildcard)"; logger -t xdp-ech-publish "$n sin A/AAAA explícitos: saltado" || true; continue; fi
  cur=$(api "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records?type=HTTPS&name=$n")
  id=$(echo "$cur" | python3 -c 'import sys,json;r=json.load(sys.stdin)["result"];print(r[0]["id"] if r else "")')
  curval=$(echo "$cur" | python3 -c 'import sys,json;r=json.load(sys.stdin)["result"];print(r[0]["data"].get("value","") if r else "")')
  if [[ "$curval" == "$VALUE" ]]; then echo "ech-publish: $n sin cambios"; continue; fi
  body=$(python3 -c 'import json,sys;print(json.dumps({"type":"HTTPS","name":sys.argv[1],"ttl":300,"data":{"priority":1,"target":".","value":sys.argv[2]}}))' "$n" "$VALUE")
  if [[ -n "$id" ]]; then r=$(api -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/$id" --data "$body")
  else r=$(api -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" --data "$body"); fi
  ok=$(echo "$r" | python3 -c 'import sys,json;d=json.load(sys.stdin);print("OK" if d.get("success") else "ERROR "+json.dumps(d.get("errors")))')
  echo "ech-publish: $n -> $ok"; logger -t xdp-ech-publish "$n -> $ok" || true
done
