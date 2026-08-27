# Sonda residencial de bloqueos — xdp.es

Detecta desde una línea **residencial (Movistar)** qué IPs de CDN están bloqueadas
por el operador (bloqueos de fútbol / colaterales) y alimenta la evasión del
resolver. Cubre los huecos que `hayahora.futbol` no da: **IPv6** y **dominios
concretos** (GitHub/Fastly), que no son Cloudflare anycast.

## Por qué una sonda en casa

Los bloqueos los aplica el ISP, no el destino. El servidor está en un datacenter
que no sufre esas órdenes, así que no "ve" el bloqueo. Una sonda en tu línea es un
punto de observación *dentro* de la red que bloquea. La confirmación es
**diferencial**: una IP se marca bloqueada solo si **sirve desde el servidor pero
no desde casa**, con histéresis (3 rondas) para evitar falsos positivos.

## Arquitectura

```
  CASA (Movistar, IPv4+IPv6)                 SERVIDOR xdp.es
  xdp-probe.py (systemd)                     xdp-probe-server.py (127.0.0.1:8090)
    GET  /probe/targets  ───────────────▶    resuelve IPs reales (Unbound :5336)
    sondea cada IP: TCP443+TLS(SNI)+HTTP      + extra_candidates (pool failover)
    POST /probe/report   ───────────────▶    diferencial + histéresis, y:
       (solo conexiones salientes)            · cf-blocklist → probe_blocked_ipv6/ips
                                              · verified-pool → redirect dominio=IP sana
                                             Caddy expone /probe/* con TLS; token bearer
```

- **cf-blocklist** (Cloudflare anycast: `sc.ohz.ovh`, `turgame.com`, `descargasdd.org`):
  la IP bloqueada se añade a `/etc/unbound/probe_blocked_ipv6.txt`, `update-blocked-ips.sh`
  la une a `blocked_ipv6.txt` y el evade-proxy salta al vecino del prefijo (seguro en CF).
- **verified-pool** (CDN NO anycast — GitHub, Fastly y Akamai/GeoDNS: `github.com`,
  `gist.github.com`, `gist.githubusercontent.com`, `raw.githubusercontent.com`,
  `twitch.tv`, `steamcommunity.com`, `store.steampowered.com`): NO se puede saltar a
  ciegas (una IP vecina puede estar muerta o servir otro sitio — los edges de Akamai
  **no** son intercambiables), así que se fija un `redirect` a una IP del pool
  **verificada sirviendo** desde casa Y desde el servidor (con su SNI y cert válido),
  en `/run/evade-proxy/redirects.txt`. Si ninguna candidata sirve, no se toca nada.

## Configuración de dominios — `domains.json`

```json
{ "domain": "...", "sni": "...", "families": [4|6],
  "strategy": "cf-blocklist" | "verified-pool",
  "extra_candidates": ["ip", ...] }
```

`extra_candidates` da un pool de failover a dominios con una sola IP en DNS
(github.com / gist.github.com traen las IPs-frontend de GitHub verificadas;
Steam trae edges Akamai verificados sirviendo cada hostname; Twitch, las 4 IPs
Fastly). `turgame.com` no publica AAAA ahora mismo: queda configurado y empezará
a sondearse en cuanto tenga registro IPv6. Steam y Twitch solo publican A (sin
AAAA), por eso van en `families: [4]`.

## Servidor (ya desplegado)

- Servicio: `xdp-probe-server.service` (escucha en `127.0.0.1:8090`).
- Ruta pública: `https://dns.xdp.es/probe/*` (Caddy, TLS).
- Token: `PROBE_TOKEN` en `/root/xpd-dns/.env` (no versionado).
- Salidas: `/etc/unbound/probe_blocked_ipv6.txt`, `/etc/unbound/probe_blocked_ips.txt`,
  `/run/evade-proxy/redirects.txt`.

Comandos:
```bash
systemctl status xdp-probe-server
journalctl -u xdp-probe-server -f
curl -s -H "Authorization: Bearer $TOKEN" https://dns.xdp.es/probe/targets | jq
# Estado: sondas conectadas (last-seen), redirects activos y recuento de bloqueos
curl -s -H "Authorization: Bearer $TOKEN" https://dns.xdp.es/probe/status | jq
```

## Instalar la sonda en casa (Raspberry Pi / mini-PC)

Copia la carpeta `agent/` a la Pi y ejecuta:

```bash
sudo ./install-agent.sh https://dns.xdp.es/probe <PROBE_TOKEN> mi-casa-movistar
```

Esto instala `/opt/xdp-probe/xdp-probe.py`, escribe `/etc/xdp-probe.env` (chmod 600)
y arranca `xdp-probe.service`. Requisitos: `python3` (sin dependencias externas) y
salida a Internet IPv4+IPv6. La sonda solo hace conexiones **salientes** (funciona
tras el NAT del HGU). Logs: `journalctl -u xdp-probe -f`.

## Parámetros (en `probe-server.py`)

| Constante | Def | Qué es |
|---|---|---|
| `CONFIRM` | 3 | rondas bloqueado consecutivas para actuar |
| `CLEAR` | 2 | rondas sirviendo para revertir |
| `REDIRECT_TTL` | 300 | vida del redirect (s), refrescado en cada reporte |
| `interval` | 30 | segundos entre rondas de la sonda |

## Seguridad

- Token bearer obligatorio (fail-closed si falta). Comparación en tiempo constante.
- Anti-inyección: el servidor solo acepta IPs de dominios/familias configurados, y los
  destinos de redirect salen **siempre** de la resolución del servidor, nunca de lo que
  diga la sonda.
- Diferencial + histéresis: una sola sonda con ruido no envenena producción.
- Sin logs de navegación en disco; estado de histéresis en memoria.
