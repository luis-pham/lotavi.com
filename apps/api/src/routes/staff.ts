import type { FastifyInstance } from "fastify";
import { transitionTicket } from "@lotiva/application";
import { newId, type TicketStatus } from "@lotiva/domain";
import { getAppContext } from "../app-context.js";
import { sendError } from "../plugins/observability.js";
import { readStaff } from "./auth.js";

export async function registerStaffRoutes(app: FastifyInstance) {
  app.get("/api/v1/staff/tickets", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const property = await ctx.repos.catalog.getPropertyForTenant(staff.tenantId);
    if (!property) return { items: [] };
    const items = await ctx.repos.tickets.listForProperty(property.id, staff.tenantId);
    return {
      items: items.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        descriptionOriginal: t.description,
        descriptionTranslated: translateDemo(t.description),
      })),
    };
  });

  app.patch("/api/v1/staff/tickets/:id/status", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const { id } = req.params as { id: string };
    const body = req.body as { status?: TicketStatus };
    if (!body.status) return sendError(reply, req, 400, "VALIDATION", "status required");
    try {
      const { normalizeTicketStatus } = await import("@lotiva/domain");
      const to = normalizeTicketStatus(body.status);
      const updated = await transitionTicket({
        tickets: ctx.repos.tickets,
        tenantId: staff.tenantId,
        ticketId: id,
        to,
        actorType: "staff",
        actorId: staff.userId,
      });
      const property = await ctx.repos.catalog.getPropertyForTenant(staff.tenantId);
      let eventId: number | undefined;
      if (property) {
        try {
          const out = await ctx.repos.ticketOutbox.append({
            tenantId: staff.tenantId,
            propertyId: property.id,
            ticketId: id,
            eventType: "ticket.updated",
            status: to,
          });
          eventId = out.id;
        } catch {
          /* ignore */
        }
      }
      const { publishStaffTicketEvent } = await import("./realtime.js");
      publishStaffTicketEvent({
        type: "ticket.updated",
        ticketId: id,
        status: to,
        propertyId: property?.id,
        eventId,
      });
      return updated;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "CONCURRENCY_CONFLICT") {
        return sendError(reply, req, 409, code, (err as Error).message);
      }
      return sendError(reply, req, 400, "TICKET_TRANSITION", (err as Error).message);
    }
  });

  app.post("/api/v1/staff/tickets/:id/messages", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const { id } = req.params as { id: string };
    const body = req.body as { message?: string };
    if (!body.message) return sendError(reply, req, 400, "VALIDATION", "message required");
    const ticket = await ctx.repos.tickets.get(id, staff.tenantId);
    if (!ticket) return sendError(reply, req, 404, "TICKET_NOT_FOUND", "Not found");
    await ctx.repos.audit.append({
      tenantId: staff.tenantId,
      actorId: staff.userId,
      action: "ticket.message",
      entityType: "ticket",
      entityId: id,
      payload: {
        message: body.message,
        translated: translateDemo(body.message),
        correlationId: newId(),
      },
    });
    return {
      ok: true,
      message: body.message,
      translated: translateDemo(body.message),
    };
  });
}

function translateDemo(text: string): string {
  if (/[àáạảãâăèéêìíòóôơùúýăđ]/i.test(text)) {
    return `[EN] ${text}`;
  }
  return `[VI] ${text}`;
}
