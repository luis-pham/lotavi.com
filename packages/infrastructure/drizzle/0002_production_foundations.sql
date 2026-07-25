-- Ticket transition audit (immutable history)
CREATE TABLE IF NOT EXISTS ticket_transitions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  from_status text NOT NULL,
  to_status text NOT NULL,
  actor_id uuid,
  actor_type text NOT NULL,
  reason text,
  correlation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_transitions_ticket_idx ON ticket_transitions(ticket_id);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS guest_confirmed_at timestamptz;

-- Normalized search text for Vietnamese / hybrid retrieval
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS content_normalized text;
ALTER TABLE knowledge_documents ADD COLUMN IF NOT EXISTS title_normalized text;

UPDATE knowledge_chunks
SET content_normalized = lower(content)
WHERE content_normalized IS NULL;

UPDATE knowledge_documents
SET title_normalized = lower(title)
WHERE title_normalized IS NULL;

CREATE INDEX IF NOT EXISTS knowledge_chunks_trgm_idx
  ON knowledge_chunks USING gin (content_normalized gin_trgm_ops);
CREATE INDEX IF NOT EXISTS knowledge_documents_trgm_idx
  ON knowledge_documents USING gin (title_normalized gin_trgm_ops);

-- Guest session locale preference (per session, not per room QR)
ALTER TABLE guest_sessions ADD COLUMN IF NOT EXISTS locale_selected text;

-- Message translation fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS source_locale text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translated_content text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translation_provider text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS translation_status text;

-- QR rotation support
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS rotated_from uuid;
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS rotated_at timestamptz;
