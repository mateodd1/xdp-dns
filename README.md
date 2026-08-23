# 🛡️ Servidor DNS Recursivo Público xdp.es

Arquitectura DNS de alto rendimiento y ultra-baja latencia diseñada para atender a miles de usuarios concurrentes de forma pública y segura.

---

## 🏛️ Arquitectura del Sistema

```
                         [ CLIENTES PÚBLICOS ]
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     │ 53/UDP/TCP                │ 443/HTTPS (DoH)           │ 853/TLS (DoT)
     ▼                           ▼                           ▼
┌──────────────┐         ┌──────────────┐            ┌──────────────┐
│   UNBOUND    │         │    CADDY     │            │    BLOCKY    │
│  (Recursión  │         │ (HTTP/2, H3  │            │  (Filtro Ad, │
│  Pura, Root  │         │  Auto-HTTPS) │            │   TLS 853)   │
│  Hints 53)   │         └──────┬───────┘            └──────┬───────┘
└──────┬───────┘                │ :4000/dns-query           │
       │                        ▼                           │
       │                 ┌──────────────┐                   │
       │                 │    BLOCKY    │                   │
       │                 │  (DoH Proxy) │                   │
       │                 └──────┬───────┘                   │
       │                        │ Upstream (127.0.0.1:53)   │
       │                        └─────────────┬─────────────┘
       │                                      │
       ▼                                      ▼
┌───────────────────────────────────────────────────────────┐
│               UNBOUND RECURSIVE RESOLVER                  │
│  • Multi-Thread (so_reuseport) • Caché 512MB / 256MB      │
│  • DNSSEC Root Anchor          • Prefetch & Serve-Expired │
│  • Anti-DDoS Rate Limiting     • QNAME Minimisation       │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼ (Iterativo a Servidores Raíz)
                [ INTERNET ROOT & TLD DNS ]
```

---

## 🚀 Componentes Instalados y Configurados

1. **Unbound (`/etc/unbound/unbound.conf`)**:
   - Resuelve directamente en el puerto `53/UDP` y `53/TCP` en todas las interfaces (`0.0.0.0` y `[::]`).
   - Validación **DNSSEC** obligatoria con `root.key`.
   - Caché sobredimensionada (`512MB` RRSet, `256MB` Msg) con `prefetch: yes` y `serve-expired: yes` para respuestas instantáneas de 0ms.
   - Protección activa contra ataques de amplificación DNS (`ratelimit: 1000`, `ip-ratelimit: 200`).
   - Optimización de buffers `so-rcvbuf: 8m`, `so-sndbuf: 8m`, y soporte de `so-reuseport`.

2. **Blocky (`/root/xpd-dns/blocky/config.yml`)**:
   - Front-end de alta velocidad en Go para **DoH** (`:4000/dns-query`) y **DoT** (`:853`).
   - Filtrado de anuncios, telemetría y malware (StevenBlack, OISD, URLhaus) con actualización diaria.
   - Motor de métricas Prometheus en `:4000/metrics`.
   - Reenvía las consultas limpias a Unbound local (`127.0.0.1:53`).

3. **Caddy (`/etc/caddy/Caddyfile`)**:
   - Termina TLS para `xdp.es` y `dns.xdp.es` con certificados automáticos de **Let's Encrypt / ZeroSSL**.
   - Soporte nativo para **HTTP/2** y **HTTP/3 (QUIC)** en el endpoint DoH `https://dns.xdp.es/dns-query`.
   - Sirve la Landing Page responsiva en `https://xdp.es`.
   - Redirección automática en `https://dns.xdp.es/` hacia `https://xdp.es/`.

4. **Landing Page Web (`/var/www/xdp.es`)**:
   - Estilo oscuro minimalista inspirado en `dns.mateo.ovh`.
   - Botones interactivos con copia al portapapeles y tooltips.
   - Descarga de perfiles Apple `.mobileconfig` preconfigurados para DoH y DoT.
   - Guías de configuración paso a paso para Android, iOS/macOS, Windows 11, Linux y Navegadores.
   - Tarjeta de estadísticas en vivo (consultas 24h, bloqueadas, tasa de bloqueo) alimentada por `update-stats.py`.

5. **Ajustes del Kernel Linux (`/etc/sysctl.d/99-dns-tuning.conf`)**:
   - Buffers de red ampliados a 64MB (`rmem_max`, `wmem_max`).
   - Cola de interfaz de red aumentada a 100,000 paquetes para absorber picos.
   - Rango de puertos efímeros ampliado (`1024-65535`).
   - TCP FastOpen y reutilización de sockets TIME_WAIT activados.

---

## ⚙️ Registros DNS Necesarios (En tu proveedor de dominio)

Configura los siguientes registros en la zona DNS de `xdp.es`:

| Tipo | Nombre | Valor | Descripción |
|---|---|---|---|
| **A** | `@` (o `xdp.es`) | `85.208.114.51` | Landing page web |
| **AAAA** | `@` (o `xdp.es`) | `2a0e:97c0:c40::51` | Landing page IPv6 |
| **A** | `dns` | `85.208.114.51` | Hostname para DoH / DoT / Estándar |
| **AAAA** | `dns` | `2a0e:97c0:c40::51` | Hostname IPv6 para DoH / DoT |
| **A** | `www` | `85.208.114.51` | Alias Web |
| **AAAA** | `www` | `2a0e:97c0:c40::51` | Alias Web IPv6 |

---

## 🛠️ Comandos de Verificación y Diagnóstico

### 1. Ejecutar la suite de pruebas completa:
```bash
bash /root/xpd-dns/scripts/test-dns.sh
```

### 2. Probar resolución DNS estándar (Puerto 53 UDP):
```bash
dig @85.208.114.51 google.com
```

### 3. Probar validación DNSSEC:
```bash
dig @85.208.114.51 cloudflare.com +dnssec
# Comprueba la presencia de la flag 'ad' (Authenticated Data) en la respuesta
```

### 4. Probar DoT (DNS-over-TLS en puerto 853):
```bash
kdig @85.208.114.51 +tls +tls-ca=/etc/ssl/certs/dns.xdp.es.fullchain.pem +tls-hostname=dns.xdp.es google.com
```

### 5. Probar DoH (DNS-over-HTTPS en puerto 443):
```bash
curl -i -H "accept: application/dns-message" "https://dns.xdp.es/dns-query?dns=AAABAAABAAAAAAAABmdvb2dsZQNjb20AAAEAAQ"
```

### 6. Probar redirección de `dns.xdp.es/`:
```bash
curl -I https://dns.xdp.es/
# Devolverá 301/308 con Location: https://xdp.es/
```

### 7. Consultar estado de los servicios:
```bash
systemctl status unbound blocky caddy update-stats.timer
```
