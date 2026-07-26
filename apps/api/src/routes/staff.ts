import type { FastifyInstance } from "fastify";
import { transitionTicket } from "@lotiva/application";
import { newId, type TicketStatus } from "@lotiva/domain";
import { getAppContext } from "../app-context.js";
import { sendError } from "../plugins/observability.js";
import { readStaff } from "./auth.js";

function mapStaffUiStatus(status: string): TicketStatus {
  const map: Record<string, TicketStatus> = {
    new: "submitted",
    accepted: "acknowledged",
    acknowledge: "acknowledged",
    acknowledged: "acknowledged",
    assigned: "assigned",
    start: "in_progress",
    in_progress: "in_progress",
    waiting: "needs_info",
    needs_info: "needs_info",
    complete: "resolved",
    completed: "resolved",
    resolved: "resolved",
    reopen: "reopened",
    reopened: "reopened",
    cancelled: "cancelled",
  };
  return map[status] ?? (status as TicketStatus);
}

export async function registerStaffRoutes(app: FastifyInstance) {
  app.get("/api/v1/staff/tickets", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin", "platform_admin"].includes(staff.role)) {
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
    if (!staff || !["staff", "manager", "property_admin", "platform_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const { id } = req.params as { id: string };
    const body = req.body as { status?: TicketStatus | string; assigneeId?: string | null; escalate?: boolean };
    if (!body.status && body.escalate === undefined && body.assigneeId === undefined) {
      return sendError(reply, req, 400, "VALIDATION", "status required");
    }
    try {
      if (body.assigneeId !== undefined || body.escalate) {
        await getAppContext().phase0.updateTicket(
          staff.tenantId,
          id,
          {
            ...(body.assigneeId !== undefined ? { assigneeId: body.assigneeId } : {}),
            ...(body.escalate ? { escalated: true, priority: "urgent" } : {}),
          },
          staff.userId,
        );
      }
      if (!body.status) {
        const item = await getAppContext().phase0.getTicket(staff.tenantId, id);
        return item ?? sendError(reply, req, 404, "TICKET_NOT_FOUND", "Not found");
      }
      const { normalizeTicketStatus } = await import("@lotiva/domain");
      const to = normalizeTicketStatus(mapStaffUiStatus(String(body.status)));
      if (to === "acknowledged" || to === "assigned" || to === "in_progress") {
        await getAppContext().phase0.updateTicket(
          staff.tenantId,
          id,
          { assigneeId: staff.userId, unreadStaff: false },
          staff.userId,
        );
      }
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

  app.get("/api/v1/staff/tickets/:id", async (req, reply) => {
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin", "platform_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const { id } = req.params as { id: string };
    const item = await getAppContext().phase0.getTicket(staff.tenantId, id);
    if (!item) return sendError(reply, req, 404, "TICKET_NOT_FOUND", "Not found");
    return item;
  });

  app.post("/api/v1/staff/tickets/:id/notes", async (req, reply) => {
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin", "platform_admin"].includes(staff.role)) {
      return sendError(reply, req, 403, "FORBIDDEN", "Staff only");
    }
    const { id } = req.params as { id: string };
    const body = req.body as { body?: string; visibility?: string };
    if (!body.body) return sendError(reply, req, 400, "VALIDATION", "body required");
    return getAppContext().phase0.addTicketNote(staff.tenantId, id, {
      authorId: staff.userId,
      visibility: body.visibility ?? "internal",
      body: body.body,
    });
  });

  app.post("/api/v1/staff/tickets/:id/messages", async (req, reply) => {
    const ctx = getAppContext();
    const staff = readStaff(req);
    if (!staff || !["staff", "manager", "property_admin", "platform_admin"].includes(staff.role)) {
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
