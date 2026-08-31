#!/usr/bin/env python3
"""Calentador de caché DNS para xdp.es.

Resuelve los N dominios más populares (lista Tranco) directamente contra los
Unbound (principal y lite) para que sus registros A/AAAA/HTTPS y las
delegaciones intermedias estén siempre en caché. Junto con `prefetch` y
`serve-expired`, esto convierte casi cualquier consulta "en frío" de un
dominio popular en un acierto de caché.

Variables de entorno:
  WARMER_TOP        dominios a calentar (por defecto 20000)
  WARMER_TARGETS    lista "host:puerto,host:puerto" (por defecto ambos Unbound)
  WARMER_QTYPES     tipos separados por coma (por defecto A,AAAA,HTTPS)
  WARMER_QPS        límite de consultas/segundo (por defecto 200)
  WARMER_CONCURRENCY consultas en vuelo (por defecto 32)
  WARMER_STATE_DIR  directorio para la lista descargada
"""
import asyncio
import csv
import io
import logging
import os
import sys
import time
import urllib.request
import zipfile

import dns.asyncquery
import dns.message
import dns.rdatatype

TRANCO_URL = "https://tranco-list.eu/top-1m.csv.zip"
LIST_MAX_AGE = 24 * 3600

TOP = int(os.environ.get("WARMER_TOP", "20000"))
TARGETS = [
    (h, int(p))
    for h, p in (
        t.rsplit(":", 1)
        for t in os.environ.get("WARMER_TARGETS", "127.0.0.1:5336,127.0.0.1:5338").split(",")
    )
]
QTYPES = [q.strip() for q in os.environ.get("WARMER_QTYPES", "A,AAAA,HTTPS").split(",")]
QPS = float(os.environ.get("WARMER_QPS", "200"))
CONCURRENCY = int(os.environ.get("WARMER_CONCURRENCY", "32"))
STATE_DIR = os.environ.get("WARMER_STATE_DIR", "/var/lib/xdp-cache-warmer")
TIMEOUT = 5.0

log = logging.getLogger("cache-warmer")


def load_domains() -> list[str]:
    os.makedirs(STATE_DIR, exist_ok=True)
    path = os.path.join(STATE_DIR, "top-1m.csv")
    fresh = os.path.exists(path) and time.time() - os.path.getmtime(path) < LIST_MAX_AGE
    if not fresh:
        try:
            log.info("descargando %s", TRANCO_URL)
            req = urllib.request.Request(TRANCO_URL, headers={"User-Agent": "xdp.es cache-warmer"})
            with urllib.request.urlopen(req, timeout=60) as r:
                data = r.read()
            with zipfile.ZipFile(io.BytesIO(data)) as z:
                name = next(n for n in z.namelist() if n.endswith(".csv"))
                csv_bytes = z.read(name)
            tmp = path + ".tmp"
            with open(tmp, "wb") as f:
                f.write(csv_bytes)
            os.replace(tmp, path)
        except Exception as e:  # noqa: BLE001
            if os.path.exists(path):
                log.warning("descarga fallida (%s); uso la lista anterior", e)
            else:
                log.error("descarga fallida y no hay lista previa: %s", e)
                sys.exit(1)
    domains = []
    with open(path, newline="") as f:
        for row in csv.reader(f):
            if len(row) >= 2 and row[1]:
                domains.append(row[1].strip().rstrip(".").lower())
            if len(domains) >= TOP:
                break
    return domains


class Stats:
    def __init__(self):
        self.sent = self.ok = self.fail = 0
        self.fast = 0  # < 5 ms: aciertos de caché
        self.slow = 0  # >= 100 ms
        self.rtt_sum = 0.0


async def one(name: str, qtype: str, target: tuple[str, int], sem: asyncio.Semaphore, st: Stats):
    async with sem:
        q = dns.message.make_query(name, dns.rdatatype.from_text(qtype), use_edns=0, payload=1232)
        t0 = time.monotonic()
        try:
            await dns.asyncquery.udp(q, target[0], port=target[1], timeout=TIMEOUT)
            dt = time.monotonic() - t0
            st.ok += 1
            st.rtt_sum += dt
            if dt < 0.005:
                st.fast += 1
            elif dt >= 0.1:
                st.slow += 1
        except Exception:  # noqa: BLE001
            st.fail += 1


async def main():
    domains = load_domains()
    log.info("calentando %d dominios x %s en %s", len(domains), "/".join(QTYPES), TARGETS)
    sem = asyncio.Semaphore(CONCURRENCY)
    st = Stats()
    t0 = time.monotonic()
    interval = 1.0 / QPS
    next_slot = time.monotonic()
    tasks: list[asyncio.Task] = []
    for name in domains:
        for target in TARGETS:
            for qtype in QTYPES:
                now = time.monotonic()
                if next_slot > now:
                    await asyncio.sleep(next_slot - now)
                next_slot = max(next_slot, now) + interval
                st.sent += 1
                tasks.append(asyncio.create_task(one(name, qtype, target, sem, st)))
                if len(tasks) >= 2000:
                    await asyncio.gather(*tasks)
                    tasks.clear()
    if tasks:
        await asyncio.gather(*tasks)
    dur = time.monotonic() - t0
    avg = (st.rtt_sum / st.ok * 1000) if st.ok else 0
    log.info(
        "hecho en %.0fs: %d consultas, %d ok, %d fallos, %d aciertos (<5ms), %d lentas (>=100ms), rtt medio %.1f ms",
        dur, st.sent, st.ok, st.fail, st.fast, st.slow, avg,
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    asyncio.run(main())
