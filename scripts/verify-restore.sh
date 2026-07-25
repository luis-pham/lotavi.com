#!/usr/bin/env bash
set -euo pipefail
: "${DATABASE_URL:?DATABASE_URL required}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
SELECT count(*) AS tenants FROM tenants;
SELECT count(*) AS properties FROM properties;
SELECT count(*) AS knowledge FROM knowledge_documents WHERE status = 'published';
SELECT count(*) AS tickets FROM tickets;
SELECT count(*) AS audits FROM audit_logs;
SQL
echo "verify-restore OK"
