#!/usr/bin/env bash
# /root/xpd-dns/scripts/update-blocked-ips.sh
# Checks and updates the blocked IP list from https://hayahora.futbol/estado/blocked-any.txt every 1 minute
# and synchronizes blocked IPv6 list from /root/ooni_bloqueados_ipv6.txt

set -euo pipefail

URL="https://hayahora.futbol/estado/blocked-any.txt"
TARGET_FILE="/etc/unbound/blocked_ips.txt"
BACKUP_FILE="/root/xpd-dns/unbound/blocked_ips.txt"

SOURCE_IPV6="/root/ooni_bloqueados_ipv6.txt"
TARGET_IPV6="/etc/unbound/blocked_ipv6.txt"
BACKUP_IPV6="/root/xpd-dns/unbound/blocked_ipv6.txt"

TEMP_FILE=$(mktemp)

cleanup() {
    rm -f "$TEMP_FILE"
}
trap cleanup EXIT

# 0. Sync Cloudflare AS13335 Prefixes if missing or older than 24 hours
CF_V4_FILE="/etc/unbound/cloudflare_prefixes_v4.txt"
if [[ ! -f "$CF_V4_FILE" ]] || [[ $(find "$CF_V4_FILE" -mtime +1 -print 2>/dev/null) ]]; then
    /usr/bin/python3 /root/xpd-dns/scripts/update-cloudflare-prefixes.py >/dev/null 2>&1 || true
fi

# 1. Fetch IPv4 Anycast Blocklist
if curl -s -f -L --connect-timeout 10 --max-time 20 -H "User-Agent: xdp-dns-sync/1.0" "$URL" -o "$TEMP_FILE"; then
    FILTERED_TEMP=$(mktemp)
    grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' "$TEMP_FILE" | sort -u > "$FILTERED_TEMP" || true
    COUNT=$(wc -l < "$FILTERED_TEMP")

    mkdir -p "$(dirname "$TARGET_FILE")" "$(dirname "$BACKUP_FILE")"

    if [[ ! -f "$TARGET_FILE" ]] || ! cmp -s "$FILTERED_TEMP" "$TARGET_FILE"; then
        mv "$FILTERED_TEMP" "$TARGET_FILE"
        chmod 644 "$TARGET_FILE"
        cp "$TARGET_FILE" "$BACKUP_FILE"
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Blocked IPv4 updated: ${COUNT} active entries (Evasion active: $([[ $COUNT -gt 0 ]] && echo 'YES' || echo 'NO'))."
        logger -t update-blocked-ips "Blocked IPv4 updated: ${COUNT} active entries" || true

        # No cache flush needed: evade-proxy rewrites blocked IPs on every response as it
        # egresses Unbound (cached or not), and Blocky caching is disabled. Flushing the
        # recursive cache here only collapsed the hit-rate and re-recursed for no benefit.
    else
        rm -f "$FILTERED_TEMP"
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] No changes in blocked IPv4 (${COUNT} entries active)."
    fi
else
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Error: Failed to fetch $URL" >&2
fi

# 2. Sync IPv6 Blocklist
if [[ -f "$SOURCE_IPV6" ]]; then
    mkdir -p "$(dirname "$TARGET_IPV6")" "$(dirname "$BACKUP_IPV6")"
    if [[ ! -f "$TARGET_IPV6" ]] || ! cmp -s "$SOURCE_IPV6" "$TARGET_IPV6"; then
        cp "$SOURCE_IPV6" "$TARGET_IPV6"
        chmod 644 "$TARGET_IPV6"
        cp "$SOURCE_IPV6" "$BACKUP_IPV6"
        echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Blocked IPv6 list synced from $SOURCE_IPV6."
    fi
fi

# 3. Update /blocked dashboard JSON
/usr/bin/python3 /root/xpd-dns/scripts/generate-blocked-json.py >/dev/null 2>&1 || true
