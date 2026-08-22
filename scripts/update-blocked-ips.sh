#!/usr/bin/env bash
# /root/xpd-dns/scripts/update-blocked-ips.sh
# Checks and updates the blocked IP list from https://hayahora.futbol/estado/blocked-any.txt every 5 minutes

set -euo pipefail

URL="https://hayahora.futbol/estado/blocked-any.txt"
TARGET_FILE="/etc/unbound/blocked_ips.txt"
BACKUP_FILE="/root/xpd-dns/unbound/blocked_ips.txt"
TEMP_FILE=$(mktemp)

cleanup() {
    rm -f "$TEMP_FILE"
}
trap cleanup EXIT

# Fetch the remote list with timeout and user-agent
if ! curl -s -f -L --connect-timeout 10 --max-time 20 -H "User-Agent: xdp-dns-sync/1.0" "$URL" -o "$TEMP_FILE"; then
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Error: Failed to fetch $URL" >&2
    exit 1
fi

# Sanitize and validate: extract only valid IPv4 lines
FILTERED_TEMP=$(mktemp)
grep -E '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$' "$TEMP_FILE" | sort -u > "$FILTERED_TEMP" || true

COUNT=$(wc -l < "$FILTERED_TEMP")

# Ensure the list is not empty or corrupt before applying
if [[ "$COUNT" -eq 0 ]]; then
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Warning: Fetched list is empty, preserving existing list" >&2
    rm -f "$FILTERED_TEMP"
    exit 0
fi

# Check if there are changes
if [[ ! -f "$TARGET_FILE" ]] || ! cmp -s "$FILTERED_TEMP" "$TARGET_FILE"; then
    mkdir -p "$(dirname "$TARGET_FILE")" "$(dirname "$BACKUP_FILE")"
    mv "$FILTERED_TEMP" "$TARGET_FILE"
    chmod 644 "$TARGET_FILE"
    cp "$TARGET_FILE" "$BACKUP_FILE"
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] Successfully updated blocked IPs: ${COUNT} entries loaded."
    logger -t update-blocked-ips "Successfully updated blocked IPs: ${COUNT} entries loaded." || true
else
    rm -f "$FILTERED_TEMP"
    echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] No changes detected in blocked IPs (${COUNT} entries active)."
fi
