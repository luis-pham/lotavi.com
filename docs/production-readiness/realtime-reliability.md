# Staff realtime reliability (F7.6)

- SSE `/api/v1/staff/events` with property filter + de-dupe
- Redis pub/sub when available; local fanout fallback
- PostgreSQL `ticket_outbox_events` is source of truth
- Reconnect catch-up + `GET /api/v1/staff/events/since?afterId=`
