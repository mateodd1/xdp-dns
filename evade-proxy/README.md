# evade-proxy (Rust)

Port de `scripts/evade_proxy.py` orientado a baja latencia. Conserva los
listeners DNS UDP/TCP `5335 -> 5336` y `5337 -> 5338`, las métricas HTTP en
`5339`, la recarga de listas cada cinco segundos y el formato de
`evade_stats.json`.

El proxy modifica los RDATA A/AAAA directamente sobre el paquete DNS. Así evita
reconstruir el mensaje completo y conserva nombres comprimidos, flags y orden de
registros. Cuando reemplaza al menos una dirección pone a cero el TTL de todos
los resource records, igual que el servicio Python.

## Compilar e instalar

Requiere Rust estable (1.82 o posterior):

```sh
cd /root/xpd-dns/evade-proxy
cargo test
cargo build --release --locked
install -m 0755 target/release/evade-proxy /usr/local/bin/evade-proxy
install -m 0644 ../systemd/xdp-evade-proxy.service /etc/systemd/system/xdp-evade-proxy.service
systemctl daemon-reload
systemctl enable --now xdp-evade-proxy
```

No se debe ejecutar simultáneamente con `evade_proxy.py`, porque ambos usan los
mismos puertos. Antes del cambio, conviene validar con `dig` tanto UDP como TCP
y consultar `http://127.0.0.1:5339/metrics`.

## Configuración

Las rutas compatibles se usan por defecto. Para pruebas pueden sobrescribirse
mediante `EVADE_BLOCKED_IPV4_FILE`, `EVADE_BLOCKED_IPV6_FILE`,
`EVADE_CF_IPV4_FILE`, `EVADE_CF_IPV6_FILE` y `EVADE_STATS_FILE`.
