-- V1.5: heartbeat / abandonment metadata for voice sessions

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS last_heartbeat_at timestamptz;

ALTER TABLE voice_sessions
  ADD COLUMN IF NOT EXISTS termination_reason text;

CREATE INDEX IF NOT EXISTS voice_sessions_heartbeat_idx
  ON voice_sessions(last_heartbeat_at)
  WHERE ended_at IS NULL;
