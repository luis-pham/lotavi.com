#!/usr/bin/env bash
# Clean-database restore drill with application verification.
# Requires: local Postgres (or Docker), pg_dump/psql, Node/pnpm.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="${RESTORE_WORK_DIR:-/tmp/lotiva-restore-drill-$STAMP}"
SOURCE_URL="${DATABASE_URL:-postgres://lotiva:lotiva@localhost:5432/lotiva}"
TARGET_DB="${RESTORE_TARGET_DB:-lotiva_restore_$STAMP}"
TARGET_URL="${RESTORE_DATABASE_URL:-postgres://lotiva:lotiva@localhost:5432/$TARGET_DB}"
BACKUP_DIR="$WORK/backups"
mkdir -p "$BACKUP_DIR"

echo "==> F7 restore drill starting"
echo "source=$SOURCE_URL"
echo "target=$TARGET_URL"
echo "work=$WORK"

export DATABASE_URL="$SOURCE_URL"
export LOTIVA_STORE=postgres
export ALLOW_MEMORY_STORE=false
export ALLOW_DEMO_SEED=true
export VOICE_ENABLED=false
export SESSION_SECRET="${SESSION_SECRET:-dev-only-change-me-to-a-long-random-secret}"

echo "==> migrate + seed source"
cd "$ROOT"
pnpm exec tsx packages/infrastructure/src/db/migrate.ts
pnpm --filter @lotiva/infrastructure db:seed

BACKUP_FILE="$BACKUP_DIR/lotiva-source-$STAMP.sql.gz"
echo "==> backup source -> $BACKUP_FILE"
pg_dump "$SOURCE_URL" | gzip > "$BACKUP_FILE"
ls -lh "$BACKUP_FILE"

echo "==> create clean target database $TARGET_DB"
psql "$(echo "$SOURCE_URL" | sed 's#[^/]*$#postgres#')" -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS \"$TARGET_DB\";"
psql "$(echo "$SOURCE_URL" | sed 's#[^/]*$#postgres#')" -v ON_ERROR_STOP=1 -c "CREATE DATABASE \"$TARGET_DB\";"

echo "==> restore into clean DB"
gunzip -c "$BACKUP_FILE" | psql "$TARGET_URL" -v ON_ERROR_STOP=1

echo "==> verify row counts on restored DB"
DATABASE_URL="$TARGET_URL" "$ROOT/scripts/verify-restore.sh"

echo "==> application smoke against restored DB"
export DATABASE_URL="$TARGET_URL"
export API_PORT="${RESTORE_API_PORT:-4099}"
pnpm exec tsx apps/api/src/server.ts > "$WORK/api.log" 2>&1 &
API_PID=$!
cleanup() { kill "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT
sleep 2
curl -fsS "http://127.0.0.1:$API_PORT/ready" | tee "$WORK/ready.json"
META=$(curl -fsS "http://127.0.0.1:$API_PORT/api/v1/meta/seed")
TOKEN=$(printf '%s' "$META" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).guestQrToken||''))")
test -n "$TOKEN"
curl -fsS -c "$WORK/cj" -X POST "http://127.0.0.1:$API_PORT/api/v1/guest/sessions/from-qr" \
  -H 'content-type: application/json' -d "{\"token\":\"$TOKEN\"}" | tee "$WORK/session.json"
curl -fsS -b "$WORK/cj" -X POST "http://127.0.0.1:$API_PORT/api/v1/guest/chat" \
  -H 'content-type: application/json' -d '{"message":"ho boi o dau"}' | tee "$WORK/chat.json"

echo "==> RLS spot-check on restored DB"
RUN_PG_TESTS=1 LOTIVA_STORE=postgres DATABASE_URL="$TARGET_URL" \
  pnpm exec vitest run packages/infrastructure/src/db/postgres-rls.test.ts

cat > "$WORK/evidence.md" <<EOF
# Restore drill evidence

- backup: $BACKUP_FILE
- timestamp: $STAMP
- source: $SOURCE_URL
- target: $TARGET_URL
- ready: $(cat "$WORK/ready.json")
- chat snippet: $(head -c 200 "$WORK/chat.json")
EOF

echo "==> DONE evidence at $WORK/evidence.md"
cat "$WORK/evidence.md"
