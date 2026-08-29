#!/usr/bin/env bash
# Deploy hook for Let's Encrypt Wildcard certificate renewal
chmod 755 /etc/letsencrypt/live /etc/letsencrypt/archive
chmod 755 /etc/letsencrypt/live/xdp.es
chmod 644 /etc/letsencrypt/live/xdp.es/fullchain.pem
chmod 644 /etc/letsencrypt/live/xdp.es/privkey.pem 2>/dev/null || true
chmod 644 /etc/letsencrypt/archive/xdp.es/privkey*.pem 2>/dev/null || true

systemctl reload caddy 2>/dev/null || systemctl restart caddy 2>/dev/null || true
systemctl restart blocky 2>/dev/null || true
systemctl restart xdp-doq-dot 2>/dev/null || true
/root/xpd-dns/scripts/sign-mobileconfig.sh 2>/dev/null || true

# Re-publica el cert activo (IP o wildcard) para Blocky/dnsproxy/Caddy
/usr/local/sbin/xdp-tls-select.sh 2>/dev/null || true
