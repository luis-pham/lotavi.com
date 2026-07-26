-- Phase 0 operational foundations

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  name text NOT NULL,
  slug text NOT NULL,
  default_sla_minutes integer NOT NULL DEFAULT 60,
  active boolean NOT NULL DEFAULT true,
  manager_user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS departments_property_idx ON departments(property_id);

CREATE TABLE IF NOT EXISTS request_categories (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  guest_name text NOT NULL,
  internal_name text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT 'help',
  default_department_id uuid REFERENCES departments(id),
  default_priority text NOT NULL DEFAULT 'normal',
  default_sla_minutes integer NOT NULL DEFAULT 60,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journeys (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS journeys_property_idx ON journeys(property_id);

CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  display_name text NOT NULL,
  email text,
  locale text NOT NULL DEFAULT 'en',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS guest_stays (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  guest_id uuid NOT NULL REFERENCES guests(id),
  journey_id uuid REFERENCES journeys(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  status text NOT NULL DEFAULT 'active',
  guest_session_id uuid REFERENCES guest_sessions(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES users(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS escalated boolean NOT NULL DEFAULT false;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'guest_portal';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES request_categories(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES journeys(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS due_at timestamptz;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS unread_staff boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS ticket_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  ticket_id uuid NOT NULL REFERENCES tickets(id),
  author_id uuid REFERENCES users(id),
  visibility text NOT NULL DEFAULT 'internal',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ticket_notes_ticket_idx ON ticket_notes(ticket_id);

CREATE TABLE IF NOT EXISTS handover_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  department_id uuid REFERENCES departments(id),
  author_id uuid REFERENCES users(id),
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS property_settings (
  property_id uuid PRIMARY KEY REFERENCES properties(id),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  timezone text NOT NULL DEFAULT 'UTC',
  default_language text NOT NULL DEFAULT 'en',
  brand_color text NOT NULL DEFAULT '#0F3D2E',
  logo_url text,
  contact_info text,
  default_sla_minutes integer NOT NULL DEFAULT 60,
  notification_defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_content (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  section_key text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'published',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, section_key)
);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target text NOT NULL DEFAULT 'current_journey';
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES journeys(id);

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deck text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS zone text;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS label text;
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS qr_level text NOT NULL DEFAULT 'cabin';
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS journey_id uuid REFERENCES journeys(id);
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS scan_count integer NOT NULL DEFAULT 0;
ALTER TABLE qr_contexts ADD COLUMN IF NOT EXISTS last_scan_at timestamptz;
