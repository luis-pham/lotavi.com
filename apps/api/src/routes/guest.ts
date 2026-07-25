import type { FastifyInstance } from "fastify";
import {
  ConfirmTicketRequestSchema,
  PrepareTicketRequestSchema,
  SendChatRequestSchema,
} from "@lotiva/contracts";
import {
  confirmTicketAction,
  openGuestSession,
  prepareTicketAction,
  sendGuestChat,
} from "@lotiva/application";
import { transitionTicket } from "@lotiva/application";
import { getAppContext } from "../app-context.js";
import { requireActiveGuest, type GuestCookie } from "../lib/guest-auth.js";
import { bumpMetric, getCorrelationId, sendError } from "../plugins/observability.js";
import { publishStaffTicketEvent } from "./realtime.js";

export async function registerGuestRoutes(app: FastifyInstance) {
  const cookieName = process.env.GUEST_COOKIE_NAME ?? "lotiva_guest";

  app.post("/api/v1/guest/sessions/from-qr", async (req, reply) => {
    const ctx = getAppContext();
    const body = req.body as { token?: string; locale?: string };
    if (!body.token) return sendError(reply, req, 400, "TOKEN_REQUIRED", "token required");

    const rl = await Promise.resolve(ctx.rateLimit.take(`qr:${req.ip}`));
    if (!rl.allowed) {
      reply.header("retry-after", Math.ceil(rl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many QR scans");
    }

    try {
      const result = await openGuestSession({
        qr: ctx.repos.qr,
        sessions: ctx.repos.sessions,
        themes: ctx.repos.themes,
        token: body.token,
        locale: body.locale,
      });
      const resolved = await ctx.repos.qr.resolveByToken(body.token);
      reply.setCookie(
        cookieName,
        JSON.stringify({
          sessionId: result.sessionId,
          tenantId: resolved!.tenantId,
          propertyId: result.propertyId,
          roomId: resolved!.roomId,
        } satisfies GuestCookie),
        {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          signed: true,
          secure: process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging",
          maxAge: 60 * 60 * 24,
        },
      );
      return {
        sessionId: result.sessionId,
        propertyId: result.propertyId,
        roomLabel: result.roomLabel,
        locale: result.locale,
        themeVersionId: result.themeVersionId,
        expiresAt: result.expiresAt,
        theme: result.theme,
        correlationId: getCorrelationId(req),
      };
    } catch (err) {
      const code = (err as { code?: string }).code ?? "QR_INVALID";
      return sendError(reply, req, 404, code, (err as Error).message);
    }
  });

  app.get("/api/v1/guest/me", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const session = guest.session;
    const theme = await ctx.repos.themes.getPublished(guest.cookie.propertyId);
    const room = await ctx.repos.catalog.getRoom(guest.cookie.roomId, guest.cookie.tenantId);
    return {
      sessionId: session.id,
      propertyId: session.propertyId,
      roomLabel: room?.label ?? "",
      locale: session.locale,
      themeVersionId: session.themeVersionId,
      expiresAt: session.expiresAt.toISOString(),
      theme,
    };
  });

  app.patch("/api/v1/guest/locale", async (req, reply) => {
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const body = req.body as { locale?: string };
    if (!body.locale || !/^[a-z]{2}(-[A-Za-z]{2})?$/.test(body.locale)) {
      return sendError(reply, req, 400, "VALIDATION", "locale required (e.g. vi-VN)");
    }
    await getAppContext().repos.sessions.setLocale(guest.cookie.sessionId, body.locale);
    return { locale: body.locale };
  });

  app.post("/api/v1/guest/chat", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const parsed = SendChatRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, req, 400, "VALIDATION", "Invalid body");

    const chatRl = await Promise.resolve(
      ctx.rateLimit.take(`chat:${guest.cookie.tenantId}:${req.ip}`),
    );
    if (!chatRl.allowed) {
      reply.header("retry-after", Math.ceil(chatRl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many chat requests");
    }

    const result = await sendGuestChat({
      conversations: ctx.repos.conversations,
      knowledge: ctx.repos.knowledge,
      embedding: ctx.embedding,
      tenantId: guest.cookie.tenantId,
      propertyId: guest.cookie.propertyId,
      guestSessionId: guest.cookie.sessionId,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
      locale: guest.session.locale,
    });
    return result;
  });

  app.get("/api/v1/guest/schedules", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const items = await ctx.repos.schedules.listActive(guest.cookie.propertyId, guest.cookie.tenantId);
    return {
      items: items.map((s) => ({
        ...s,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt?.toISOString() ?? null,
      })),
    };
  });

  app.get("/api/v1/guest/announcements", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const items = await ctx.repos.announcements.listActive(guest.cookie.propertyId, guest.cookie.tenantId);
    return {
      items: items.map((a) => ({
        ...a,
        publishedAt: a.publishedAt.toISOString(),
      })),
    };
  });

  app.post("/api/v1/guest/tickets/prepare", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const parsed = PrepareTicketRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, req, 400, "VALIDATION", "Invalid body");
    return prepareTicketAction({
      pending: ctx.repos.pending,
      tenantId: guest.cookie.tenantId,
      guestSessionId: guest.cookie.sessionId,
      category: parsed.data.category,
      description: parsed.data.description,
      department: parsed.data.department,
    });
  });

  app.post("/api/v1/guest/tickets/confirm", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const parsed = ConfirmTicketRequestSchema.safeParse(req.body);
    if (!parsed.success) return sendError(reply, req, 400, "VALIDATION", "Invalid body");
    const confirmRl = await Promise.resolve(
      ctx.rateLimit.take(`ticket-confirm:${guest.cookie.tenantId}:${req.ip}`),
    );
    if (!confirmRl.allowed) {
      reply.header("retry-after", Math.ceil(confirmRl.retryAfterMs / 1000));
      return sendError(reply, req, 429, "RATE_LIMITED", "Too many ticket confirmations");
    }
    const idem = (req.headers["idempotency-key"] as string | undefined) ?? parsed.data.idempotencyKey;
    try {
      const result = await confirmTicketAction({
        pending: ctx.repos.pending,
        tickets: ctx.repos.tickets,
        tenantId: guest.cookie.tenantId,
        propertyId: guest.cookie.propertyId,
        roomId: guest.cookie.roomId,
        guestSessionId: guest.cookie.sessionId,
        pendingActionId: parsed.data.pendingActionId,
        confirmed: parsed.data.confirmed,
        idempotencyKey: idem,
      });
      if (!result.cancelled && "ticketId" in result) {
        bumpMetric("ticketsCreated");
        const eventType = result.created ? "ticket.created" : "ticket.updated";
        let eventId: number | undefined;
        try {
          const out = await ctx.repos.ticketOutbox.append({
            tenantId: guest.cookie.tenantId,
            propertyId: guest.cookie.propertyId,
            ticketId: result.ticketId,
            eventType,
            status: "submitted",
          });
          eventId = out.id;
        } catch {
          /* outbox optional on memory */
        }
        publishStaffTicketEvent({
          type: eventType,
          ticketId: result.ticketId,
          status: "submitted",
          propertyId: guest.cookie.propertyId,
          eventId,
        });
      }
      return result;
    } catch (err) {
      const code = (err as { code?: string }).code ?? "TICKET_ERROR";
      return sendError(reply, req, 400, code, (err as Error).message);
    }
  });

  app.post("/api/v1/guest/tickets/:id/confirm-completion", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const { id } = req.params as { id: string };
    const ticket = await ctx.repos.tickets.get(id, guest.cookie.tenantId);
    if (!ticket || ticket.guestSessionId !== guest.cookie.sessionId) {
      return sendError(reply, req, 404, "TICKET_NOT_FOUND", "Not found");
    }
    try {
      const updated = await transitionTicket({
        tickets: ctx.repos.tickets,
        tenantId: guest.cookie.tenantId,
        ticketId: id,
        to: "guest_confirmed",
        actorType: "guest",
        actorId: guest.cookie.sessionId,
        correlationId: getCorrelationId(req),
      });
      publishStaffTicketEvent({
        type: "ticket.updated",
        ticketId: id,
        status: "guest_confirmed",
        propertyId: guest.cookie.propertyId,
      });
      return updated;
    } catch (err) {
      return sendError(reply, req, 400, "TICKET_TRANSITION", (err as Error).message);
    }
  });

  app.post("/api/v1/guest/tickets/:id/reopen", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const { id } = req.params as { id: string };
    const ticket = await ctx.repos.tickets.get(id, guest.cookie.tenantId);
    if (!ticket || ticket.guestSessionId !== guest.cookie.sessionId) {
      return sendError(reply, req, 404, "TICKET_NOT_FOUND", "Not found");
    }
    try {
      const updated = await transitionTicket({
        tickets: ctx.repos.tickets,
        tenantId: guest.cookie.tenantId,
        ticketId: id,
        to: "reopened",
        actorType: "guest",
        actorId: guest.cookie.sessionId,
        correlationId: getCorrelationId(req),
      });
      publishStaffTicketEvent({
        type: "ticket.updated",
        ticketId: id,
        status: "reopened",
        propertyId: guest.cookie.propertyId,
      });
      return updated;
    } catch (err) {
      return sendError(reply, req, 400, "TICKET_TRANSITION", (err as Error).message);
    }
  });

  app.get("/api/v1/guest/tickets", async (req, reply) => {
    const ctx = getAppContext();
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const items = await ctx.repos.tickets.listForGuestSession(
      guest.cookie.sessionId,
      guest.cookie.tenantId,
    );
    return {
      items: items.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
    };
  });
}
