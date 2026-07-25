import type { FastifyInstance } from "fastify";
import { Redis } from "ioredis";
import { getAppContext, getConfig } from "../app-context.js";
import { sendError } from "../plugins/observability.js";
import { readStaff } from "./auth.js";

type TicketEvent = {
  type: "ticket.created" | "ticket.updated" | "heartbeat" | "ticket.reconcile";
  ticketId?: string;
  status?: string;
  propertyId?: string;
  eventId?: number;
  at: string;
};

const CHANNEL = "lotiva:staff:tickets";
const localSubscribers = new Set<(event: TicketEvent) => void>();
let publisher: Redis | null = null;
let subscriber: Redis | null = null;
let initStarted = false;

function fanoutLocal(event: TicketEvent) {
  for (const sub of localSubscribers) sub(event);
}

function ensureRedis() {
  if (initStarted) return;
  initStarted = true;
  const env = getConfig();
  if (env.LOTIVA_STORE === "memory") return;

  const onFail = () => {
    publisher = null;
    subscriber = null;
  };

  try {
    publisher = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    subscriber = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
    });
    publisher.on("error", () => onFail());
    subscriber.on("error", () => onFail());
    void publisher.connect().catch(onFail);
    void subscriber
      .connect()
      .then(async () => {
        if (!subscriber) return;
        await subscriber.subscribe(CHANNEL);
        subscriber.on("message", (_ch, message) => {
          try {
            fanoutLocal(JSON.parse(message) as TicketEvent);
          } catch {
            /* ignore */
          }
        });
      })
      .catch(onFail);
  } catch {
    onFail();
  }
}

export function publishStaffTicketEvent(event: Omit<TicketEvent, "at">) {
  ensureRedis();
  const full: TicketEvent = { ...event, at: new Date().toISOString() };
  if (publisher) {
    void publisher.publish(CHANNEL, JSON.stringify(full)).catch(() => fanoutLocal(full));
    return;
  }
  fanoutLocal(full);
}

export async function registerRealtimeRoutes(app: FastifyInstance) {
  ensureRedis();

  /** Reconcile missed events from PostgreSQL outbox (source of truth). */
  app.get("/api/v1/staff/events/since", async (req, reply) => {
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const afterId = Number((req.query as { afterId?: string }).afterId ?? "0");
    const property = await getAppContext().repos.catalog.getPropertyForTenant(staff.tenantId);
    if (!property) return { events: [], cursor: afterId };
    const events = await getAppContext().repos.ticketOutbox.listSince(
      property.id,
      staff.tenantId,
      Number.isFinite(afterId) ? afterId : 0,
      200,
    );
    return {
      events: events.map((e) => ({
        eventId: e.id,
        type: e.eventType,
        ticketId: e.ticketId,
        status: e.status,
        propertyId: e.propertyId,
        at: e.createdAt.toISOString(),
      })),
      cursor: events.length ? events[events.length - 1]!.id : afterId,
    };
  });

  app.get("/api/v1/staff/events", async (req, reply) => {
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }

    const sseRl = await Promise.resolve(
      getAppContext().rateLimit.take(`sse:${staff.tenantId}:${staff.userId}`),
    );
    if (!sseRl.allowed) {
      reply.header("retry-after", Math.ceil(sseRl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many SSE connections");
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });

    const property = await getAppContext().repos.catalog.getPropertyForTenant(staff.tenantId);
    const seen = new Set<string>();
    const send = (event: TicketEvent) => {
      if (event.type === "heartbeat") {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
        return;
      }
      if (property && event.propertyId && event.propertyId !== property.id) return;
      const key = `${event.eventId ?? ""}:${event.ticketId ?? ""}:${event.type}:${event.status ?? ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    };
    localSubscribers.add(send);
    send({ type: "heartbeat", at: new Date().toISOString() });

    // Catch-up from Postgres on connect
    if (property) {
      try {
        const missed = await getAppContext().repos.ticketOutbox.listSince(
          property.id,
          staff.tenantId,
          0,
          50,
        );
        for (const e of missed) {
          send({
            type: e.eventType as TicketEvent["type"],
            ticketId: e.ticketId,
            status: e.status,
            propertyId: e.propertyId,
            eventId: e.id,
            at: e.createdAt.toISOString(),
          });
        }
      } catch {
        /* ignore */
      }
    }

    const timer = setInterval(() => {
      send({ type: "heartbeat", at: new Date().toISOString() });
    }, 15_000);

    req.raw.on("close", () => {
      clearInterval(timer);
      localSubscribers.delete(send);
    });
  });
}
