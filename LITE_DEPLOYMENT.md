# XDP Lite DNS

Complementary resolver without ad blocking. It does not replace or alter the
query path for the existing service on `85.208.114.51`.

## Public endpoints

| Protocol | Endpoint |
| --- | --- |
| DNS UDP/TCP | `85.208.114.52:53` / `[2a0e:97c0:c40::52]:53` |
| DNS over TLS | `lite.xdp.es:853` |
| DNS over QUIC | `quic://lite.xdp.es:853` |
| DNS over HTTPS | `https://lite.xdp.es/dns-query` |

The flow is `Blocky Lite -> evade_proxy.py -> Unbound`. Blocky Lite has no
`blocking` configuration, so it provides caching and encrypted transports but
does not load or apply ad/malware/OTA lists. The shared evasion proxy continues
to rewrite affected Cloudflare addresses, and Unbound continues to perform
recursive DNSSEC-validating resolution.

## Isolation

The existing Blocky owns wildcard ports 53 and TCP 853. nftables redirects only
packets whose destination is `85.208.114.52` or `2a0e:97c0:c40::52` to the Lite instance's private
service ports (`5353` and `8853`). Traffic addressed to `85.208.114.51` is not
matched and follows the original path unchanged. DoQ binds directly to the
`.52` UDP 853 socket. Caddy selects the separate DoH backend by the
`lite.xdp.es` host name.

## Files and services

- `/root/xpd-dns/blocky/config-lite.yml`
- `/etc/systemd/system/blocky-lite.service`
- `/etc/systemd/system/xdp-lite-doq.service`
- `/etc/caddy/Caddyfile` (additive `lite.xdp.es` virtual host)
- `/etc/nftables.conf` (destination-specific Lite redirects)

## Management

```bash
systemctl status blocky-lite xdp-lite-doq
journalctl -u blocky-lite -u xdp-lite-doq
blocky cache flush --apiPort 4002
```
