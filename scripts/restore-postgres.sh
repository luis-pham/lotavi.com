#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
FILE="${1:?Usage: restore-postgres.sh <backup.sql.gz>}"
echo "WARNING: restores into DATABASE_URL=$DATABASE_URL"
gunzip -c "$FILE" | psql "$DATABASE_URL"
echo "Restore complete. Run application smoke checks."
