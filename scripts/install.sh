#!/usr/bin/env bash
# ==============================================================================
# xdp.es - High-Performance Recursive DNS, DoH & DoT Installer
# Automated Setup for Debian / Ubuntu
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Instalador del Servidor DNS Recursivo xdp.es        ${NC}"
echo -e "${BLUE}  Unbound (53/UDP/TCP) + Blocky (DoH/DoT) + Caddy      ${NC}"
echo -e "${BLUE}======================================================${NC}"

# Check root
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}[ERROR] Este script debe ejecutarse como root.${NC}"
    exit 1
fi

PROJECT_DIR="/root/xpd-dns"
WEBROOT="/var/www/xdp.es"
SSL_DIR="/etc/ssl/certs"

echo -e "\n${YELLOW}[1/7] Instalando paquetes y dependencias del sistema...${NC}"
apt-get update -y
apt-get install -y unbound dnsutils curl wget tar python3 python3-pip openssl libcap2-bin caddy debian-keyring debian-archive-keyring apt-transport-https

echo -e "\n${YELLOW}[2/7] Descargando e instalando binario de Blocky...${NC}"
BLOCKY_VERSION="v0.34.0"
BLOCKY_TAR="blocky_${BLOCKY_VERSION}_Linux_x86_64.tar.gz"
BLOCKY_URL="https://github.com/0xERR0R/blocky/releases/download/${BLOCKY_VERSION}/${BLOCKY_TAR}"

mkdir -p /tmp/blocky_install
cd /tmp/blocky_install
curl -sSL -o "${BLOCKY_TAR}" "${BLOCKY_URL}"
tar -xzf "${BLOCKY_TAR}"
mv blocky /usr/local/bin/blocky
chmod +x /usr/local/bin/blocky
setcap 'cap_net_bind_service=+ep' /usr/local/bin/blocky
cd "${PROJECT_DIR}"
rm -rf /tmp/blocky_install
echo -e "${GREEN}Blocky instalado correctamente.${NC}"

echo -e "\n${YELLOW}[3/7] Configurando optimizaciones del kernel (sysctl)...${NC}"
cp "${PROJECT_DIR}/systemd/99-dns-tuning.conf" /etc/sysctl.d/99-dns-tuning.conf
sysctl -p /etc/sysctl.d/99-dns-tuning.conf || true

echo -e "\n${YELLOW}[4/7] Configurando Unbound (DNSSEC, Root Hints y Caché)...${NC}"
mkdir -p /var/lib/unbound /etc/unbound/unbound.conf.d
curl -s -o /var/lib/unbound/root.hints https://www.internic.net/domain/named.root
unbound-anchor -a /var/lib/unbound/root.key || true
chown -R unbound:unbound /var/lib/unbound /etc/unbound || true

cp "${PROJECT_DIR}/unbound/unbound.conf" /etc/unbound/unbound.conf
unbound-checkconf /etc/unbound/unbound.conf

echo -e "\n${YELLOW}[5/7] Configurando certificados SSL para DoT / Caddy...${NC}"
mkdir -p "${SSL_DIR}"
if [ ! -f "${SSL_DIR}/dns.xdp.es.fullchain.pem" ]; then
    echo "Generando certificado TLS autofirmado provisional para DoT..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${SSL_DIR}/dns.xdp.es.privkey.pem" \
        -out "${SSL_DIR}/dns.xdp.es.fullchain.pem" \
        -subj "/CN=dns.xdp.es" 2>/dev/null
    chmod 600 "${SSL_DIR}/dns.xdp.es.privkey.pem"
    chmod 644 "${SSL_DIR}/dns.xdp.es.fullchain.pem"
fi

echo -e "\n${YELLOW}[6/7] Desplegando Landing Page y perfiles Apple...${NC}"
mkdir -p "${WEBROOT}"
cp -r "${PROJECT_DIR}/web/"* "${WEBROOT}/"
chown -R www-data:www-data "${WEBROOT}" || chown -R caddy:caddy "${WEBROOT}" || true

mkdir -p /var/log/caddy
chown -R caddy:caddy /var/log/caddy || true
cp "${PROJECT_DIR}/caddy/Caddyfile" /etc/caddy/Caddyfile

echo -e "\n${YELLOW}[7/7] Instalando y activando servicios systemd...${NC}"
cp "${PROJECT_DIR}/systemd/blocky.service" /etc/systemd/system/blocky.service
cp "${PROJECT_DIR}/systemd/update-stats.service" /etc/systemd/system/update-stats.service
cp "${PROJECT_DIR}/systemd/update-stats.timer" /etc/systemd/system/update-stats.timer

systemctl daemon-reload
systemctl enable --now unbound
systemctl enable --now blocky
systemctl enable --now caddy
systemctl enable --now update-stats.timer

echo -e "\n${GREEN}======================================================${NC}"
echo -e "${GREEN}  ¡Instalación completada con éxito!                 ${NC}"
echo -e "${GREEN}======================================================${NC}"
echo -e "Estado de los servicios:"
echo -e " - Unbound (Puerto 53 DNS Recursivo): $(systemctl is-active unbound)"
echo -e " - Blocky (DoH 4000 & DoT 853):       $(systemctl is-active blocky)"
echo -e " - Caddy (HTTPS 443 & Landing 80):     $(systemctl is-active caddy)"
echo -e " - Stats Timer (Estadísticas 24h):     $(systemctl is-active update-stats.timer)"
echo -e "\nPuedes ejecutar las pruebas de diagnóstico con:"
echo -e "  bash /root/xpd-dns/scripts/test-dns.sh"
