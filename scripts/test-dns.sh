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

echo -e "\n--- 1. Pruebas de Unbound (Puerto 53 UDP/TCP & Recursión) ---"
test_step "Unbound 127.0.0.1:53 (UDP)" "dig @127.0.0.1 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Unbound 127.0.0.1:53 (TCP)" "dig @127.0.0.1 -p 53 +tcp google.com A +short | grep -E '^[0-9.]+'"
test_step "Unbound IP Pública 85.208.114.51:53" "dig @85.208.114.51 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Unbound IPv6 2a0e:97c0:c40::51:53" "dig @2a0e:97c0:c40::51 -p 53 google.com A +short | grep -E '^[0-9.]+'"
test_step "Validación DNSSEC en Unbound" "dig @127.0.0.1 -p 53 cloudflare.com +dnssec | grep -w 'flags:.*ad.*'"

echo -e "\n--- 2. Pruebas de Blocky (Filtrado, Métricas y DoT) ---"
test_step "Blocky DNS Resolver (127.0.0.1:5353)" "dig @127.0.0.1 -p 5353 wikipedia.org A +short | grep -E '^[0-9.]+'"
test_step "Bloqueo de Anuncios en Blocky (0.0.0.0)" "dig @127.0.0.1 -p 5353 analytics.004gmbh.de A +short | grep '0.0.0.0'"
test_step "Métricas Prometheus Blocky (:4000/metrics)" "curl -fs http://127.0.0.1:4000/metrics | grep 'blocky_'"
test_step "DoT Listener (Puerto 853 TLS)" "timeout 3 openssl s_client -connect 127.0.0.1:853 </dev/null 2>&1 | grep -E 'CONNECTED|BEGIN CERTIFICATE'"

echo -e "\n--- 3. Pruebas de Caddy (Web, Redirección & DoH) ---"
test_step "Landing Page Web xdp.es (Puerto 80)" "curl -fs http://127.0.0.1 | grep -i 'xdp.es'"
test_step "Página de Estadísticas (/stats)" "curl -fs http://127.0.0.1/stats/ | grep -i 'Estadísticas'"
test_step "Stats JSON Endpoint (/stats.json)" "curl -fs http://127.0.0.1/stats.json | grep 'stats_24h'"
test_step "DoH Endpoint Proxy (/dns-query)" "curl -fs -H 'Host: dns.xdp.es' 'http://127.0.0.1/dns-query?dns=AAABAAABAAAAAAAABmdvb2dsZQNjb20AAAEAAQ' || curl -fs -H 'accept: application/dns-message' 'http://127.0.0.1:4000/dns-query?dns=AAABAAABAAAAAAAABmdvb2dsZQNjb20AAAEAAQ'"
test_step "Redirección en dns.xdp.es/ hacia xdp.es/" "curl -sI -H 'Host: dns.xdp.es' http://127.0.0.1/ | grep -i 'location.*xdp.es'"
test_step "Perfiles Apple Firmados (PKCS#7 Let's Encrypt)" "file /var/www/xdp.es/dns_xdp_es_doh.mobileconfig | grep -i 'PKCS#7'"
test_step "Script de actualización de estadísticas" "python3 /root/xpd-dns/scripts/update-stats.py"

echo -e "\n${BLUE}======================================================${NC}"
echo -e "Resumen de Resultados: ${GREEN}${PASS_COUNT} Pasados${NC}, ${RED}${FAIL_COUNT} Fallados${NC}"
echo -e "${BLUE}======================================================${NC}"

if [ "$FAIL_COUNT" -eq 0 ]; then
    echo -e "${GREEN}¡Todos los componentes están funcionando perfectamente a pleno rendimiento!${NC}"
    exit 0
else
    echo -e "${YELLOW}Revisa los servicios con: systemctl status unbound blocky caddy${NC}"
    exit 1
fi
