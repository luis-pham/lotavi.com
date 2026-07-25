CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- pgvector when available (Docker image / properly installed). Local brew may lack it.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pgvector unavailable — continuing without vector extension';
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_stat_statements unavailable — continuing';
END $$;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  name text NOT NULL,
  vertical text NOT NULL DEFAULT 'hotel',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS properties_tenant_idx ON properties(tenant_id);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rooms_property_idx ON rooms(property_id);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id);

CREATE TABLE IF NOT EXISTS qr_contexts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  token_hash text NOT NULL UNIQUE,
  active_from timestamptz NOT NULL,
  active_until timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_sessions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  qr_context_id uuid NOT NULL REFERENCES qr_contexts(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  locale text NOT NULL,
  theme_version_id uuid,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS guest_sessions_tenant_idx ON guest_sessions(tenant_id);

CREATE TABLE IF NOT EXISTS portal_theme_versions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  status text NOT NULL,
  tokens jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_theme_publications (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  version_id uuid NOT NULL REFERENCES portal_theme_versions(id),
  published_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  guest_session_id uuid NOT NULL REFERENCES guest_sessions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  title text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(768);
  ELSE
    ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding jsonb;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  title text NOT NULL,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pending_actions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  guest_session_id uuid NOT NULL REFERENCES guest_sessions(id),
  category text NOT NULL,
  description text NOT NULL,
  department text,
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  guest_session_id uuid NOT NULL REFERENCES guest_sessions(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  category text NOT NULL,
  description text NOT NULL,
  department text,
  status text NOT NULL DEFAULT 'new',
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS ticket_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  conversation_id uuid NOT NULL REFERENCES conversations(id),
  provider text NOT NULL DEFAULT 'gemini_live',
  status text NOT NULL DEFAULT 'initializing',
  revision integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS prompt_profiles (
  id uuid PRIMARY KEY,
  tenant_id uuid REFERENCES tenants(id),
  property_id uuid REFERENCES properties(id),
  name text NOT NULL,
  scope text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prompt_versions (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES prompt_profiles(id),
  version integer NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY,
  tenant_id uuid,
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

-- RLS on tenant-owned sensitive tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_properties ON properties
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_rooms ON rooms
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_qr ON qr_contexts
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_guest_sessions ON guest_sessions
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_tickets ON tickets
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_knowledge_documents ON knowledge_documents
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_knowledge_chunks ON knowledge_chunks
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_messages ON messages
  USING (tenant_id::text = current_setting('app.tenant_id', true));
CREATE POLICY tenant_isolation_pending ON pending_actions
  USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Force RLS for table owners too
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE rooms FORCE ROW LEVEL SECURITY;
ALTER TABLE qr_contexts FORCE ROW LEVEL SECURITY;
ALTER TABLE guest_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE tickets FORCE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents FORCE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks FORCE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE pending_actions FORCE ROW LEVEL SECURITY;
