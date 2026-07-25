-- V0: voice session ownership + transport metadata for safety foundation

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS guest_session_id uuid REFERENCES guest_sessions(id);

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id);

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS transport text NOT NULL DEFAULT 'relay';

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS provider_session_ref text;

CREATE INDEX IF NOT EXISTS voice_sessions_guest_idx
  ON voice_sessions(guest_session_id);

CREATE INDEX IF NOT EXISTS voice_sessions_property_open_idx
  ON voice_sessions(property_id, status)
  WHERE ended_at IS NULL;
