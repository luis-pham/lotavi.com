#!/usr/bin/env sh
set -eu
cd /app
export LOTIVA_STORE="${LOTIVA_STORE:-postgres}"
export DATABASE_URL="${DATABASE_URL:-postgres://lotiva:lotiva@postgres:5432/lotiva}"

# Runtime image is plain node alpine — enable pnpm via corepack.
corepack enable
corepack prepare pnpm@11.11.0 --activate

echo "[entrypoint] migrate..."
pnpm --filter @lotiva/infrastructure db:migrate
echo "[entrypoint] seed..."
pnpm --filter @lotiva/infrastructure db:seed || true
echo "[entrypoint] start api..."
exec node apps/api/dist/server.js
