import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { hashPassword } from "@lotiva/domain";
import type { Phase0Scope } from "@lotiva/infrastructure";
import { getAppContext } from "../app-context.js";
import { requireActiveGuest } from "../lib/guest-auth.js";
import { sendError } from "../plugins/observability.js";
import { readStaff } from "./auth.js";

const ADMIN_ROLES = new Set(["property_admin", "platform_admin", "manager"]);
const CONFIG_ADMIN_ROLES = new Set(["property_admin", "platform_admin"]);
const STAFF_ROLES = new Set(["staff", "manager", "property_admin", "platform_admin"]);

type Principal = NonNullable<ReturnType<typeof readStaff>>;

function authorize(req: FastifyRequest, reply: FastifyReply, roles: Set<string>): Principal | null {
  const principal = readStaff(req);
  if (!principal || !roles.has(principal.role)) {
    sendError(reply, req, 403, "FORBIDDEN", "Insufficient permissions");
    return null;
  }
  return principal;
}

async function scopeFor(principal: Principal) {
  const property = await getAppContext().repos.catalog.getPropertyForTenant(principal.tenantId);
  return property ? { tenantId: principal.tenantId, propertyId: property.id } : null;
}

function body(req: FastifyRequest): Record<string, unknown> {
  return (req.body ?? {}) as Record<string, unknown>;
}

function idParam(req: FastifyRequest): string {
  return (req.params as { id: string }).id;
}

export async function registerPhase0Routes(app: FastifyInstance) {
  const admin = (req: FastifyRequest, reply: FastifyReply) => authorize(req, reply, ADMIN_ROLES);
  const configAdmin = (req: FastifyRequest, reply: FastifyReply) => authorize(req, reply, CONFIG_ADMIN_ROLES);
  const staff = (req: FastifyRequest, reply: FastifyReply) => authorize(req, reply, STAFF_ROLES);

  app.get("/api/v1/me", async (req, reply) => {
    const principal = staff(req, reply);
    if (!principal) return reply;
    const user = await getAppContext().repos.identity.findById(principal.userId);
    if (!user) return sendError(reply, req, 401, "UNAUTHORIZED", "User missing");
    const member = (await getAppContext().phase0.listStaff(principal.tenantId)).find((x) => x.id === principal.userId);
    return { ...user, passwordHash: undefined, departmentId: member?.departmentId ?? null, active: member?.active ?? true };
  });

  app.get("/api/v1/admin/overview", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return scope ? getAppContext().phase0.overview(scope) : {};
  });

  app.get("/api/v1/admin/requests", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return { items: [] };
    const query = req.query as Record<string, string | undefined>;
    return { items: await getAppContext().phase0.listTickets(scope, { status: query.status, department: query.department, priority: query.priority, assignee: query.assignee, search: query.search }) };
  });
  app.patch("/api/v1/admin/requests", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const value = body(req); const ids = Array.isArray(value.ids) ? value.ids.map(String) : [];
    return { items: await getAppContext().phase0.bulkUpdateTickets(principal.tenantId, ids, (value.patch ?? {}) as Record<string, unknown>, principal.userId) };
  });
  app.patch("/api/v1/admin/requests/bulk", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const value = body(req); const ids = Array.isArray(value.ids) ? value.ids.map(String) : [];
    return { items: await getAppContext().phase0.bulkUpdateTickets(principal.tenantId, ids, (value.patch ?? {}) as Record<string, unknown>, principal.userId) };
  });
  app.get("/api/v1/admin/requests/:id", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const item = await getAppContext().phase0.getTicket(principal.tenantId, idParam(req));
    return item ?? sendError(reply, req, 404, "REQUEST_NOT_FOUND", "Request not found");
  });
  app.patch("/api/v1/admin/requests/:id", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const value = body(req);
    if (value.status) {
      const ui: Record<string, string> = {
        new: "submitted",
        accepted: "acknowledged",
        waiting: "needs_info",
        completed: "resolved",
        complete: "resolved",
      };
      value.status = ui[String(value.status)] ?? value.status;
    }
    const item = await getAppContext().phase0.updateTicket(principal.tenantId, idParam(req), value, principal.userId);
    return item ?? sendError(reply, req, 404, "REQUEST_NOT_FOUND", "Request not found");
  });
  app.post("/api/v1/admin/requests/:id/notes", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const value = body(req); if (!value.body) return sendError(reply, req, 400, "VALIDATION", "body required");
    return getAppContext().phase0.addTicketNote(principal.tenantId, idParam(req), { authorId: principal.userId, visibility: String(value.visibility ?? "internal"), body: String(value.body) });
  });
  for (const action of ["assign", "priority", "escalate"] as const) {
    app.patch(`/api/v1/admin/requests/:id/${action}`, async (req, reply) => {
      const principal = admin(req, reply); if (!principal) return reply;
      const value = body(req);
      const patch = action === "assign" ? { assigneeId: value.assigneeId ?? null } : action === "priority" ? { priority: value.priority } : { escalated: value.escalated ?? true };
      return (await getAppContext().phase0.updateTicket(principal.tenantId, idParam(req), patch, principal.userId)) ?? sendError(reply, req, 404, "REQUEST_NOT_FOUND", "Request not found");
    });
  }

  const collections = [
    { path: "departments", list: "listDepartments", create: "createDepartment", update: "updateDepartment", remove: "deleteDepartment", configOnly: true },
    { path: "categories", list: "listCategories", create: "createCategory", update: "updateCategory", remove: "deleteCategory", configOnly: true },
    { path: "journeys", list: "listJourneys", create: "createJourney", update: "updateJourney", remove: "deleteJourney", configOnly: false },
    { path: "guests", list: "listGuests", create: "createGuest", update: "updateGuest", remove: "deleteGuest", configOnly: false },
    { path: "announcements", list: "listAnnouncements", create: "createAnnouncement", update: "updateAnnouncement", remove: "deleteAnnouncement", configOnly: false },
  ] as const;
  for (const collection of collections) {
    const gate = collection.configOnly ? configAdmin : admin;
    app.get(`/api/v1/admin/${collection.path}`, async (req, reply) => {
      const principal = gate(req, reply); if (!principal) return reply;
      const scope = await scopeFor(principal); if (!scope) return { items: [] };
      const items = await (getAppContext().phase0[collection.list] as (value: Phase0Scope) => Promise<unknown[]>)(scope);
      return { items };
    });
    app.post(`/api/v1/admin/${collection.path}`, async (req, reply) => {
      const principal = gate(req, reply); if (!principal) return reply;
      const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
      return (getAppContext().phase0[collection.create] as (target: Phase0Scope, value: Record<string, unknown>) => Promise<unknown>)(scope, body(req));
    });
    app.patch(`/api/v1/admin/${collection.path}/:id`, async (req, reply) => {
      const principal = gate(req, reply); if (!principal) return reply;
      return (getAppContext().phase0[collection.update] as (tenantId: string, id: string, value: Record<string, unknown>) => Promise<unknown>)(principal.tenantId, idParam(req), body(req));
    });
    app.delete(`/api/v1/admin/${collection.path}/:id`, async (req, reply) => {
      const principal = gate(req, reply); if (!principal) return reply;
      return { deleted: await (getAppContext().phase0[collection.remove] as (tenantId: string, id: string) => Promise<boolean>)(principal.tenantId, idParam(req)) };
    });
  }

  app.post("/api/v1/admin/guests/:id/assign-cabin", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
    const value = body(req); if (!value.roomId) return sendError(reply, req, 400, "VALIDATION", "roomId required");
    return getAppContext().phase0.assignCabin(principal.tenantId, idParam(req), { propertyId: scope.propertyId, roomId: String(value.roomId), journeyId: value.journeyId ? String(value.journeyId) : null, guestSessionId: value.guestSessionId ? String(value.guestSessionId) : null });
  });

  app.get("/api/v1/admin/cabins", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return { items: scope ? await getAppContext().phase0.listRooms(scope) : [] };
  });
  app.patch("/api/v1/admin/cabins/:id", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    return getAppContext().phase0.updateRoom(principal.tenantId, idParam(req), body(req));
  });
  app.get("/api/v1/admin/rooms", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return { items: scope ? await getAppContext().phase0.listRooms(scope) : [] };
  });
  app.patch("/api/v1/admin/rooms/:id", async (req, reply) => {
    const principal = admin(req, reply); if (!principal) return reply;
    return getAppContext().phase0.updateRoom(principal.tenantId, idParam(req), body(req));
  });

  app.get("/api/v1/admin/portal-content", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return { items: scope ? await getAppContext().phase0.listPortalContent(scope) : [] };
  });
  app.put("/api/v1/admin/portal-content", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
    return getAppContext().phase0.upsertPortalContent(scope, body(req));
  });
  app.post("/api/v1/admin/portal-content", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
    return getAppContext().phase0.upsertPortalContent(scope, body(req));
  });

  app.get("/api/v1/admin/settings", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return scope ? getAppContext().phase0.getPropertySettings(scope) : null;
  });
  app.put("/api/v1/admin/settings", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
    return getAppContext().phase0.putPropertySettings(scope, body(req));
  });

  app.get("/api/v1/admin/qr", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return { items: scope ? await getAppContext().phase0.listQr(scope) : [] };
  });
  app.patch("/api/v1/admin/qr/:id/scan", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    return getAppContext().phase0.updateQrScan(principal.tenantId, idParam(req));
  });

  app.get("/api/v1/admin/staff", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    return { items: await getAppContext().phase0.listStaff(principal.tenantId) };
  });
  app.post("/api/v1/admin/staff", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const value = body(req); if (!value.email || !value.displayName || !value.password) return sendError(reply, req, 400, "VALIDATION", "email, displayName and password required");
    return getAppContext().phase0.createStaff(principal.tenantId, { ...value, password: undefined, passwordHash: hashPassword(String(value.password)) });
  });
  app.patch("/api/v1/admin/staff/:id", async (req, reply) => {
    const principal = configAdmin(req, reply); if (!principal) return reply;
    const value = body(req); if (value.password) { value.passwordHash = hashPassword(String(value.password)); delete value.password; }
    return getAppContext().phase0.updateStaff(principal.tenantId, idParam(req), value);
  });

  /** Guest-facing catalog for quick requests (session required). */
  app.get("/api/v1/guest/request-categories", async (req, reply) => {
    const cookieName = process.env.GUEST_COOKIE_NAME ?? "lotiva_guest";
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const items = await getAppContext().phase0.listCategories({
      tenantId: guest.cookie.tenantId,
      propertyId: guest.cookie.propertyId,
    });
    return { items: items.filter((c) => c.active !== false) };
  });
  app.get("/api/v1/guest/portal-content", async (req, reply) => {
    const cookieName = process.env.GUEST_COOKIE_NAME ?? "lotiva_guest";
    const guest = await requireActiveGuest(req, cookieName);
    if (!guest.ok) return sendError(reply, req, guest.status, guest.code, guest.message);
    const items = await getAppContext().phase0.listPortalContent({
      tenantId: guest.cookie.tenantId,
      propertyId: guest.cookie.propertyId,
    });
    return { items: items.filter((c) => c.enabled !== false && c.status !== "draft") };
  });

  async function staffQueue(req: FastifyRequest, reply: FastifyReply, mode: "mine" | "department" | "lookup") {
    const principal = staff(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return { items: [] };
    const member = (await getAppContext().phase0.listStaff(principal.tenantId)).find((x) => x.id === principal.userId);
    const query = req.query as Record<string, string | undefined>;
    if (mode === "department") {
      const departments = await getAppContext().phase0.listDepartments(scope);
      const department = departments.find((item) => item.id === member?.departmentId);
      const aliases = new Set(
        [department?.id, department?.name, department?.slug]
          .filter(Boolean)
          .map((v) => String(v).toLowerCase()),
      );
      const items = await getAppContext().phase0.listTickets(scope);
      // Dept queue: unassigned tickets for this department (or all unassigned if staff has no dept).
      return {
        items: items.filter((item) => {
          if (["resolved", "completed", "guest_confirmed", "cancelled"].includes(String(item.status))) {
            return false;
          }
          const dept = String(item.department ?? "").toLowerCase();
          if (!member?.departmentId) return !item.assigneeId;
          return aliases.has(dept) || (!dept && !item.assigneeId);
        }),
      };
    }
    const filters = mode === "mine" ? { assignee: principal.userId } : { search: query.search };
    return { items: await getAppContext().phase0.listTickets(scope, filters) };
  }
  app.get("/api/v1/staff/my-work", (req, reply) => staffQueue(req, reply, "mine"));
  app.get("/api/v1/staff/department-queue", (req, reply) => staffQueue(req, reply, "department"));
  app.get("/api/v1/staff/lookup", (req, reply) => staffQueue(req, reply, "lookup"));
  app.get("/api/v1/staff/notifications", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); return { items: scope ? (await getAppContext().phase0.listTickets(scope)).filter((x) => x.unreadStaff) : [] };
  });
  app.get("/api/v1/staff/shift-activity", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return { items: [] };
    const member = (await getAppContext().phase0.listStaff(principal.tenantId)).find((x) => x.id === principal.userId);
    return { items: await getAppContext().phase0.shiftActivity(scope, member?.departmentId ? String(member.departmentId) : undefined) };
  });
  app.get("/api/v1/staff/handover", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return { items: [] };
    const member = (await getAppContext().phase0.listStaff(principal.tenantId)).find((x) => x.id === principal.userId);
    return { items: await getAppContext().phase0.listHandovers(scope, member?.departmentId ? String(member.departmentId) : undefined) };
  });
  app.post("/api/v1/staff/handover", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    const scope = await scopeFor(principal); if (!scope) return sendError(reply, req, 404, "PROPERTY_NOT_FOUND", "Property not found");
    const value = body(req); if (!value.body) return sendError(reply, req, 400, "VALIDATION", "body required");
    const member = (await getAppContext().phase0.listStaff(principal.tenantId)).find((x) => x.id === principal.userId);
    return getAppContext().phase0.createHandover(scope, { ...value, authorId: principal.userId, departmentId: value.departmentId ?? member?.departmentId ?? null });
  });
  app.patch("/api/v1/staff/handover/:id", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    return getAppContext().phase0.updateHandover(principal.tenantId, idParam(req), body(req));
  });
  app.delete("/api/v1/staff/handover/:id", async (req, reply) => {
    const principal = staff(req, reply); if (!principal) return reply;
    return { deleted: await getAppContext().phase0.deleteHandover(principal.tenantId, idParam(req)) };
  });
}
