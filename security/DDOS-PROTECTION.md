# Protección frente a ráfagas — 20/09/2026

Desplegada en Ohz y OCI después del incidente de xdp.es. Tabla independiente
`inet xdp_ddos`, servicio `xdp-ddos-guard.service`, reglas en
`/etc/nftables.d/xdp-ddos.nft`. Arranque automático habilitado. En Ohz,
`/etc/nftables.conf` también incluye este fichero para conservar la protección
tras una recarga completa de nftables. En OCI no se modifica el firewall
iptables del proveedor ni se habilita nftables.service, que podría reemplazarlo.

El filtro actúa en prerouting con prioridad raw, antes de conntrack. Solo afecta
a las interfaces y direcciones de servicio de cada nodo (en OCI se usan las IPv4
privadas a las que el proveedor traduce las públicas). No incluye administración,
loopback, WireGuard ni backends privados. Los límites TCP solo cuentan SYN sin
ACK; las conexiones TCP ya abiertas no se restringen. UDP se limita también
cuando conntrack lo considera establecido, cerrando el bypass del filtro anterior.

Se retiraron de Ohz las dos reglas TCP/53 y TCP/853 de 500/minuto que no imponían
un límite efectivo. Las aceptaciones normales quedan detrás del nuevo filtro,
cuyos descartes son definitivos. Se mantienen las otras reglas existentes.

## Umbrales iniciales por nodo

| Tráfico | Por IP origen y puerto destino | Techo global | Ráfaga global |
|---|---:|---:|---:|
| SYN DNS TCP/53 | 20/s, ráfaga 100 | 200/s | 400 |
| SYN DoT TCP/853 | 20/s, ráfaga 100 | 300/s | 600 |
| SYN HTTP/HTTPS TCP/80,443 | 100/s, ráfaga 300 | 500/s entre ambos | 1.000 |
| DNS UDP/53 | 1.000 paquetes/s, ráfaga 2.000 | 20.000 paquetes/s | 40.000 |
| QUIC UDP/443,853 | 5.000 paquetes/s, ráfaga 10.000 | 30.000 paquetes/s entre ambos | 60.000 |

Los techos globales suman IPv4, IPv6 y las direcciones de servicio del nodo.
Los buckets por origen distinguen familia y puerto, pero agregan sus IP destino.
Son umbrales operativos iniciales, no una capacidad garantizada. Una muestra
previa de 25 s observó 183 SYN DNS, 416 DoT, 144 HTTPS y 5 HTTP en Ohz; el máximo
por origen/puerto fue 52 SYN DNS durante esos 25 s. No sustituye a un estudio de
los máximos legítimos históricos. Clientes tras un NAT comparten su límite.

Las ocho tablas de seguimiento tienen 65.535 elementos como máximo cada una,
expiran a los 60 s de inactividad y se recolectan cada 10 s. Los techos globales
se evalúan antes de actualizar los conjuntos para acotar trabajo ante orígenes
falsificados. Si se llena un conjunto, no se garantiza el límite individual de
nuevos orígenes; el techo global sigue operando.

## Operación

```sh
systemctl status xdp-ddos-guard
nft list counters table inet xdp_ddos
nft -t list table inet xdp_ddos
```

Los contadores `*_source` y `*_global` cuentan descartes; `*_pass` cuenta paquetes
que pasan este filtro (pueden descartarse después por otras reglas). No se
registran consultas DNS, contenido de tráfico ni listas de clientes en disco.
Los contadores son acumulativos desde la carga de la tabla y se reinician al
recargar. El watchdog externo continúa comprobando disponibilidad y conmutación;
no se ha añadido una alerta externa de tasa de descartes.

Modificar el generador, regenerar el perfil apropiado y validar antes de aplicar:

```sh
python3 security/generate-ddos-guard.py ohz > /etc/nftables.d/xdp-ddos.nft
systemctl reload xdp-ddos-guard
```

Usar `oci` en el secundario. El helper valida y reemplaza solo esta tabla en una
transacción, sin vaciar el firewall completo. Instalar el fichero generado antes
de utilizar `security/nftables.conf`, que refleja la configuración Ohz vigente.
Una recarga reinicia buckets y contadores. Antes de endurecer umbrales, revisar
tráfico legítimo, clientes NAT y todos los protocolos desde ipx.

## Validación y reversión

- Nueve pruebas con paquetes reales en un namespace aislado, tanto en Ohz como
  OCI: SYN IPv4/IPv6 por origen, separación DNS/DoT, techo distribuido, ACK
  preservados, UDP DNS IPv4/IPv6, QUIC y tráfico ordinario. No se envió una carga
  de ataque a producción. Ejecutar con `unshare -n python3 security/test-ddos-guard.py`.
- Aplicación repetida y retirada de la tabla en un namespace: preservó otra tabla
  independiente. Configuración nftables y unidad systemd validadas.
- Despliegue secuencial con timer de rollback de cinco minutos en cada nodo,
  cancelado tras verificaciones satisfactorias.
- 60/60 pruebas externas de protocolos después de activar ambos nodos: ocho
  endpoints DNS por seis protocolos y seis endpoints web por HTTPS/HTTP3.
- Watchdog 14/14 sano, sin nuevas decisiones de retirada en la muestra posterior.
  Servicios activos y habilitados; cero unidades fallidas. Cero descartes de los
  nuevos límites durante la observación inicial. No se reiniciaron los servidores
  para comprobar el arranque; se validaron unidades y configuración persistente.

Evidencias y backups en `/root/ddos-hardening-20260920/` de Ohz; copia previa del
firewall OCI y rollback en el mismo directorio del secundario. La reversión del
despliegue se hace con `rollback-ohz.sh` o `rollback-oci.sh` en el nodo adecuado.
El rollback Ohz reinserta las reglas anteriores usando handles del despliegue:
revisarlo si el firewall ha cambiado desde entonces. No restaurar el ruleset
completo ni borrar tablas ajenas.

## Alcance

Reduce ráfagas SYN y UDP y la presión sobre conntrack; no garantiza disponibilidad
ante cualquier DDoS. No identifica peticiones HTTP abusivas dentro de conexiones
establecidas ni tráfico DNS malicioso que esté por debajo de los umbrales. Un
ataque distribuido puede consumir el cupo global y afectar a clientes legítimos.
Para tráfico que satura el enlace antes de llegar al servidor se requiere
mitigación aguas arriba. La defensa de capa HTTP requeriría reglas de aplicación
o un proxy/WAF, teniendo en cuenta los endpoints DoH y ECH existentes.

Sintaxis y comportamiento contrastados con la documentación de Netfilter:
[Meters](https://wiki.nftables.org/wiki-nftables/index.php/Meters) y
[Rate limiting](https://wiki.nftables.org/wiki-nftables/index.php/Rate_limiting_matchings).
