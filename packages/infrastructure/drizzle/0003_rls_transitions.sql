-- RLS for ticket transition history
ALTER TABLE ticket_transitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ticket_transitions_tenant ON ticket_transitions;
CREATE POLICY ticket_transitions_tenant ON ticket_transitions
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
