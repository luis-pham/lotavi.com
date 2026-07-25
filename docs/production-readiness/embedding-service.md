# Embedding service (F7.1)

## Contract

- `POST /v1/embeddings` → 768-d vectors
- `GET /health`, `GET /ready`
- Max batch 64, max chars 8000
- Wrong dimension rejected

## Backends

| `EMBEDDING_BACKEND` | Use |
|---------------------|-----|
| `model` | sentence-transformers load of `EMBEDDING_MODEL_ID` / `EMBEDDING_MODEL_PATH` (EmbeddingGemma 768-d) |
| `stub` | Deterministic SHA-256 vectors — **tests/dev only** |

Production/staging: `EMBEDDING_BACKEND=model` and `EMBEDDING_ALLOW_STUB=false`.

## Artifact required

```text
Model: google/embeddinggemma-300m (or mounted EMBEDDING_MODEL_PATH)
Dimension: 768
Hardware: CPU OK for pilot; GPU recommended for multi-property scale
```

## Persistence metadata

`embedding_model`, `embedding_model_version`, `embedding_dimension`, `embedded_at`, `content_hash` on `knowledge_chunks`.

## Verification status

- Contract tests (stub): implemented
- Real EmbeddingGemma weights download/load: **not verified in this environment**
