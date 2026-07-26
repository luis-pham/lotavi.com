import { and, desc, eq, inArray, sql as dsql } from "drizzle-orm";
import {
  assertTicketTransition,
  newId,
  normalizeTicketStatus,
  type TicketStatus,
} from "@lotiva/domain";
import type { MemoryDb } from "../memory/store.js";
import { withBypassRls, withTenant } from "../db/client.js";
import * as t from "../db/schema.js";

export type Phase0Scope = { tenantId: string; propertyId: string };
export type TicketFilters = {
  status?: string;
  department?: string;
  priority?: string;
  assignee?: string;
  search?: string;
};
export type OpsRow = Record<string, unknown> & { id: string };

export interface Phase0Ops {
  overview(scope: Phase0Scope): Promise<Record<string, unknown>>;
  listTickets(scope: Phase0Scope, filters?: TicketFilters): Promise<OpsRow[]>;
  getTicket(tenantId: string, id: string): Promise<OpsRow | null>;
  updateTicket(tenantId: string, id: string, patch: Record<string, unknown>, actorId?: string): Promise<OpsRow | null>;
  bulkUpdateTickets(tenantId: string, ids: string[], patch: Record<string, unknown>, actorId?: string): Promise<OpsRow[]>;
  listTicketNotes(tenantId: string, ticketId: string): Promise<OpsRow[]>;
  addTicketNote(tenantId: string, ticketId: string, input: { authorId?: string | null; visibility?: string; body: string }): Promise<OpsRow>;
  listDepartments(scope: Phase0Scope): Promise<OpsRow[]>;
  createDepartment(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateDepartment(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteDepartment(tenantId: string, id: string): Promise<boolean>;
  listCategories(scope: Phase0Scope): Promise<OpsRow[]>;
  createCategory(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateCategory(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteCategory(tenantId: string, id: string): Promise<boolean>;
  listJourneys(scope: Phase0Scope): Promise<OpsRow[]>;
  createJourney(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateJourney(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteJourney(tenantId: string, id: string): Promise<boolean>;
  listGuests(scope: Phase0Scope): Promise<OpsRow[]>;
  createGuest(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateGuest(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteGuest(tenantId: string, id: string): Promise<boolean>;
  assignCabin(tenantId: string, guestId: string, input: { propertyId: string; roomId: string; journeyId?: string | null; guestSessionId?: string | null }): Promise<OpsRow>;
  listRooms(scope: Phase0Scope): Promise<OpsRow[]>;
  updateRoom(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  listAnnouncements(scope: Phase0Scope): Promise<OpsRow[]>;
  createAnnouncement(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateAnnouncement(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteAnnouncement(tenantId: string, id: string): Promise<boolean>;
  listPortalContent(scope: Phase0Scope): Promise<OpsRow[]>;
  upsertPortalContent(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  getPropertySettings(scope: Phase0Scope): Promise<Record<string, unknown> | null>;
  putPropertySettings(scope: Phase0Scope, input: Record<string, unknown>): Promise<Record<string, unknown>>;
  listQr(scope: Phase0Scope): Promise<OpsRow[]>;
  updateQrScan(tenantId: string, id: string): Promise<OpsRow | null>;
  listStaff(tenantId: string): Promise<OpsRow[]>;
  createStaff(tenantId: string, input: Record<string, unknown>): Promise<OpsRow>;
  updateStaff(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  listHandovers(scope: Phase0Scope, departmentId?: string): Promise<OpsRow[]>;
  createHandover(scope: Phase0Scope, input: Record<string, unknown>): Promise<OpsRow>;
  updateHandover(tenantId: string, id: string, input: Record<string, unknown>): Promise<OpsRow | null>;
  deleteHandover(tenantId: string, id: string): Promise<boolean>;
  shiftActivity(scope: Phase0Scope, departmentId?: string): Promise<OpsRow[]>;
  seedPhase0Extras(tenantId: string, propertyId: string, roomIds: string[], adminUserId: string, staffUserId: string): Promise<void>;
}

type MemoryState = {
  departments: OpsRow[];
  categories: OpsRow[];
  journeys: OpsRow[];
  guests: OpsRow[];
  stays: OpsRow[];
  notes: OpsRow[];
  handovers: OpsRow[];
  portal: OpsRow[];
  settings: Array<Record<string, unknown>>;
};

type MemoryWithPhase0 = MemoryDb & { phase0?: MemoryState };

function asDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value instanceof Date) return value;
  return new Date(String(value));
}

function clean<T extends Record<string, unknown>>(input: T, allowed: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([key, value]) => allowed.includes(key) && value !== undefined));
}

function memoryState(db: MemoryWithPhase0): MemoryState {
  return (db.phase0 ??= {
    departments: [],
    categories: [],
    journeys: [],
    guests: [],
    stays: [],
    notes: [],
    handovers: [],
    portal: [],
    settings: [],
  });
}

function memoryDb(mode: "memory" | { store: "memory"; db: MemoryDb }): MemoryWithPhase0 {
  if (typeof mode !== "string") return mode.db;
  return {
    tenants: [], properties: [], rooms: [], users: [], qr: [], guestSessions: [],
    themeVersions: [], themePublications: [], conversations: [], messages: [],
    knowledgeDocs: [], knowledgeChunks: [], schedules: [], announcements: [],
    pendingActions: [], tickets: [], ticketTransitions: [], auditLogs: [],
    promptProfiles: [], promptVersions: [],
    seedMeta: { guestQrToken: "", tenantId: "", propertyId: "", roomId: "" },
  };
}

function matchesTicket(row: Record<string, unknown>, filters: TicketFilters): boolean {
  if (filters.status && row.status !== filters.status) return false;
  if (filters.department && row.department !== filters.department) return false;
  if (filters.priority && row.priority !== filters.priority) return false;
  if (filters.assignee && row.assigneeId !== filters.assignee) return false;
  if (filters.search) {
    const haystack = `${row.title ?? ""} ${row.description ?? ""} ${row.category ?? ""}`.toLowerCase();
    if (!haystack.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

const ticketFields = [
  "status", "title", "priority", "assigneeId", "escalated", "source", "categoryId",
  "journeyId", "dueAt", "unreadStaff", "department", "description",
];

function createMemoryOps(mode: "memory" | { store: "memory"; db: MemoryDb }): Phase0Ops {
  const db = memoryDb(mode);
  const state = memoryState(db);
  const tenantRows = (rows: Array<Record<string, unknown>>, tenantId: string) =>
    rows.filter((row) => row.tenantId === tenantId);
  const createCrud = (rows: OpsRow[], scope: Phase0Scope, input: Record<string, unknown>) => {
    const row = { id: newId(), ...scope, createdAt: new Date(), ...input } as OpsRow;
    rows.push(row);
    return row;
  };
  const updateCrud = (rows: OpsRow[], tenantId: string, id: string, input: Record<string, unknown>) => {
    const row = rows.find((item) => item.id === id && item.tenantId === tenantId);
    if (!row) return null;
    Object.assign(row, input, { updatedAt: new Date() });
    return row;
  };
  const deleteCrud = (rows: OpsRow[], tenantId: string, id: string) => {
    const index = rows.findIndex((item) => item.id === id && item.tenantId === tenantId);
    if (index < 0) return false;
    rows.splice(index, 1);
    return true;
  };
  const ticketRow = (row: MemoryDb["tickets"][number]) => row as unknown as OpsRow;

  return {
    async overview(scope) {
      const items = db.tickets.filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId);
      const open = items.filter((x) => !["resolved", "completed", "guest_confirmed", "cancelled"].includes(x.status));
      return {
        totalRequests: items.length,
        openRequests: open.length,
        urgentRequests: open.filter((x) => x.priority === "urgent" || x.escalated).length,
        unassignedRequests: open.filter((x) => !x.assigneeId).length,
        unreadStaff: open.filter((x) => x.unreadStaff).length,
        activeGuests: tenantRows(state.stays, scope.tenantId).filter((x) => x.status === "active").length,
      };
    },
    async listTickets(scope, filters = {}) {
      return db.tickets
        .filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId)
        .map(ticketRow).filter((x) => matchesTicket(x, filters));
    },
    async getTicket(tenantId, id) {
      const row = db.tickets.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null;
      return { ...ticketRow(row), notes: tenantRows(state.notes, tenantId).filter((x) => x.ticketId === id) };
    },
    async updateTicket(tenantId, id, patch, actorId) {
      const row = db.tickets.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null;
      const before = row.status;
      const values = clean(patch, ticketFields);
      if (patch.status && patch.status !== before) {
        const target = normalizeTicketStatus(String(patch.status));
        assertTicketTransition(before, target);
        values.status = target;
      }
      Object.assign(row, values);
      if (patch.dueAt !== undefined) row.dueAt = asDate(patch.dueAt) ?? null;
      if (values.status && values.status !== before) {
        row.version += 1;
        db.ticketTransitions.push({
          id: newId(), tenantId, ticketId: id, fromStatus: before,
          toStatus: values.status as TicketStatus, actorId: actorId ?? null,
          actorType: "staff", createdAt: new Date(),
        });
      }
      return ticketRow(row);
    },
    async bulkUpdateTickets(tenantId, ids, patch, actorId) {
      return (await Promise.all(ids.map((id) => this.updateTicket(tenantId, id, patch, actorId)))).filter(Boolean) as OpsRow[];
    },
    async listTicketNotes(tenantId, ticketId) {
      return tenantRows(state.notes, tenantId).filter((x) => x.ticketId === ticketId) as OpsRow[];
    },
    async addTicketNote(tenantId, ticketId, input) {
      const row = { id: newId(), tenantId, ticketId, authorId: input.authorId ?? null, visibility: input.visibility ?? "internal", body: input.body, createdAt: new Date() } as OpsRow;
      state.notes.push(row);
      const ticket = db.tickets.find((x) => x.id === ticketId && x.tenantId === tenantId);
      if (ticket) ticket.unreadStaff = false;
      return row;
    },
    async listDepartments(scope) { return tenantRows(state.departments, scope.tenantId).filter((x) => x.propertyId === scope.propertyId) as OpsRow[]; },
    async createDepartment(scope, input) { return createCrud(state.departments, scope, input); },
    async updateDepartment(tenantId, id, input) { return updateCrud(state.departments, tenantId, id, input); },
    async deleteDepartment(tenantId, id) { return deleteCrud(state.departments, tenantId, id); },
    async listCategories(scope) { return tenantRows(state.categories, scope.tenantId).filter((x) => x.propertyId === scope.propertyId) as OpsRow[]; },
    async createCategory(scope, input) { return createCrud(state.categories, scope, input); },
    async updateCategory(tenantId, id, input) { return updateCrud(state.categories, tenantId, id, input); },
    async deleteCategory(tenantId, id) { return deleteCrud(state.categories, tenantId, id); },
    async listJourneys(scope) { return tenantRows(state.journeys, scope.tenantId).filter((x) => x.propertyId === scope.propertyId) as OpsRow[]; },
    async createJourney(scope, input) { return createCrud(state.journeys, scope, { status: "upcoming", ...input, startsAt: asDate(input.startsAt) ?? new Date(), endsAt: asDate(input.endsAt) ?? null }); },
    async updateJourney(tenantId, id, input) { return updateCrud(state.journeys, tenantId, id, { ...input, ...(input.startsAt !== undefined ? { startsAt: asDate(input.startsAt) } : {}), ...(input.endsAt !== undefined ? { endsAt: asDate(input.endsAt) } : {}) }); },
    async deleteJourney(tenantId, id) { return deleteCrud(state.journeys, tenantId, id); },
    async listGuests(scope) {
      return tenantRows(state.guests, scope.tenantId).filter((x) => x.propertyId === scope.propertyId).map((guest) => ({ ...guest, stays: state.stays.filter((stay) => stay.guestId === guest.id) })) as unknown as OpsRow[];
    },
    async createGuest(scope, input) { return createCrud(state.guests, scope, { locale: "en", active: true, ...input }); },
    async updateGuest(tenantId, id, input) { return updateCrud(state.guests, tenantId, id, input); },
    async deleteGuest(tenantId, id) { return deleteCrud(state.guests, tenantId, id); },
    async assignCabin(tenantId, guestId, input) {
      const row = { id: newId(), tenantId, guestId, propertyId: input.propertyId, roomId: input.roomId, journeyId: input.journeyId ?? null, guestSessionId: input.guestSessionId ?? null, status: "active", createdAt: new Date() } as OpsRow;
      state.stays.push(row); return row;
    },
    async listRooms(scope) { return db.rooms.filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId).map((x) => x as unknown as OpsRow); },
    async updateRoom(tenantId, id, input) {
      const row = db.rooms.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null; Object.assign(row, clean(input, ["label", "deck", "zone", "active"])); return row as unknown as OpsRow;
    },
    async listAnnouncements(scope) { return db.announcements.filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId).map((x) => x as unknown as OpsRow); },
    async createAnnouncement(scope, input) {
      const row = { id: newId(), ...scope, title: String(input.title ?? ""), body: String(input.body ?? ""), publishedAt: new Date(), active: input.active !== false, status: String(input.status ?? "published"), priority: String(input.priority ?? "normal"), expiresAt: asDate(input.expiresAt) ?? null, target: String(input.target ?? "current_journey"), journeyId: input.journeyId as string | null ?? null };
      db.announcements.push(row); return row as unknown as OpsRow;
    },
    async updateAnnouncement(tenantId, id, input) {
      const row = db.announcements.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null; Object.assign(row, input, input.expiresAt !== undefined ? { expiresAt: asDate(input.expiresAt) } : {}); return row as unknown as OpsRow;
    },
    async deleteAnnouncement(tenantId, id) {
      const index = db.announcements.findIndex((x) => x.tenantId === tenantId && x.id === id);
      if (index < 0) return false; db.announcements.splice(index, 1); return true;
    },
    async listPortalContent(scope) { return tenantRows(state.portal, scope.tenantId).filter((x) => x.propertyId === scope.propertyId) as OpsRow[]; },
    async upsertPortalContent(scope, input) {
      const existing = state.portal.find((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId && (input.id ? x.id === input.id : x.sectionKey === input.sectionKey));
      if (existing) { Object.assign(existing, input, { updatedAt: new Date() }); return existing; }
      return createCrud(state.portal, scope, { sortOrder: 0, enabled: true, status: "published", ...input, updatedAt: new Date() });
    },
    async getPropertySettings(scope) { return state.settings.find((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId) ?? null; },
    async putPropertySettings(scope, input) {
      let row = state.settings.find((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId);
      if (!row) { row = { ...scope }; state.settings.push(row); }
      Object.assign(row, input, { updatedAt: new Date() }); return row;
    },
    async listQr(scope) { return db.qr.filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId).map((x) => x as unknown as OpsRow); },
    async updateQrScan(tenantId, id) {
      const row = db.qr.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null; row.scanCount = (row.scanCount ?? 0) + 1; row.lastScanAt = new Date(); return row as unknown as OpsRow;
    },
    async listStaff(tenantId) { return db.users.filter((x) => x.tenantId === tenantId).map(({ passwordHash: _, ...x }) => x as unknown as OpsRow); },
    async createStaff(tenantId, input) {
      const row = { id: newId(), tenantId, email: String(input.email), passwordHash: String(input.passwordHash), displayName: String(input.displayName), role: String(input.role ?? "staff"), departmentId: input.departmentId as string | null ?? null, active: input.active !== false };
      db.users.push(row); const { passwordHash: _, ...safe } = row; return safe as unknown as OpsRow;
    },
    async updateStaff(tenantId, id, input) {
      const row = db.users.find((x) => x.tenantId === tenantId && x.id === id);
      if (!row) return null; Object.assign(row, clean(input, ["email", "passwordHash", "displayName", "role", "departmentId", "active"])); const { passwordHash: _, ...safe } = row; return safe as unknown as OpsRow;
    },
    async listHandovers(scope, departmentId) { return tenantRows(state.handovers, scope.tenantId).filter((x) => x.propertyId === scope.propertyId && (!departmentId || x.departmentId === departmentId)) as OpsRow[]; },
    async createHandover(scope, input) { return createCrud(state.handovers, scope, { status: "open", ...input }); },
    async updateHandover(tenantId, id, input) { return updateCrud(state.handovers, tenantId, id, input); },
    async deleteHandover(tenantId, id) { return deleteCrud(state.handovers, tenantId, id); },
    async shiftActivity(scope, departmentId) {
      const ticketIds = new Set(db.tickets.filter((x) => x.tenantId === scope.tenantId && x.propertyId === scope.propertyId && (!departmentId || x.department === departmentId)).map((x) => x.id));
      const activity: OpsRow[] = [
        ...db.ticketTransitions.filter((x) => x.tenantId === scope.tenantId && ticketIds.has(x.ticketId)).map((x) => ({ ...x, id: x.id, type: "transition" })),
        ...state.notes.filter((x) => x.tenantId === scope.tenantId && ticketIds.has(String(x.ticketId))).map((x) => ({ ...x, type: "note" })),
      ] as OpsRow[];
      return activity.sort((a, b) => Number(new Date(String(b.createdAt))) - Number(new Date(String(a.createdAt))));
    },
    async seedPhase0Extras(tenantId, propertyId, roomIds, adminUserId, staffUserId) {
      if (state.departments.some((x) => x.tenantId === tenantId && x.propertyId === propertyId)) return;
      const frontDesk = createCrud(state.departments, { tenantId, propertyId }, { name: "Front Desk", slug: "front-desk", defaultSlaMinutes: 30, active: true, managerUserId: adminUserId });
      const housekeeping = createCrud(state.departments, { tenantId, propertyId }, { name: "Housekeeping", slug: "housekeeping", defaultSlaMinutes: 45, active: true });
      createCrud(state.categories, { tenantId, propertyId }, { guestName: "Housekeeping", internalName: "Housekeeping request", description: "Towels, cleaning and amenities", icon: "sparkles", defaultDepartmentId: housekeeping.id, defaultPriority: "normal", defaultSlaMinutes: 45, sortOrder: 1, active: true });
      createCrud(state.categories, { tenantId, propertyId }, { guestName: "Front desk", internalName: "Front desk assistance", icon: "concierge", defaultDepartmentId: frontDesk.id, defaultPriority: "normal", defaultSlaMinutes: 30, sortOrder: 2, active: true });
      const journey = createCrud(state.journeys, { tenantId, propertyId }, { name: "Current stay", status: "active", startsAt: new Date(), endsAt: new Date(Date.now() + 7 * 864e5) });
      const guest = createCrud(state.guests, { tenantId, propertyId }, { displayName: "Demo Guest", locale: "en", active: true });
      if (roomIds[0]) state.stays.push({ id: newId(), tenantId, propertyId, guestId: guest.id, journeyId: journey.id, roomId: roomIds[0], status: "active", guestSessionId: null, createdAt: new Date() });
      createCrud(state.portal, { tenantId, propertyId }, { sectionKey: "welcome", title: "Welcome aboard", body: "How can we make your stay exceptional?", sortOrder: 0, enabled: true, status: "published", updatedAt: new Date() });
      state.settings.push({ tenantId, propertyId, timezone: "Asia/Ho_Chi_Minh", defaultLanguage: "en", brandColor: "#0F3D2E", logoUrl: null, contactInfo: null, defaultSlaMinutes: 60, notificationDefaults: {}, updatedAt: new Date() });
      const staff = db.users.find((x) => x.id === staffUserId || x.email === "staff@lotiva.vn");
      const hkDept = state.departments.find((d) => d.slug === "housekeeping" && d.tenantId === tenantId);
      if (staff && hkDept) {
        (staff as { departmentId?: string }).departmentId = String(hkDept.id);
      }
    },
  };
}

const departmentFields = ["name", "slug", "defaultSlaMinutes", "active", "managerUserId"];
const categoryFields = ["guestName", "internalName", "description", "icon", "defaultDepartmentId", "defaultPriority", "defaultSlaMinutes", "sortOrder", "active"];
const journeyFields = ["name", "status", "startsAt", "endsAt"];
const guestFields = ["displayName", "email", "locale", "active"];
const announcementFields = ["title", "body", "publishedAt", "active", "status", "priority", "expiresAt", "target", "journeyId"];
const portalFields = ["sectionKey", "title", "body", "sortOrder", "enabled", "status"];
const settingsFields = ["timezone", "defaultLanguage", "brandColor", "logoUrl", "contactInfo", "defaultSlaMinutes", "notificationDefaults"];
const staffFields = ["email", "passwordHash", "displayName", "role", "departmentId", "active", "lastActiveAt"];
const handoverFields = ["departmentId", "authorId", "body", "status", "acknowledgedAt", "resolvedAt"];

function createPostgresOps(): Phase0Ops {
  const crud = {
    async update(table: typeof t.departments, tenantColumn: typeof t.departments.tenantId, tenantId: string, idColumn: typeof t.departments.id, id: string, patch: Record<string, unknown>) {
      return withTenant(tenantId, async (db) => (await db.update(table).set(patch).where(and(eq(idColumn, id), eq(tenantColumn, tenantId))).returning())[0] as unknown as OpsRow | undefined);
    },
  };
  const api: Phase0Ops = {
    async overview(scope) {
      const items = await api.listTickets(scope);
      const open = items.filter((x) => !["resolved", "completed", "guest_confirmed", "cancelled"].includes(String(x.status)));
      const guests = await api.listGuests(scope);
      return { totalRequests: items.length, openRequests: open.length, urgentRequests: open.filter((x) => x.priority === "urgent" || x.escalated).length, unassignedRequests: open.filter((x) => !x.assigneeId).length, unreadStaff: open.filter((x) => x.unreadStaff).length, activeGuests: guests.filter((x) => (x.stays as OpsRow[]).some((s) => s.status === "active")).length };
    },
    async listTickets(scope, filters = {}) {
      const rows = await withTenant(scope.tenantId, (db) => db.select().from(t.tickets).where(and(eq(t.tickets.tenantId, scope.tenantId), eq(t.tickets.propertyId, scope.propertyId))).orderBy(desc(t.tickets.createdAt)));
      return rows.filter((row) => matchesTicket(row, filters)) as unknown as OpsRow[];
    },
    async getTicket(tenantId, id) {
      return withTenant(tenantId, async (db) => {
        const row = (await db.select().from(t.tickets).where(and(eq(t.tickets.id, id), eq(t.tickets.tenantId, tenantId))).limit(1))[0];
        if (!row) return null;
        const notes = await db.select().from(t.ticketNotes).where(and(eq(t.ticketNotes.ticketId, id), eq(t.ticketNotes.tenantId, tenantId))).orderBy(desc(t.ticketNotes.createdAt));
        return { ...row, notes } as unknown as OpsRow;
      });
    },
    async updateTicket(tenantId, id, patch, actorId) {
      return withTenant(tenantId, async (db) => {
        const current = (await db.select().from(t.tickets).where(and(eq(t.tickets.id, id), eq(t.tickets.tenantId, tenantId))).limit(1))[0];
        if (!current) return null;
        const values = clean(patch, ticketFields);
        if (patch.status && patch.status !== current.status) {
          const target = normalizeTicketStatus(String(patch.status));
          assertTicketTransition(current.status as TicketStatus, target);
          values.status = target;
        }
        if (patch.dueAt !== undefined) values.dueAt = asDate(patch.dueAt);
        if (values.status && values.status !== current.status) values.version = current.version + 1;
        const row = (await db.update(t.tickets).set(values).where(and(eq(t.tickets.id, id), eq(t.tickets.tenantId, tenantId))).returning())[0];
        if (values.status && values.status !== current.status) await db.insert(t.ticketTransitions).values({ id: newId(), tenantId, ticketId: id, fromStatus: current.status, toStatus: String(values.status), actorId: actorId ?? null, actorType: "staff" });
        return row as unknown as OpsRow;
      });
    },
    async bulkUpdateTickets(tenantId, ids, patch, actorId) {
      return (await Promise.all(ids.map((id) => api.updateTicket(tenantId, id, patch, actorId)))).filter(Boolean) as OpsRow[];
    },
    async listTicketNotes(tenantId, ticketId) { return withTenant(tenantId, async (db) => await db.select().from(t.ticketNotes).where(and(eq(t.ticketNotes.tenantId, tenantId), eq(t.ticketNotes.ticketId, ticketId))).orderBy(desc(t.ticketNotes.createdAt)) as unknown as OpsRow[]); },
    async addTicketNote(tenantId, ticketId, input) {
      return withTenant(tenantId, async (db) => {
        const row = (await db.insert(t.ticketNotes).values({ id: newId(), tenantId, ticketId, authorId: input.authorId ?? null, visibility: input.visibility ?? "internal", body: input.body }).returning())[0]!;
        await db.update(t.tickets).set({ unreadStaff: false }).where(and(eq(t.tickets.id, ticketId), eq(t.tickets.tenantId, tenantId)));
        return row as unknown as OpsRow;
      });
    },
    async listDepartments(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.departments).where(and(eq(t.departments.tenantId, scope.tenantId), eq(t.departments.propertyId, scope.propertyId))) as unknown as OpsRow[]); },
    async createDepartment(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.departments).values({ id: newId(), ...scope, ...clean(input, departmentFields) } as typeof t.departments.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateDepartment(tenantId, id, input) { return (await crud.update(t.departments, t.departments.tenantId, tenantId, t.departments.id, id, clean(input, departmentFields))) ?? null; },
    async deleteDepartment(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.departments).where(and(eq(t.departments.id, id), eq(t.departments.tenantId, tenantId))).returning({ id: t.departments.id })).length > 0); },
    async listCategories(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.requestCategories).where(and(eq(t.requestCategories.tenantId, scope.tenantId), eq(t.requestCategories.propertyId, scope.propertyId))) as unknown as OpsRow[]); },
    async createCategory(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.requestCategories).values({ id: newId(), ...scope, ...clean(input, categoryFields) } as typeof t.requestCategories.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateCategory(tenantId, id, input) { return withTenant(tenantId, async (db) => (await db.update(t.requestCategories).set(clean(input, categoryFields)).where(and(eq(t.requestCategories.id, id), eq(t.requestCategories.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async deleteCategory(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.requestCategories).where(and(eq(t.requestCategories.id, id), eq(t.requestCategories.tenantId, tenantId))).returning({ id: t.requestCategories.id })).length > 0); },
    async listJourneys(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.journeys).where(and(eq(t.journeys.tenantId, scope.tenantId), eq(t.journeys.propertyId, scope.propertyId))).orderBy(desc(t.journeys.startsAt)) as unknown as OpsRow[]); },
    async createJourney(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.journeys).values({ id: newId(), ...scope, ...clean(input, journeyFields), startsAt: asDate(input.startsAt) ?? new Date(), endsAt: asDate(input.endsAt) } as typeof t.journeys.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateJourney(tenantId, id, input) { const values = clean(input, journeyFields); if (input.startsAt !== undefined) values.startsAt = asDate(input.startsAt); if (input.endsAt !== undefined) values.endsAt = asDate(input.endsAt); return withTenant(tenantId, async (db) => (await db.update(t.journeys).set(values).where(and(eq(t.journeys.id, id), eq(t.journeys.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async deleteJourney(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.journeys).where(and(eq(t.journeys.id, id), eq(t.journeys.tenantId, tenantId))).returning({ id: t.journeys.id })).length > 0); },
    async listGuests(scope) {
      return withTenant(scope.tenantId, async (db) => {
        const guests = await db.select().from(t.guests).where(and(eq(t.guests.tenantId, scope.tenantId), eq(t.guests.propertyId, scope.propertyId)));
        const stays = await db.select().from(t.guestStays).where(and(eq(t.guestStays.tenantId, scope.tenantId), eq(t.guestStays.propertyId, scope.propertyId)));
        return guests.map((guest) => ({ ...guest, stays: stays.filter((stay) => stay.guestId === guest.id) })) as unknown as OpsRow[];
      });
    },
    async createGuest(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.guests).values({ id: newId(), ...scope, ...clean(input, guestFields) } as typeof t.guests.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateGuest(tenantId, id, input) { return withTenant(tenantId, async (db) => (await db.update(t.guests).set(clean(input, guestFields)).where(and(eq(t.guests.id, id), eq(t.guests.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async deleteGuest(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.guests).where(and(eq(t.guests.id, id), eq(t.guests.tenantId, tenantId))).returning({ id: t.guests.id })).length > 0); },
    async assignCabin(tenantId, guestId, input) { return withTenant(tenantId, async (db) => (await db.insert(t.guestStays).values({ id: newId(), tenantId, guestId, propertyId: input.propertyId, roomId: input.roomId, journeyId: input.journeyId ?? null, guestSessionId: input.guestSessionId ?? null, status: "active" }).returning())[0] as unknown as OpsRow); },
    async listRooms(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.rooms).where(and(eq(t.rooms.tenantId, scope.tenantId), eq(t.rooms.propertyId, scope.propertyId))) as unknown as OpsRow[]); },
    async updateRoom(tenantId, id, input) { return withTenant(tenantId, async (db) => (await db.update(t.rooms).set(clean(input, ["label", "deck", "zone", "active"])).where(and(eq(t.rooms.id, id), eq(t.rooms.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async listAnnouncements(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.announcements).where(and(eq(t.announcements.tenantId, scope.tenantId), eq(t.announcements.propertyId, scope.propertyId))).orderBy(desc(t.announcements.publishedAt)) as unknown as OpsRow[]); },
    async createAnnouncement(scope, input) { const values = clean(input, announcementFields); values.expiresAt = asDate(input.expiresAt); values.publishedAt = asDate(input.publishedAt) ?? new Date(); return withTenant(scope.tenantId, async (db) => (await db.insert(t.announcements).values({ id: newId(), ...scope, ...values } as typeof t.announcements.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateAnnouncement(tenantId, id, input) { const values = clean(input, announcementFields); if (input.expiresAt !== undefined) values.expiresAt = asDate(input.expiresAt); return withTenant(tenantId, async (db) => (await db.update(t.announcements).set(values).where(and(eq(t.announcements.id, id), eq(t.announcements.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async deleteAnnouncement(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.announcements).where(and(eq(t.announcements.id, id), eq(t.announcements.tenantId, tenantId))).returning({ id: t.announcements.id })).length > 0); },
    async listPortalContent(scope) { return withTenant(scope.tenantId, async (db) => await db.select().from(t.portalContent).where(and(eq(t.portalContent.tenantId, scope.tenantId), eq(t.portalContent.propertyId, scope.propertyId))) as unknown as OpsRow[]); },
    async upsertPortalContent(scope, input) {
      return withTenant(scope.tenantId, async (db) => {
        const existing = input.id ? (await db.select().from(t.portalContent).where(and(eq(t.portalContent.id, String(input.id)), eq(t.portalContent.tenantId, scope.tenantId))).limit(1))[0] : (await db.select().from(t.portalContent).where(and(eq(t.portalContent.sectionKey, String(input.sectionKey)), eq(t.portalContent.propertyId, scope.propertyId), eq(t.portalContent.tenantId, scope.tenantId))).limit(1))[0];
        if (existing) return (await db.update(t.portalContent).set({ ...clean(input, portalFields), updatedAt: new Date() }).where(eq(t.portalContent.id, existing.id)).returning())[0] as unknown as OpsRow;
        return (await db.insert(t.portalContent).values({ id: newId(), ...scope, ...clean(input, portalFields) } as typeof t.portalContent.$inferInsert).returning())[0] as unknown as OpsRow;
      });
    },
    async getPropertySettings(scope) { return withTenant(scope.tenantId, async (db) => (await db.select().from(t.propertySettings).where(and(eq(t.propertySettings.propertyId, scope.propertyId), eq(t.propertySettings.tenantId, scope.tenantId))).limit(1))[0] as unknown as Record<string, unknown> ?? null); },
    async putPropertySettings(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.propertySettings).values({ ...scope, ...clean(input, settingsFields) } as typeof t.propertySettings.$inferInsert).onConflictDoUpdate({ target: t.propertySettings.propertyId, set: { ...clean(input, settingsFields), updatedAt: new Date() } }).returning())[0] as unknown as Record<string, unknown>); },
    async listQr(scope) { return withTenant(scope.tenantId, async (db) => await db.select({ id: t.qrContexts.id, tenantId: t.qrContexts.tenantId, propertyId: t.qrContexts.propertyId, roomId: t.qrContexts.roomId, label: t.qrContexts.label, qrLevel: t.qrContexts.qrLevel, journeyId: t.qrContexts.journeyId, scanCount: t.qrContexts.scanCount, lastScanAt: t.qrContexts.lastScanAt, activeFrom: t.qrContexts.activeFrom, activeUntil: t.qrContexts.activeUntil, revokedAt: t.qrContexts.revokedAt }).from(t.qrContexts).where(and(eq(t.qrContexts.tenantId, scope.tenantId), eq(t.qrContexts.propertyId, scope.propertyId))) as unknown as OpsRow[]); },
    async updateQrScan(tenantId, id) { return withTenant(tenantId, async (db) => (await db.update(t.qrContexts).set({ scanCount: dsql`${t.qrContexts.scanCount} + 1`, lastScanAt: new Date() }).where(and(eq(t.qrContexts.id, id), eq(t.qrContexts.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async listStaff(tenantId) { return withBypassRls(async (db) => await db.select({ id: t.users.id, tenantId: t.users.tenantId, email: t.users.email, displayName: t.users.displayName, role: t.users.role, departmentId: t.users.departmentId, active: t.users.active, lastActiveAt: t.users.lastActiveAt, createdAt: t.users.createdAt }).from(t.users).where(eq(t.users.tenantId, tenantId)) as unknown as OpsRow[]); },
    async createStaff(tenantId, input) { return withBypassRls(async (db) => { const row = (await db.insert(t.users).values({ id: newId(), tenantId, ...clean(input, staffFields) } as typeof t.users.$inferInsert).returning({ id: t.users.id, tenantId: t.users.tenantId, email: t.users.email, displayName: t.users.displayName, role: t.users.role, departmentId: t.users.departmentId, active: t.users.active, createdAt: t.users.createdAt }))[0]!; return row as unknown as OpsRow; }); },
    async updateStaff(tenantId, id, input) { return withBypassRls(async (db) => (await db.update(t.users).set(clean(input, staffFields)).where(and(eq(t.users.id, id), eq(t.users.tenantId, tenantId))).returning({ id: t.users.id, tenantId: t.users.tenantId, email: t.users.email, displayName: t.users.displayName, role: t.users.role, departmentId: t.users.departmentId, active: t.users.active, createdAt: t.users.createdAt }))[0] as unknown as OpsRow ?? null); },
    async listHandovers(scope, departmentId) { return withTenant(scope.tenantId, async (db) => { const conditions = [eq(t.handoverNotes.tenantId, scope.tenantId), eq(t.handoverNotes.propertyId, scope.propertyId)]; if (departmentId) conditions.push(eq(t.handoverNotes.departmentId, departmentId)); return await db.select().from(t.handoverNotes).where(and(...conditions)).orderBy(desc(t.handoverNotes.createdAt)) as unknown as OpsRow[]; }); },
    async createHandover(scope, input) { return withTenant(scope.tenantId, async (db) => (await db.insert(t.handoverNotes).values({ id: newId(), ...scope, ...clean(input, handoverFields) } as typeof t.handoverNotes.$inferInsert).returning())[0] as unknown as OpsRow); },
    async updateHandover(tenantId, id, input) { const values = clean(input, handoverFields); for (const key of ["acknowledgedAt", "resolvedAt"]) if (input[key] !== undefined) values[key] = asDate(input[key]); return withTenant(tenantId, async (db) => (await db.update(t.handoverNotes).set(values).where(and(eq(t.handoverNotes.id, id), eq(t.handoverNotes.tenantId, tenantId))).returning())[0] as unknown as OpsRow ?? null); },
    async deleteHandover(tenantId, id) { return withTenant(tenantId, async (db) => (await db.delete(t.handoverNotes).where(and(eq(t.handoverNotes.id, id), eq(t.handoverNotes.tenantId, tenantId))).returning({ id: t.handoverNotes.id })).length > 0); },
    async shiftActivity(scope, departmentId) {
      return withTenant(scope.tenantId, async (db) => {
        const ticketRows = await db.select({ id: t.tickets.id }).from(t.tickets).where(and(eq(t.tickets.tenantId, scope.tenantId), eq(t.tickets.propertyId, scope.propertyId), ...(departmentId ? [eq(t.tickets.department, departmentId)] : [])));
        const ids = ticketRows.map((x) => x.id); if (!ids.length) return [];
        const transitions = await db.select().from(t.ticketTransitions).where(and(eq(t.ticketTransitions.tenantId, scope.tenantId), inArray(t.ticketTransitions.ticketId, ids)));
        const notes = await db.select().from(t.ticketNotes).where(and(eq(t.ticketNotes.tenantId, scope.tenantId), inArray(t.ticketNotes.ticketId, ids)));
        return [...transitions.map((x) => ({ ...x, type: "transition" })), ...notes.map((x) => ({ ...x, type: "note" }))].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as unknown as OpsRow[];
      });
    },
    async seedPhase0Extras(tenantId, propertyId, roomIds, adminUserId, staffUserId) {
      await withBypassRls(async (db) => {
        if ((await db.select({ id: t.departments.id }).from(t.departments).where(and(eq(t.departments.tenantId, tenantId), eq(t.departments.propertyId, propertyId))).limit(1))[0]) return;
        const frontDeskId = newId(), housekeepingId = newId(), journeyId = newId(), guestId = newId();
        await db.insert(t.departments).values([
          { id: frontDeskId, tenantId, propertyId, name: "Front Desk", slug: "front-desk", defaultSlaMinutes: 30, active: true, managerUserId: adminUserId },
          { id: housekeepingId, tenantId, propertyId, name: "Housekeeping", slug: "housekeeping", defaultSlaMinutes: 45, active: true },
        ]);
        await db.insert(t.requestCategories).values([
          { id: newId(), tenantId, propertyId, guestName: "Housekeeping", internalName: "Housekeeping request", description: "Towels, cleaning and amenities", icon: "sparkles", defaultDepartmentId: housekeepingId, defaultPriority: "normal", defaultSlaMinutes: 45, sortOrder: 1, active: true },
          { id: newId(), tenantId, propertyId, guestName: "Front desk", internalName: "Front desk assistance", icon: "concierge", defaultDepartmentId: frontDeskId, defaultPriority: "normal", defaultSlaMinutes: 30, sortOrder: 2, active: true },
        ]);
        await db.insert(t.journeys).values({ id: journeyId, tenantId, propertyId, name: "Current stay", status: "active", startsAt: new Date(), endsAt: new Date(Date.now() + 7 * 864e5) });
        await db.insert(t.guests).values({ id: guestId, tenantId, propertyId, displayName: "Demo Guest", locale: "en", active: true });
        if (roomIds[0]) await db.insert(t.guestStays).values({ id: newId(), tenantId, propertyId, guestId, journeyId, roomId: roomIds[0], status: "active" });
        await db.insert(t.portalContent).values({ id: newId(), tenantId, propertyId, sectionKey: "welcome", title: "Welcome aboard", body: "How can we make your stay exceptional?", sortOrder: 0, enabled: true, status: "published" });
        await db.insert(t.propertySettings).values({ tenantId, propertyId, timezone: "Asia/Ho_Chi_Minh", defaultLanguage: "en", brandColor: "#0F3D2E", defaultSlaMinutes: 60, notificationDefaults: {} }).onConflictDoNothing();
        await db.update(t.users).set({ departmentId: housekeepingId }).where(and(eq(t.users.id, staffUserId), eq(t.users.tenantId, tenantId)));
      });
    },
  };
  return api;
}

export function createPhase0Ops(mode: "postgres" | "memory" | { store: "postgres" } | { store: "memory"; db: MemoryDb }): Phase0Ops {
  if (mode === "postgres" || (typeof mode !== "string" && mode.store === "postgres")) return createPostgresOps();
  return createMemoryOps(mode);
}
