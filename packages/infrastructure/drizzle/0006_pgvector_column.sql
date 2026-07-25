-- F8: optional pgvector dense column + HNSW index.
-- Does not fail on hosts without the vector package (local Homebrew Postgres).
-- Staging/production uses pgvector/pgvector:pg16 where the extension is available.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
    CREATE EXTENSION IF NOT EXISTS vector;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector extension unavailable: %', SQLERRM;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE knowledge_chunks
      ADD COLUMN IF NOT EXISTS embedding_vector vector(768);

    UPDATE knowledge_chunks
    SET embedding_vector = embedding::text::vector
    WHERE embedding_vector IS NULL
      AND embedding IS NOT NULL
      AND jsonb_typeof(embedding) = 'array'
      AND jsonb_array_length(embedding) = 768;

    CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
      ON knowledge_chunks
      USING hnsw (embedding_vector vector_cosine_ops)
      WHERE embedding_vector IS NOT NULL;
  ELSE
    RAISE NOTICE 'skipping embedding_vector column — vector extension not installed';
  END IF;
END $$;
