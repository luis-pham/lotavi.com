# F7 Final verification report

## FINAL CLASSIFICATION

```text
PILOT READY
```

Closest defensible text-only target remains blocked from **CONDITIONAL PRODUCTION READY** by:

1. Real EmbeddingGemma weights not loaded/verified (`EMBEDDING_BACKEND=model`)
2. Staging DNS/TLS not executed
3. Playwright E2E / business k6 not run end-to-end in CI this session

Voice remains disabled / BLOCKED (acceptable for text-only once other gates pass).

## Release scope

- text: yes (pilot)
- voice: no (`VOICE_ENABLED=false`)
- property count: 1 controlled
- traffic: limited supervised

## Phase results

| Phase | Result | Condition / notes |
|-------|--------|-------------------|
| F7.1 Embedding pipeline | CONDITIONAL PASS | Adapter + stub contracts complete; real model artifact not verified |
| F7.2 SQL hybrid retrieval | CONDITIONAL PASS | FTS+trgm+RRF+lexical in SQL/app; dense when vectors present; local DB without pgvector |
| F7.3 Retrieval eval gate | PASS | Recall/no-answer gates in CI suite |
| F7.4 Grounded answering | PASS | Extractive + grounding metadata |
| F7.5 Playwright E2E | CONDITIONAL PASS | Spec+config present; requires `RUN_E2E=1` stack run |
| F7.6 Staff realtime | PASS | Outbox SoT + SSE reconcile + Redis optional |
| F7.7 Clean restore drill | PASS | Clean DB restore + ready + RLS evidence |
| F7.8 Staging | BLOCKED | Manifests ready; DNS/TLS access missing |
| F7.9 Business load | CONDITIONAL PASS | k6 business script ready; sustained run not executed |
| F7.10 Auth reset | PASS | Token reset + session revoke + audit |
| F7.11 Security closure | CONDITIONAL PASS | Criticals addressed; multi-replica rate limit residual |
| F7.12 Observability | CONDITIONAL PASS | Metrics/alerts guidance; dashboards not deployed |
| F7.13 Release/rollback | PASS | Documented + backup-first |
| F7.14 Gemini Live | BLOCKED | Keep voice off |

## Implemented changes

- Embedding service model/stub backends, ready endpoint, contracts
- Migrations `0004_f7_foundations`, `0005_normalize_search_text`
- Hybrid SQL retrieval + RRF fusion
- Grounding metadata on messages
- Password reset API
- Ticket outbox + SSE reconcile
- Playwright config + E2E
- Restore drill automation (executed)
- Staging compose/Caddy TLS templates
- Business k6 script
- Expanded retrieval eval corpus

## Database migrations

- `0004_f7_foundations.sql`
- `0005_normalize_search_text.sql`

## Environment variables added/changed

```text
EMBEDDING_BACKEND=model|stub
EMBEDDING_MODEL_ID
EMBEDDING_MODEL_PATH / MODEL_PATH
EMBEDDING_ALLOW_STUB
EMBEDDING_TIMEOUT_MS
```

## Verification evidence

- Unit/integration/RLS/eval: **26/26 PASS**
- Hybrid chat smoke: `ho boi o dau` → grounded Pool hours, confidence 1
- Restore drill: clean DB + `/ready` + RLS PASS
- Config fail-fast: unchanged PASS from F6

## Exact commands

```bash
pnpm install && pnpm build:packages
NODE_ENV=test ALLOW_MEMORY_STORE=true RUN_PG_TESTS=1 LOTIVA_STORE=postgres \
  DATABASE_URL=postgres://lotiva:lotiva@localhost:5432/lotiva pnpm test

pnpm db:migrate && pnpm db:seed
./scripts/restore-drill.sh

# embedding contract (stub)
cd apps/embedding-service && EMBEDDING_BACKEND=stub EMBEDDING_ALLOW_STUB=true pytest

# E2E
RUN_E2E=1 pnpm --filter @lotiva/web e2e

# load
k6 run -e API_URL=http://127.0.0.1:4000 -e QR_TOKEN=$TOKEN infra/load/k6-business.js
```

## Recommended next phase

1. Mount EmbeddingGemma weights; set `EMBEDDING_BACKEND=model`; re-embed knowledge; verify dense path on pgvector image  
2. Execute staging DNS/TLS cutover + Playwright against staging  
3. Run business k6 to SLO → then reclassify to **CONDITIONAL PRODUCTION READY — TEXT EXPERIENCE ONLY**
