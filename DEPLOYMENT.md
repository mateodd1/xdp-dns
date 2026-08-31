# 🌐 Arquitectura y Documentación de Despliegue — xdp.es DNS

> **Servicio DNS recursivo público, ultra-rápido, con validación DNSSEC completa, filtrado de publicidad/malware y sistema dinámico de evasión de bloqueos a redes CDN.**

---

## 📑 Tabla de Contenidos

1. [Visión General e Infraestructura](#1-visión-general-e-infraestructura)
2. [Diagrama de Flujo de Red](#2-diagrama-de-flujo-de-red)
3. [Direccionamiento y Endpoints Públicos](#3-direccionamiento-y-endpoints-públicos)
4. [Componentes del Stack](#4-componentes-del-stack)
   - [4.1 Caddy (Terminador Web, TLS, HTTP/2 y HTTP/3 DoH)](#41-caddy-servidor-web-tls-y-doh3)
   - [4.2 Blocky (Motor Principal de Filtrado, DNS53, DoT y Métricas)](#42-blocky-instancia-principal)
   - [4.3 Blocky OTA (Instancia Aislada para Bloqueo de Actualizaciones Apple)](#43-blocky-ota-instancia-apple-ota)
   - [4.4 Proxy de Evasión de Bloqueos (evade_proxy.py)](#44-proxy-de-evasión-de-bloqueos-evade_proxypy)
   - [4.5 Unbound (Resolver Recursivo Raíz y DNSSEC)](#45-unbound-resolver-recursivo-puro)
   - [4.6 dnsproxy (DNS over QUIC / DoQ)](#46-dnsproxy-dns-over-quic--doq)
5. [Automatizaciones y Temporizadores Systemd](#5-automatizaciones-y-temporizadores-systemd)
   - [5.1 Sincronización de Bloqueos de Fútbol (Cada 1 min)](#51-sincronización-de-bloqueos-de-fútbol-cada-1-min)
   - [5.2 Sincronización de Prefijos Cloudflare AS13335](#52-sincronización-de-prefijos-cloudflare-as13335)
   - [5.3 Motor de Estadísticas y ASNs (Cada 30 seg)](#53-motor-de-estadísticas-y-asns-cada-30-seg)
   - [5.4 Panel Interno de Bloqueos (/blocked)](#54-panel-interno-de-bloqueos-blocked)
   - [5.5 Calentador de Caché DNS (Cada 2 h)](#55-calentador-de-caché-dns-cada-2-h)
6. [Seguridad y Optimización del Sistema (Kernel y Firewall)](#6-seguridad-y-optimización-del-sistema)
7. [Guía de Comandos de Gestión y Mantenimiento](#7-guía-de-comandos-de-gestión-y-mantenimiento)
8. [Mapa de Archivos y Directorios](#8-mapa-de-archivos-y-directorios)

---

## 1. Visión General e Infraestructura

* **Ubicación**: Madrid, España (Interconexión neutra ESpanix / DE-CIX Madrid para latencias sub-5ms en la península).
* **Direcciones IP**:
  * **IPv4**: `85.208.114.51`
  * **IPv6**: `2a0e:97c0:c40::51`
* **Dominio Base**: `xdp.es` | **Subdominio DNS**: `dns.xdp.es`
* **Políticas**:
  * **Zero-Logs Estricto**: Cero registro de nombres de dominio consultados en disco.
  * **DNSSEC**: Validación criptográfica recursiva desde los Root Hints (`.` -> TLD -> Autoritativos).
  * **Evasión de Bloqueos**: Reescritura dinámica en caliente de IPs Anycast de Cloudflare (`AS13335`) afectadas por resoluciones judiciales/deportivas.

---

## 2. Diagrama de Flujo de Red

```text
                                CLIENTES DNS (Internet)
      ┌─────────────────────┬──────────────────────┬──────────────────────┐
      │   DNS Estándar 53   │   DNS over TLS 853   │   DoH / DoH3 (443)   │
      │     (UDP / TCP)     │      (DoT RFC 7858)  │   (HTTP/2 & HTTP/3)  │
      └──────────┬──────────┴──────────┬───────────┴──────────┬───────────┘
                 │                     │                      │
                 ▼                     ▼                      ▼
    ┌──────────────────────────────────────────────┐   ┌───────────────────────────┐
    │          Blocky Principal (53 / 853)         │   │       Caddy (Puerto 443)  │
    │  - Filtrado Adblock (Hagezi, OISD, etc.)     │   │ - HTTP/3 QUIC 0-RTT       │
    │  - Termina DoT nativo con ECDSA              │   │ - Certificado *.xdp.es    │
    │  - Exportador Prometheus en RAM (Port 4000)  │   │ - Termina /dns-query      │
    └──────────────────────┬───────────────────────┘   └─────────────┬─────────────┘
                           │                                         │
                           └─────────────────┬───────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │  Proxy Evasión (Port 5335)│
                               │  - evade_proxy.py         │
                               │  - Valida Cloudflare (BGP)│
                               │  - Reemplazo por IP limpia│
                               └─────────────┬─────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │  Unbound (Port 5336)      │
                               │  - Recursión 100% pura    │
                               │  - Validación DNSSEC      │
                               │  - QNAME Minimisation     │
                               └─────────────┬─────────────┘
                                             ▼
                                  SERVIDORES RAÍZ DNS
                             (a.root-servers.net .. m.root)
```

---

## 3. Direccionamiento y Endpoints Públicos

| Protocolo | Endpoint / Configuración | Puerto | Características |
| :--- | :--- | :--- | :--- |
| **DNS Estándar** | `85.208.114.51`<br>`2a0e:97c0:c40::51` | `53` UDP/TCP | Adblock + Evasión CDN + DNSSEC |
| **DNS over TLS (DoT)** | `dns.xdp.es` | `853` TCP | Cifrado TLS 1.3 nativo, ideal para Android / iOS |
| **DNS over HTTPS (DoH)** | `https://dns.xdp.es/dns-query` | `443` TCP/UDP | HTTP/2 y HTTP/3 (QUIC) con 0-RTT |
| **DoH (Bloqueo Apple OTA)**| `https://dns.xdp.es/block-ota/dns-query` | `443` TCP/UDP | Adblock + Bloqueo de actualizaciones iOS/macOS |
| **DNS over QUIC (DoQ)** | `quic://dns.xdp.es:853` | `853` UDP | RFC 9250 experimental con `dnsproxy` |

---

## 4. Componentes del Stack

### 4.1 Caddy (Servidor Web, TLS y DoH3)
* **Archivo de configuración**: `/etc/caddy/Caddyfile` (respaldado en `/root/xpd-dns/caddy/Caddyfile`)
* **Servicio Systemd**: `caddy.service`
* **Funciones**:
  * Gestión de certificados automáticos Wildcard Let's Encrypt para `xdp.es`, `dns.xdp.es` y subdominios.
  * Terminación TLS con soporte **HTTP/3 (QUIC)** sobre UDP 443 para consultas DoH ultra-rápidas sin retardo de handshake TCP.
  * Reverse proxy del endpoint `/dns-query` hacia Blocky (`127.0.0.1:4000`) enviando la cabecera `X-Real-IP`.
  * Reverse proxy de `/block-ota/dns-query` hacia Blocky OTA (`127.0.0.1:4001`).
  * Servicio de archivos estáticos para la web (`/`, `/stats`, `/about`, `/block-ota`, `/blocked`).

### 4.2 Blocky (Instancia Principal)
* **Archivo de configuración**: `/root/xpd-dns/blocky/config.yml`
* **Servicio Systemd**: `blocky.service`
* **Puertos de escucha**:
  * `53` (UDP/TCP): DNS estándar para IPv4 e IPv6.
  * `853` (TCP): DoT nativo con certificados en `/etc/letsencrypt/live/xdp.es/`.
  * `127.0.0.1:4000` (HTTP): Endpoint `/dns-query` para DoH y `/metrics` para Prometheus.
* **Listas de Bloqueo Activas**:
  * Hagezi Multi PRO (`https://raw.githubusercontent.com/hagezi/dns-blocklists/main/wildcard/pro.txt`)
  * StevenBlack Unified Hosts (`https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts`)
  * OISD Small (`https://small.oisd.nl`)
  * URLhaus Malware (`https://urlhaus.abuse.ch/downloads/hostfile/`)
* **Upstream**: Reenvía a `tcp+udp:127.0.0.1:5335` (Proxy de Evasión).

### 4.3 Blocky OTA (Instancia Apple OTA)
* **Archivo de configuración**: `/root/xpd-dns/blocky/config-ota.yml`
* **Servicio Systemd**: `blocky-ota.service`
* **Puertos**: `127.0.0.1:5354` (DNS) y `127.0.0.1:4001` (HTTP DoH).
* **Bloqueo añadido**: Lista `/root/xpd-dns/blocky/apple-ota.txt` con dominios como `mesu.apple.com`, `appldnld.apple.com`, `gdmf.apple.com`, `updates-http.apple.com` para evitar actualizaciones forzadas de iOS/macOS.

### 4.4 Proxy de Evasión de Bloqueos (`evade_proxy.py`)
* **Ruta del script**: `/root/xpd-dns/scripts/evade_proxy.py`
* **Servicio Systemd**: `xdp-evade-proxy.service`
* **Puerto de escucha**: `127.0.0.1:5335` (UDP/TCP) -> Upstream hacia Unbound en `127.0.0.1:5336`.
* **Algoritmo de Evasión Cloudflare**:
  1. Carga la lista de IPs bloqueadas (`/etc/unbound/blocked_ips.txt` y `blocked_ipv6.txt`).
  2. Carga los **348 prefijos IPv4 y 68 prefijos IPv6** oficiales de Cloudflare AS13335 (`/etc/unbound/cloudflare_prefixes_v4.txt` y `_v6.txt`).
  3. Comprueba por búsqueda binaria de intervalos `O(log N)` en 0.001 µs si la IP del registro `A` o `AAAA` está en la lista de bloqueo **Y** pertenece a Cloudflare.
  4. Si cumple ambas condiciones, busca en el mismo prefijo una IP contigua que **NO esté en la lista de bloqueos**.
  5. Si la IP pertenece a otro proveedor (Google, AWS, etc.), **NO se modifica**.
  6. Las respuestas reescritas salen con TTL `EVADE_REWRITE_TTL` (30 s por defecto, antes 0) para que el cliente las cachee brevemente sin perder reactividad ante cambios en la lista de bloqueos (recarga cada 5 s).

### 4.5 Unbound (Resolver Recursivo Puro)
* **Archivo de configuración**: `/etc/unbound/unbound.conf` (respaldado en `/root/xpd-dns/unbound/unbound.conf`)
* **Servicio Systemd**: `unbound.service`
* **Puerto de escucha**: `127.0.0.1:5336` y `::1:5336`.
* **Características**:
  * `num-threads: 8` con slabs de memoria (`so-reuseport: yes`, buffers de 16MB).
  * `outgoing-interface`: Forzado a `85.208.114.51` y `2a0e:97c0:c40::51`.
  * Validación DNSSEC estricta con trust anchor `/var/lib/unbound/root.key`.
  * `qname-minimisation: yes` para evitar filtraciones de privacidad hacia los servidores raíz.
  * Módulo de control remoto en `127.0.0.1:8953` (`unbound-control`).

### 4.6 dnsproxy (DNS over QUIC / DoQ)
* **Binario**: `/root/xpd-dns/bin/dnsproxy`
* **Servicio Systemd**: `xdp-doq-dot.service`
* **Puertos**: Escucha en UDP `853` (DoQ) con certificado TLS y reenvía hacia Blocky en `127.0.0.1:53`.

---

## 5. Automatizaciones y Temporizadores Systemd

### 5.1 Sincronización de Bloqueos de Fútbol (Cada 1 min)
* **Script**: `/root/xpd-dns/scripts/update-blocked-ips.sh`
* **Servicio & Timer**: `update-blocked-ips.service` / `update-blocked-ips.timer` (`OnUnitActiveSec=1min`)
* **Lógica**:
  1. Descarga `https://hayahora.futbol/estado/blocked-any.txt`.
  2. Compara atómicamente con `/etc/unbound/blocked_ips.txt`.
  3. Si hay cambios:
     * Actualiza el archivo de bloqueos.
     * **No purga cachés**: el evade-proxy recarga las listas cada 5 s y reescribe cada respuesta al vuelo, así que la caché de Unbound (con las IPs originales) sigue siendo válida.
     * Ejecuta `generate-blocked-json.py` para refrescar el panel interno `/blocked`.
  4. Si no hay cambios, no realiza escrituras en disco.

### 5.2 Sincronización de Prefijos Cloudflare AS13335
* **Script**: `/root/xpd-dns/scripts/update-cloudflare-prefixes.py`
* **Lógica**: Consulta la API de **RIPE Stat** para `AS13335` y los endpoints oficiales de Cloudflare (`https://www.cloudflare.com/ips-v4` y `ips-v6`), colapsa los rangos de subred y guarda `/etc/unbound/cloudflare_prefixes_v4.txt` y `_v6.txt`.

### 5.3 Motor de Estadísticas y ASNs (Cada 30 seg)
* **Script**: `/root/xpd-dns/scripts/update-stats.py`
* **Servicio & Timer**: `update-stats.service` / `update-stats.timer` (`OnUnitActiveSec=30s`)
* **Lógica**:
  1. Scrapea `http://127.0.0.1:4000/metrics` en RAM.
  2. Suma el 100% de las consultas (DoT + DoH + DNS53).
  3. Consulta anónimamente a **Team Cymru** (`AS<num>.asn.cymru.com`) para geolocalizar el operador sin almacenar logs de navegación.
  4. Clasifica entre **Operadores Residenciales (ISP)** (Movistar, Vodafone, Orange, DIGI, MásMóvil, Starlink, Avatel, PTV Telecom, etc.) y **Datacenters** (OVH, Hetzner, AWS, Ginernet, etc.).
  5. Genera `/var/www/xdp.es/stats.json` con rolling deltas de 24h y 30 días.

### 5.4 Panel Interno de Bloqueos (`/blocked`)
* **Página**: `/root/xpd-dns/web/blocked/index.html` -> Desplegada en `/var/www/xdp.es/blocked/index.html`
* **Datos**: Generados por `/root/xpd-dns/scripts/generate-blocked-json.py` en `/var/www/xdp.es/blocked/data.json`.
* **Características**:
  * Acceso privado sin enlaces en navegación pública.
  * `Disallow: /blocked` y `noindex` para buscadores.
  * Visualización en vivo de cada IP baneada, su prefijo BGP y la IP alternativa asignada.

### 5.5 Calentador de Caché DNS (Cada 2 h)
* **Script**: `/root/xpd-dns/scripts/cache-warmer.py`
* **Servicio & Timer**: `xdp-cache-warmer.service` / `xdp-cache-warmer.timer` (`OnUnitActiveSec=2h`, `OnBootSec=5min`)
* **Lógica**:
  1. Descarga la lista Tranco (`top-1m.csv.zip`) una vez al día a `/var/lib/xdp-cache-warmer/`.
  2. Resuelve los `WARMER_TOP` (20 000) dominios más populares en `A`, `AAAA` y `HTTPS` directamente contra los dos Unbound (`5336` principal y `5338` lite), a `WARMER_QPS` (200) consultas/s.
  3. Junto con `prefetch: yes` y `serve-expired` (con `serve-expired-client-timeout: 100`), mantiene calientes los dominios populares y sus delegaciones, de modo que la primera consulta de un usuario ya es un acierto de caché.
* **Comprobación**: `journalctl -u xdp-cache-warmer -o cat | tail -2` muestra consultas, aciertos (<5 ms) y RTT medio de cada pasada.

---

## 6. Seguridad y Optimización del Sistema

* **Ajustes de Kernel Sysctl** (`/etc/sysctl.d/99-dns-tuning.conf`):
  ```ini
  net.core.rmem_max = 33554432
  net.core.wmem_max = 33554432
  net.core.rmem_default = 16777216
  net.core.wmem_default = 16777216
  net.ipv4.udp_rmem_min = 16384
  net.ipv4.udp_wmem_min = 16384
  net.core.netdev_max_backlog = 10000
  net.ipv4.ip_local_port_range = 1024 65535
  ```
* **Límites de Descriptores de Archivos**: `LimitNOFILE=1048576` en todos los servicios de resolución.
* **Firewall**: `nftables` activo limitando tasas de amplificación DNS y protegiendo puertos internos (`5335`, `5336`, `5354`, `4000`, `4001`, `8953`).

---

## 7. Guía de Comandos de Gestión y Mantenimiento

### Estado de los Servicios
```bash
# Comprobar estado de todos los servicios DNS
systemctl status caddy blocky blocky-ota xdp-evade-proxy unbound xdp-doq-dot

# Ver temporizadores activos (actualización de bloqueos y estadísticas)
systemctl list-timers | grep -E 'blocked|stats'
```

### Reiniciar Servicios
```bash
# Reiniciar el stack completo
systemctl restart caddy blocky blocky-ota xdp-evade-proxy unbound xdp-doq-dot

# Forzar sincronización de bloqueos de fútbol
/root/xpd-dns/scripts/update-blocked-ips.sh

# Forzar actualización de estadísticas web
python3 /root/xpd-dns/scripts/update-stats.py
```

### Purgado Manual de Caché
```bash
# Purgar caché de Blocky
blocky cache flush --apiPort 4000
blocky cache flush --apiPort 4001

# Purgar caché de Unbound
unbound-control flush_zone .
```

### Pruebas de Resolución
```bash
# 1. Probar DNS53 estándar
dig @85.208.114.51 sc.ohz.ovh +short

# 2. Probar DoT (DNS over TLS)
python3 -c '
import ssl, socket, struct, dns.message
ctx = ssl.create_default_context()
ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
s = socket.create_connection(("85.208.114.51", 853))
ss = ctx.wrap_socket(s)
q = dns.message.make_query("sc.ohz.ovh", dns.rdatatype.A).to_wire()
ss.sendall(struct.pack("!H", len(q)) + q)
resp_len = struct.unpack("!H", ss.recv(2))[0]
print(dns.message.from_wire(ss.recv(resp_len)))
ss.close()
'

# 3. Probar DoH
curl -s -H "accept: application/dns-message" "https://dns.xdp.es/dns-query?dns=AAABAAABAAAAAAAAA3d3dwZnb29nbGUDY29tAAABAAE" -o /dev/null -w "%{http_code}\n"
```

---

## 8. Mapa de Archivos y Directorios

```text
/root/xpd-dns/
├── caddy/
│   └── Caddyfile                       # Configuración de Caddy (TLS, HTTP/3, reverse proxies)
├── blocky/
│   ├── config.yml                      # Configuración principal de Blocky (Port 53, 853, 4000)
│   ├── config-ota.yml                  # Instancia Blocky OTA (Port 5354, 4001)
│   └── apple-ota.txt                   # Lista de dominios de actualización Apple bloqueados
├── unbound/
│   ├── unbound.conf                    # Configuración de Unbound (Port 5336, DNSSEC, recursivo)
│   ├── blocked_ips.txt                 # Lista de IPs IPv4 bloqueadas en sincronización
│   ├── blocked_ipv6.txt                # Lista de IPs IPv6 bloqueadas
│   ├── cloudflare_prefixes_v4.txt      # Prefijos BGP IPv4 de Cloudflare AS13335
│   ├── cloudflare_prefixes_v6.txt      # Prefijos BGP IPv6 de Cloudflare AS13335
│   └── evade_blackhole.py              # Módulo Unbound Python alternativo
├── scripts/
│   ├── evade_proxy.py                  # Proxy de evasión DNS principal (Port 5335)
│   ├── update-blocked-ips.sh           # Script de sincronización de bloqueos cada 1 min
│   ├── update-cloudflare-prefixes.py   # Script de actualización de prefijos Cloudflare
│   ├── update-stats.py                 # Scraper y agregador de estadísticas de Prometheus
│   ├── cache-warmer.py                 # Calentador de caché (Tranco top-N contra Unbound)
│   ├── generate-blocked-json.py        # Generador de datos JSON para /blocked
│   ├── history.json                    # Historial persistente horario de métricas
│   └── asn_cache.json                  # Caché local de resoluciones de ASN
├── systemd/
│   ├── update-blocked-ips.service      # Servicio oneshot para sincronización de bloqueos
│   ├── update-blocked-ips.timer        # Timer cada 1 minuto para update-blocked-ips
│   ├── update-stats.service            # Servicio oneshot para estadísticas
│   ├── update-stats.timer              # Timer cada 30 segundos para update-stats
│   ├── xdp-cache-warmer.service        # Servicio oneshot del calentador de caché
│   └── xdp-cache-warmer.timer          # Timer cada 2 horas para xdp-cache-warmer
└── web/
    ├── index.html                      # Landing page principal
    ├── stats/index.html                # Panel de estadísticas públicas en vivo
    ├── about/index.html                # Página de información, política de privacidad y endpoints
    ├── block-ota/index.html            # Guía y perfiles .mobileconfig para bloqueo Apple OTA
    └── blocked/
        ├── index.html                  # Panel interno de monitorización de bloqueos
        └── data.json                   # Datos en tiempo real de IPs baneadas y alternativas
```
