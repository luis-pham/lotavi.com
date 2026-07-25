"""
Lotiva embedding service — EmbeddingGemma (768-d) production adapter.

Backends:
  EMBEDDING_BACKEND=model  — load sentence-transformers model from EMBEDDING_MODEL_ID / MODEL_PATH
  EMBEDDING_BACKEND=stub   — deterministic vectors for tests only (forbidden in production unless EMBEDDING_ALLOW_STUB=true)

Production must set EMBEDDING_BACKEND=model and provide model weights.
"""

from __future__ import annotations

import hashlib
import math
import os
import signal
import threading
import time
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

DIMS = 768
MAX_TEXTS = 64
MAX_CHARS = 8000
DEFAULT_MODEL_ID = os.getenv("EMBEDDING_MODEL_ID", "google/embeddinggemma-300m")
MODEL_PATH = os.getenv("EMBEDDING_MODEL_PATH") or os.getenv("MODEL_PATH") or ""
BACKEND = os.getenv("EMBEDDING_BACKEND", "stub").lower()
ALLOW_STUB = os.getenv("EMBEDDING_ALLOW_STUB", "false").lower() in ("1", "true", "yes")
NODE_ENV = os.getenv("NODE_ENV", "development")
REQUEST_TIMEOUT_MS = int(os.getenv("EMBEDDING_TIMEOUT_MS", "30000"))

app = FastAPI(title="Lotiva Embedding Service", version="0.2.0")

_model = None
_model_lock = threading.Lock()
_ready = False
_model_version = "unloaded"
_shutdown = False


class EmbedRequest(BaseModel):
    texts: List[str] = Field(min_length=1, max_length=MAX_TEXTS)

    @field_validator("texts")
    @classmethod
    def validate_texts(cls, texts: List[str]) -> List[str]:
        if not texts:
            raise ValueError("texts must be non-empty")
        for t in texts:
            if t is None or not str(t).strip():
                raise ValueError("empty text not allowed")
            if len(t) > MAX_CHARS:
                raise ValueError(f"text exceeds {MAX_CHARS} characters")
        return texts


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    model_version: str
    dimensions: int = DIMS


def pseudo_embed(text: str) -> List[float]:
    digest = hashlib.sha256(text.encode("utf-8")).digest()
    values = []
    for i in range(DIMS):
        b = digest[i % len(digest)]
        values.append(((b / 255.0) * 2) - 1)
    norm = math.sqrt(sum(v * v for v in values)) or 1.0
    return [v / norm for v in values]


def _load_model() -> None:
    global _model, _ready, _model_version
    if BACKEND == "stub":
        if NODE_ENV in ("production", "staging") and not ALLOW_STUB:
            raise RuntimeError(
                "EMBEDDING_BACKEND=stub forbidden in production/staging without EMBEDDING_ALLOW_STUB=true"
            )
        _model = "stub"
        _model_version = "stub-sha256-v1"
        _ready = True
        return

    # Production path: sentence-transformers EmbeddingGemma (or compatible 768-d model)
    from sentence_transformers import SentenceTransformer

    path = MODEL_PATH or DEFAULT_MODEL_ID
    _model = SentenceTransformer(path)
    # Warmup
    vec = _model.encode(["warmup"], normalize_embeddings=True)
    if len(vec[0]) != DIMS:
        raise RuntimeError(f"model dimension {len(vec[0])} != required {DIMS}")
    _model_version = f"{path}"
    _ready = True


@app.on_event("startup")
def on_startup() -> None:
    with _model_lock:
        _load_model()


@app.on_event("shutdown")
def on_shutdown() -> None:
    global _shutdown, _ready
    _shutdown = True
    _ready = False


@app.get("/health")
def health():
    return {
        "status": "ok" if not _shutdown else "stopping",
        "service": "lotiva-embedding",
        "backend": BACKEND,
        "dimensions": DIMS,
    }


@app.get("/ready")
def ready():
    if not _ready or _shutdown:
        raise HTTPException(status_code=503, detail="embedding model not ready")
    return {
        "status": "ok",
        "backend": BACKEND,
        "model": DEFAULT_MODEL_ID if BACKEND == "model" else "stub",
        "model_version": _model_version,
        "dimensions": DIMS,
    }


@app.get("/v1/diagnostics")
def diagnostics():
    """Internal model metadata — do not expose publicly in production ingress."""
    return {
        "backend": BACKEND,
        "model_id": DEFAULT_MODEL_ID,
        "model_path": MODEL_PATH or None,
        "model_version": _model_version,
        "dimensions": DIMS,
        "ready": _ready,
        "max_texts": MAX_TEXTS,
        "max_chars": MAX_CHARS,
        "timeout_ms": REQUEST_TIMEOUT_MS,
    }


def _encode(texts: List[str]) -> List[List[float]]:
    started = time.time()
    if BACKEND == "stub" or _model == "stub":
        out = [pseudo_embed(t) for t in texts]
    else:
        vectors = _model.encode(texts, normalize_embeddings=True, batch_size=min(32, len(texts)))
        out = [list(map(float, v)) for v in vectors]
    elapsed_ms = (time.time() - started) * 1000
    if elapsed_ms > REQUEST_TIMEOUT_MS:
        raise HTTPException(status_code=504, detail="embedding timeout")
    for v in out:
        if len(v) != DIMS:
            raise HTTPException(status_code=500, detail=f"wrong embedding dimension {len(v)}")
    return out


@app.post("/v1/embeddings", response_model=EmbedResponse)
def embeddings(body: EmbedRequest):
    if not _ready:
        raise HTTPException(status_code=503, detail="not ready")
    with _model_lock:
        vectors = _encode(body.texts)
    return EmbedResponse(
        embeddings=vectors,
        model=DEFAULT_MODEL_ID if BACKEND == "model" else "embeddinggemma-stub",
        model_version=_model_version,
        dimensions=DIMS,
    )


def run() -> None:
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", "8081")), reload=False)


if __name__ == "__main__":
    run()
