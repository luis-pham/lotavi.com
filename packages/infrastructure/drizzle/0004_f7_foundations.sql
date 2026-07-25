-- F7: embedding metadata, grounding, password reset, staff sessions, ticket event cursor

ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS content_hash text;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding_model_version text;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding_dimension integer;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedded_at timestamptz;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS locale text;
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'normal';

ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS locale text;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS criticality text DEFAULT 'normal';
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Ensure embedding storage exists (jsonb always available; vector when extension present)
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding jsonb;

CREATE INDEX IF NOT EXISTS knowledge_chunks_content_hash_idx
  ON knowledge_chunks(tenant_id, property_id, content_hash);

-- FTS on normalized content
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS content_tsv tsvector;
UPDATE knowledge_chunks
SET content_tsv = to_tsvector('simple', coalesce(content_normalized, lower(content)))
WHERE content_tsv IS NULL;
CREATE INDEX IF NOT EXISTS knowledge_chunks_fts_idx ON knowledge_chunks USING gin (content_tsv);

-- Message grounding metadata (internal; not guest-facing)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS grounding jsonb;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS answer_confidence double precision;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS fallback_reason text;

-- Password reset tokens (hashed at rest)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  request_ip text,
  user_agent text
);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id);

-- Staff session revocation store
CREATE TABLE IF NOT EXISTS staff_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  tenant_id uuid,
  role text NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_sessions_user_idx ON staff_sessions(user_id);

-- Durable ticket event log for SSE reconciliation (PostgreSQL SoT)
CREATE TABLE IF NOT EXISTS ticket_outbox_events (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  event_type text NOT NULL,
  status text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_outbox_property_idx
  ON ticket_outbox_events(property_id, id);

ALTER TABLE ticket_outbox_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ticket_outbox_tenant ON ticket_outbox_events;
CREATE POLICY ticket_outbox_tenant ON ticket_outbox_events
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
