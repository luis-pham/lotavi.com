import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { newId } from "@lotiva/domain";
import { getAppContext } from "../app-context.js";
import { pingPostgres } from "@lotiva/infrastructure";

type Metrics = {
  requests: number;
  errors: number;
  qrInvalid: number;
  ticketsCreated: number;
};

const metrics: Metrics = {
  requests: 0,
  errors: 0,
  qrInvalid: 0,
  ticketsCreated: 0,
};

export function bumpMetric(key: keyof Metrics, by = 1) {
  metrics[key] += by;
}

export async function registerObservability(app: FastifyInstance) {
  app.addHook("onRequest", async (req) => {
    const correlationId =
      (req.headers["x-correlation-id"] as string | undefined) ?? newId();
    (req as FastifyRequest & { correlationId: string }).correlationId = correlationId;
    bumpMetric("requests");
  });

  app.addHook("onSend", async (req, reply, payload) => {
    const correlationId = (req as FastifyRequest & { correlationId?: string }).correlationId;
    if (correlationId) reply.header("x-correlation-id", correlationId);
    if (reply.statusCode >= 500) bumpMetric("errors");
    return payload;
  });

  app.get("/health", async () => ({
    status: "ok" as const,
    service: "lotiva-api",
    version: "0.1.0",
  }));

  app.get("/ready", async (_req, reply) => {
    const ctx = getAppContext();
    const checks: Record<string, string> = {
      store: ctx.store,
    };
    if (ctx.store === "postgres") {
      checks.postgres = (await pingPostgres()) ? "ok" : "down";
    } else {
      checks.postgres = "skipped_memory";
    }
    const ready = ctx.store === "memory" || checks.postgres === "ok";
    if (!ready) {
      return reply.status(503).send({ status: "not_ready", checks });
    }
    return { status: "ok", checks, voiceEnabled: ctx.voiceEnabled };
  });

  app.get("/metrics", async (_req, reply) => {
    reply.header("content-type", "text/plain; version=0.0.4");
    return [
      "# HELP lotiva_up Lotiva API up",
      "# TYPE lotiva_up gauge",
      "lotiva_up 1",
      "# HELP lotiva_http_requests_total HTTP requests",
      "# TYPE lotiva_http_requests_total counter",
      `lotiva_http_requests_total ${metrics.requests}`,
      "# HELP lotiva_http_errors_total HTTP 5xx",
      "# TYPE lotiva_http_errors_total counter",
      `lotiva_http_errors_total ${metrics.errors}`,
      "# HELP lotiva_qr_invalid_total Invalid QR attempts",
      "# TYPE lotiva_qr_invalid_total counter",
      `lotiva_qr_invalid_total ${metrics.qrInvalid}`,
      "# HELP lotiva_tickets_created_total Tickets created",
      "# TYPE lotiva_tickets_created_total counter",
      `lotiva_tickets_created_total ${metrics.ticketsCreated}`,
    ].join("\n");
  });
}

export function getCorrelationId(req: FastifyRequest): string {
  return (req as FastifyRequest & { correlationId?: string }).correlationId ?? newId();
}

export function sendError(
  reply: FastifyReply,
  req: FastifyRequest,
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  if (code === "QR_INVALID") bumpMetric("qrInvalid");
  return reply.status(status).send({
    error: {
      code,
      message,
      correlationId: getCorrelationId(req),
      ...(details ? { details } : {}),
    },
  });
}
