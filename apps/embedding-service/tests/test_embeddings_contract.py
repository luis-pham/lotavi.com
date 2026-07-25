"""Contract tests for embedding service (stub backend)."""

import os

os.environ["EMBEDDING_BACKEND"] = "stub"
os.environ["EMBEDDING_ALLOW_STUB"] = "true"
os.environ["NODE_ENV"] = "test"

from fastapi.testclient import TestClient

from app.main import app, DIMS


client = TestClient(app)


def test_health_and_ready():
    assert client.get("/health").status_code == 200
    r = client.get("/ready")
    assert r.status_code == 200
    assert r.json()["dimensions"] == DIMS


def test_valid_embedding():
    r = client.post("/v1/embeddings", json={"texts": ["Hồ bơi mở lúc mấy giờ"]})
    assert r.status_code == 200
    data = r.json()
    assert data["dimensions"] == DIMS
    assert len(data["embeddings"][0]) == DIMS


def test_batch():
    r = client.post("/v1/embeddings", json={"texts": ["a", "b", "c"]})
    assert r.status_code == 200
    assert len(r.json()["embeddings"]) == 3


def test_empty_rejected():
    r = client.post("/v1/embeddings", json={"texts": ["  "]})
    assert r.status_code == 422


def test_oversized_rejected():
    r = client.post("/v1/embeddings", json={"texts": ["x" * 9000]})
    assert r.status_code == 422
