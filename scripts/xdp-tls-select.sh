#!/usr/bin/env bash
# Publica en /etc/xdp-tls el certificado a usar por Blocky/dnsproxy/Caddy:
#  - el cert corto con IPs (/etc/letsencrypt-ip, 6 días) si le quedan >24h
#  - si no, el wildcard *.xdp.es (90 días) como fallback: nunca servir un cert caducado.
# Reinicia/recarga servicios SOLO si el cert publicado cambia.
set -uo pipefail
IPC=/etc/letsencrypt-ip/live/xdp-ip
WC=/etc/letsencrypt/live/xdp.es
OUT=/etc/xdp-tls
mkdir -p "$OUT"
if [[ -f "$IPC/fullchain.pem" ]] && openssl x509 -checkend 86400 -noout -in "$IPC/fullchain.pem" >/dev/null 2>&1; then
    SRC="$IPC"; WHICH="ip-cert (IPs+dns/lite)"
else
    SRC="$WC"; WHICH="WILDCARD fallback (cert IP ausente o <24h)"
    logger -t xdp-tls-select "AVISO: usando wildcard como fallback; revisa la renovacion del cert de IP" || true
fi
if cmp -s "$SRC/fullchain.pem" "$OUT/fullchain.pem" && cmp -s "$SRC/privkey.pem" "$OUT/privkey.pem"; then
    echo "xdp-tls: sin cambios ($WHICH)"; exit 0
fi
install -m 644 "$SRC/fullchain.pem" "$OUT/fullchain.pem.tmp" && mv -f "$OUT/fullchain.pem.tmp" "$OUT/fullchain.pem"
install -m 644 "$SRC/privkey.pem"   "$OUT/privkey.pem.tmp"   && mv -f "$OUT/privkey.pem.tmp"   "$OUT/privkey.pem"
echo "xdp-tls: publicado $WHICH -> $OUT"; logger -t xdp-tls-select "publicado $WHICH" || true
systemctl reload caddy 2>/dev/null || systemctl restart caddy 2>/dev/null || true
for s in blocky blocky-lite xdp-doq-dot xdp-lite-doq; do systemctl restart "$s" 2>/dev/null || true; done
