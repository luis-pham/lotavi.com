#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-postgres://lotiva:lotiva@localhost:5432/lotiva}"
export LOTIVA_STORE=postgres
export API_PORT="${API_PORT:-4000}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-http://localhost:4000}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Start Postgres yourself, then:"
  echo "  export DATABASE_URL=... LOTIVA_STORE=postgres"
  echo "  pnpm db:migrate && pnpm db:seed"
  echo "  pnpm --filter @lotiva/api dev"
  exit 1
fi

echo "Starting postgres + redis via compose..."
docker compose -f infra/compose/docker-compose.yml up -d postgres redis

echo "Waiting for postgres..."
for i in $(seq 1 30); do
  if docker compose -f infra/compose/docker-compose.yml exec -T postgres pg_isready -U lotiva -d lotiva >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

pnpm db:migrate
pnpm db:seed
echo "Postgres ready. Start API with LOTIVA_STORE=postgres"
pnpm --filter @lotiva/api dev
