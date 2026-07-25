#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT_DIR/lotiva-$STAMP.sql.gz"
echo "Backing up to $FILE"
pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "OK $FILE"
ls -lh "$FILE"
