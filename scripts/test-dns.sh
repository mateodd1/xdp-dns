#!/usr/bin/env bash
# ==============================================================================
# xdp.es - DNS Stack Comprehensive Verification and Test Suite
# ==============================================================================

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Ejecutando Test Suite para xdp.es DNS Stack         ${NC}"
echo -e "${BLUE}======================================================${NC}"

PASS_COUNT=0
FAIL_COUNT=0

test_step() {
    local name="$1"
    local cmd="$2"
    echo -n -e "Testing ${YELLOW}${name}${NC}... "
    if eval "$cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}[OK]${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}[FALLÓ]${NC}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo -e "\n--- 1. Pruebas de Unbound (Recursión Pura & DNSSEC :5336) ---"
test_step "Unbound 127.0.0.1:5336 (UDP)" "dig @127.0.0.1 -p 5336 google.com A +short | grep -E '^[0-9.]+'"
test_step "Validación DNSSEC en Unbound" "dig @127.0.0.1 -p 5336 cloudflare.com +dnssec | grep -w 'flags:.*ad.*'"

echo -e "\n--- 2. Pruebas de DNS Evasion Proxy (:5335) ---"
test_step "Evasion Proxy 127.0.0.1:5335 (UDP)" "dig @127.0.0.1 -p 5335 google.com A +short | grep -E '^[0-9.]+'"

echo -e "\n--- 3. Pruebas de Blocky AdBlock (.51 / dns.xdp.es) ---"
test_step "Adblock IPv4 85.208.114.51:53 (UDP)" "dig @85.208.114.51 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Adblock IPv6 2a0e:97c0:c40::51:53" "dig @2a0e:97c0:c40::51 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Filtrado de Publicidad en .51 (0.0.0.0)" "dig @85.208.114.51 -p 53 doubleclick.net A +short | grep '0.0.0.0'"
test_step "Métricas Prometheus Blocky (:4000/metrics)" "curl -fs http://127.0.0.1:4000/metrics | grep 'blocky_'"
test_step "DoT Listener .51 (Puerto 853 TLS)" "timeout 3 openssl s_client -connect 85.208.114.51:853 </dev/null 2>&1 | grep -E 'CONNECTED|BEGIN CERTIFICATE'"

echo -e "\n--- 4. Pruebas de Blocky Lite Sin Filtrado (.52 / lite.xdp.es) ---"
test_step "Lite IPv4 85.208.114.52:53 (UDP)" "dig @85.208.114.52 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Lite IPv6 2a0e:97c0:c40::52:53" "dig @2a0e:97c0:c40::52 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Sin Filtrado en .52 (Resuelve Real IP)" "dig @85.208.114.52 -p 53 doubleclick.net A +short | grep -v '0.0.0.0'"
test_step "Métricas Prometheus Lite (:4002/metrics)" "curl -fs http://127.0.0.1:4002/metrics | grep 'blocky_'"
test_step "DoT Listener .52 (Puerto 853 TLS)" "timeout 3 openssl s_client -connect 85.208.114.52:853 </dev/null 2>&1 | grep -E 'CONNECTED|BEGIN CERTIFICATE'"

echo -e "\n--- 5. Pruebas de Caddy (Web HTTPS, DoH & Perfiles) ---"
test_step "Landing Page HTTPS xdp.es" "curl -fs https://xdp.es | grep -i 'xdp.es'"
test_step "Página de Estadísticas (/stats)" "curl -fs https://xdp.es/stats | grep -i 'Estadísticas'"
test_step "Stats JSON Endpoint (/stats.json)" "curl -fs https://xdp.es/stats.json | grep 'stats_24h'"
test_step "DoH Adblock (https://dns.xdp.es/dns-query)" "curl -fs -H 'accept: application/dns-message' 'https://dns.xdp.es/dns-query?dns=AAABAAABAAAAAAAABmdvb2dsZQNjb20AAAEAAQ'"
test_step "DoH Lite Sin Filtrado (https://lite.xdp.es/dns-query)" "curl -fs -H 'accept: application/dns-message' 'https://lite.xdp.es/dns-query?dns=AAABAAABAAAAAAAABmdvb2dsZQNjb20AAAEAAQ'"
test_step "Perfiles Apple Firmados (PKCS#7 Let's Encrypt)" "file /var/www/xdp.es/dns_xdp_es_doh.mobileconfig | grep -i 'PKCS#7' && file /var/www/xdp.es/lite_xdp_es_doh.mobileconfig | grep -i 'PKCS#7'"
test_step "Script de actualización de estadísticas" "python3 /root/xpd-dns/scripts/update-stats.py"

echo -e "\n${BLUE}======================================================${NC}"
echo -e "Resumen de Resultados: ${GREEN}${PASS_COUNT} Pasados${NC}, ${RED}${FAIL_COUNT} Fallados${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}¡Todos los componentes están funcionando perfectamente a pleno rendimiento!${NC}"
    exit 0
else
    echo -e "${YELLOW}Revisa los servicios con: systemctl status unbound blocky blocky-lite caddy${NC}"
    exit 1
fi
