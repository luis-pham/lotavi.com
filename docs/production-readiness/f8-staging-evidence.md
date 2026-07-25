# F8.5 — Production-like Staging Deployment

## Result

```text
BLOCKED
```

Unresolved condition: no Docker/podman/colima; no real DNS hostname or TLS issuance available on this workstation.

## Prepared manifests

- `infra/compose/docker-compose.staging.yml`
  - Caddy, web, api, worker, embedding-service, postgres (pgvector image), redis, prometheus
  - Env: `NODE_ENV=production`, `LOTIVA_STORE=postgres`, `ALLOW_MEMORY_STORE=false`, `ALLOW_DEMO_SEED=false`, `VOICE_ENABLED=false`, `EMBEDDING_BACKEND=model`, `REQUIRE_REDIS_RATE_LIMIT=true`
- `infra/compose/Caddyfile.staging`

## Exact DNS records required

```text
A/AAAA  staging.lotiva.vn      → <staging public IP>
A/AAAA  api.staging.lotiva.vn  → <staging public IP>
```

## Exact staging commands (when infra exists)

```bash
export DATABASE_URL=postgres://...
export SESSION_SECRET="$(openssl rand -hex 32)"
export POSTGRES_USER=lotiva POSTGRES_PASSWORD=... POSTGRES_DB=lotiva
export EMBEDDING_MODEL_PATH=/models/embeddinggemma-300m
export EMBEDDING_BACKEND=model

docker compose -f infra/compose/docker-compose.staging.yml up -d --build

# External checks
curl -I https://staging.lotiva.vn
curl -sS https://api.staging.lotiva.vn/health
curl -sS https://api.staging.lotiva.vn/ready
```

## External verification checklist (not run)

- [ ] HTTPS loads / cert valid / HTTP→HTTPS
- [ ] Secure headers
- [ ] `/health` + `/ready`
- [ ] Guest / staff / admin routes
- [ ] No demo credentials / no public seed
- [ ] Voice disabled / memory mode rejected
