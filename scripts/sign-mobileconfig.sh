#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="/etc/letsencrypt/live/dns.xdp.es"
CERT_FILE="${CERT_DIR}/cert.pem"
KEY_FILE="${CERT_DIR}/privkey.pem"
CHAIN_FILE="${CERT_DIR}/chain.pem"

SRC_DIR="/root/xpd-dns/web"
DEST_DIRS=("/root/xpd-dns/web" "/var/www/xdp.es" "/var/www/xpd.es")

if [[ ! -f "$CERT_FILE" || ! -f "$KEY_FILE" || ! -f "$CHAIN_FILE" ]]; then
    echo "Error: Certbot certificates not found in $CERT_DIR"
    exit 1
fi

echo "Firmando perfiles Apple (.mobileconfig) con certificado Let's Encrypt..."

# Create temporary unsigned source backups if needed
for profile in "dns_xdp_es_doh" "dns_xdp_es_dot"; do
    raw_file="${SRC_DIR}/${profile}.unsigned.mobileconfig"
    target_file="${SRC_DIR}/${profile}.mobileconfig"
    
    # If unsigned template doesn't exist yet, create it from current plain xml
    if [[ ! -f "$raw_file" ]]; then
        cp "$target_file" "$raw_file"
    fi
    
    temp_signed=$(mktemp)
    
    # Sign with OpenSSL SMIME in DER format (Apple PKCS#7 format)
    openssl smime -sign \
        -in "$raw_file" \
        -out "$temp_signed" \
        -signer "$CERT_FILE" \
        -inkey "$KEY_FILE" \
        -certfile "$CHAIN_FILE" \
        -outform der \
        -nodetach

    for dest in "${DEST_DIRS[@]}"; do
        if [[ -d "$dest" ]]; then
            cp "$temp_signed" "${dest}/${profile}.mobileconfig"
            chmod 644 "${dest}/${profile}.mobileconfig"
            chown www-data:www-data "${dest}/${profile}.mobileconfig" 2>/dev/null || chown caddy:caddy "${dest}/${profile}.mobileconfig" 2>/dev/null || true
        fi
    done
    
    rm -f "$temp_signed"
    echo " -> ${profile}.mobileconfig firmado correctamente."
done

# Restart Blocky to ensure updated TLS certificates are active on port 853
systemctl restart blocky 2>/dev/null || true

echo "¡Todos los perfiles de Apple (.mobileconfig) han sido firmados con éxito!"
