# F8.1 — Real EmbeddingGemma Verification

## Result

```text
BLOCKED
```

Unresolved condition: approved EmbeddingGemma artifact not mounted/downloaded on this host; `EMBEDDING_BACKEND=model` cannot be proven.

## Implemented (adapter complete)

- `apps/embedding-service/app/main.py`
  - `EMBEDDING_BACKEND=model|stub`
  - warmup on startup; `/ready` false until ready
  - `/health` independent of warmup
  - input/batch limits (`MAX_TEXTS=64`, `MAX_CHARS=8000`)
  - dimension enforcement = 768
  - refuses stub in production/staging without `EMBEDDING_ALLOW_STUB`
  - `/v1/diagnostics` for model metadata
- Config fail-fast (`packages/contracts/src/config.ts`):
  - production/staging forbids stub without break-glass
- Client refuses wrong dimension (`packages/infrastructure/src/embedding/client.ts`)

## Not executed

| Evidence | Status |
|----------|--------|
| Real model name/revision from loaded weights | Missing |
| Artifact path with licensed weights | Missing |
| Startup logs with model warmup | Missing |
| `/ready` with model backend | Missing |
| Sample 768-d finite vectors from real model | Missing |
| Latency p50/p95 benchmark | Missing |
| Real single/batch embedding tests against weights | Missing |

## Exact unblock commands

```bash
# 1) Obtain approved EmbeddingGemma 300M (768-d) weights under license
export EMBEDDING_MODEL_ID=google/embeddinggemma-300m
export EMBEDDING_MODEL_PATH=/models/embeddinggemma-300m
export EMBEDDING_BACKEND=model
export EMBEDDING_ALLOW_STUB=false
export NODE_ENV=production

# 2) Start service (requires sentence-transformers + weights)
cd apps/embedding-service
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8081

# 3) Verify
curl -sS http://localhost:8081/ready
curl -sS http://localhost:8081/v1/diagnostics
curl -sS -X POST http://localhost:8081/v1/embeddings \
  -H 'content-type: application/json' \
  -d '{"texts":["Hồ bơi ở đâu?"]}'
```

## Dense retrieval implication

Until F8.1 PASS, dense retrieval must not be claimed production-ready even if hybrid lexical path works.
