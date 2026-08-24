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

## Modo de prueba y redirecciones

El modo de prueba puede convivir con el proxy de producción. Usa DNS UDP/TCP en
`127.0.0.1:15335` (Unbound principal), `127.0.0.1:15337` (Unbound Lite), métricas
en `127.0.0.1:15339` y estadísticas separadas en
`/tmp/evade-proxy-test-stats.json`.

```sh
./target/release/evade-proxy --test \
  --redirect example.com=203.0.113.7 \
  --redirect example.com=2001:db8::7
```

Cada `--redirect DOMINIO=IP` sobrescribe los registros A o AAAA de las respuestas
al dominio indicado. La opción puede repetirse para probar IPv4, IPv6 o varios
dominios. Solo se modifica la sección de respuestas y el TTL se establece en
cero. Las demás consultas se reenvían sin redirección de prueba.

Comprobación desde otra terminal:

```sh
dig @127.0.0.1 -p 15335 example.com A +short
dig @127.0.0.1 -p 15335 example.com AAAA +short
dig @127.0.0.1 -p 15335 example.com A +tcp +short
dig @127.0.0.1 -p 15337 example.com A +short
curl http://127.0.0.1:15339/metrics
```

Finaliza la prueba con `Ctrl-C`. `--redirect` se rechaza fuera de `--test` para
evitar activar una regla accidentalmente en los listeners de producción.
