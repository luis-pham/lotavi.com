import {
  defaultThemeDraft,
  generateOpaqueQrToken,
  hashPassword,
  hashQrToken,
  newId,
  normalizeSearchText,
  scoreKnowledgeMatch,
  type PortalThemeDraft,
  type TicketStatus,
} from "@lotiva/domain";
import type {
  AnnouncementRepository,
  ConversationRepository,
  GuestSessionRepository,
  KnowledgeRepository,
  LotivaRepos,
  PendingActionRepository,
  QrRepository,
  ScheduleRepository,
  ThemeRepository,
  TicketRepository,
} from "@lotiva/application";

type Tenant = { id: string; name: string; slug: string };
type Property = { id: string; tenantId: string; name: string };
type Room = { id: string; tenantId: string; propertyId: string; label: string };

export type MemoryDb = {
  tenants: Tenant[];
  properties: Property[];
  rooms: Room[];
  users: Array<{
    id: string;
    tenantId: string | null;
    email: string;
    passwordHash: string;
    displayName: string;
    role: string;
  }>;
  qr: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    roomId: string;
    tokenHash: string;
    activeFrom: Date;
    activeUntil: Date | null;
    revokedAt: Date | null;
  }>;
  guestSessions: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    qrContextId: string;
    roomId: string;
    locale: string;
    themeVersionId: string | null;
    expiresAt: Date;
  }>;
  themeVersions: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    status: string;
    tokens: PortalThemeDraft;
  }>;
  themePublications: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    versionId: string;
    publishedAt: Date;
  }>;
  conversations: Array<{ id: string; tenantId: string; guestSessionId: string }>;
  messages: Array<{
    id: string;
    tenantId: string;
    conversationId: string;
    role: "guest" | "assistant" | "system";
    content: string;
    createdAt: Date;
  }>;
  knowledgeDocs: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    title: string;
    status: string;
  }>;
  knowledgeChunks: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    documentId: string;
    content: string;
  }>;
  schedules: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    title: string;
    location: string | null;
    startsAt: Date;
    endsAt: Date | null;
    active: boolean;
  }>;
  announcements: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    title: string;
    body: string;
    publishedAt: Date;
    active: boolean;
  }>;
  pendingActions: Array<{
    id: string;
    tenantId: string;
    guestSessionId: string;
    category: string;
    description: string;
    department: string | null;
    status: "pending" | "confirmed" | "cancelled" | "expired";
    expiresAt: Date;
  }>;
  tickets: Array<{
    id: string;
    tenantId: string;
    propertyId: string;
    guestSessionId: string;
    roomId: string;
    category: string;
    description: string;
    department: string | null;
    status: TicketStatus;
    version: number;
    idempotencyKey: string;
    createdAt: Date;
  }>;
  ticketTransitions: Array<{
    id: string;
    tenantId: string;
    ticketId: string;
    fromStatus: TicketStatus;
    toStatus: TicketStatus;
    actorId: string | null;
    actorType: string;
    reason?: string;
    correlationId?: string;
    createdAt: Date;
  }>;
  auditLogs: Array<{
    id: string;
    tenantId: string | null;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }>;
  promptProfiles: Array<{
    id: string;
    tenantId: string | null;
    propertyId: string | null;
    name: string;
    scope: string;
  }>;
  promptVersions: Array<{
    id: string;
    profileId: string;
    version: number;
    body: string;
    status: string;
  }>;
  seedMeta: { guestQrToken: string; tenantId: string; propertyId: string; roomId: string };
};

export function createMemoryDb(): MemoryDb {
  const tenantId = newId();
  const propertyId = newId();
  const roomId = newId();
  const themeVersionId = newId();
  const docId = newId();
  const rawToken = generateOpaqueQrToken();
  const passwordHash = hashPassword("admin123");

  const db: MemoryDb = {
    tenants: [{ id: tenantId, name: "Demo Hotel Group", slug: "demo-hotel" }],
    properties: [{ id: propertyId, tenantId, name: "Green Ruby Demo" }],
    rooms: [{ id: roomId, tenantId, propertyId, label: "1208" }],
    users: [
      {
        id: newId(),
        tenantId,
        email: "admin@lotiva.vn",
        passwordHash,
        displayName: "Property Admin",
        role: "property_admin",
      },
      {
        id: newId(),
        tenantId,
        email: "staff@lotiva.vn",
        passwordHash,
        displayName: "Front Desk",
        role: "staff",
      },
    ],
    qr: [
      {
        id: newId(),
        tenantId,
        propertyId,
        roomId,
        tokenHash: hashQrToken(rawToken),
        activeFrom: new Date(Date.now() - 60_000),
        activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        revokedAt: null,
      },
    ],
    guestSessions: [],
    themeVersions: [
      {
        id: themeVersionId,
        tenantId,
        propertyId,
        status: "published_immutable",
        tokens: defaultThemeDraft("Green Ruby Demo"),
      },
    ],
    themePublications: [
      {
        id: newId(),
        tenantId,
        propertyId,
        versionId: themeVersionId,
        publishedAt: new Date(),
      },
    ],
    conversations: [],
    messages: [],
    knowledgeDocs: [{ id: docId, tenantId, propertyId, title: "Pool hours", status: "published" }],
    knowledgeChunks: [
      {
        id: newId(),
        tenantId,
        propertyId,
        documentId: docId,
        content:
          "Hồ bơi mở cửa từ 6:00 đến 22:00 hàng ngày. Trẻ em dưới 12 tuổi cần có người lớn đi kèm.",
      },
    ],
    schedules: [
      {
        id: newId(),
        tenantId,
        propertyId,
        title: "Breakfast buffet",
        location: "Lobby Restaurant",
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 120),
        active: true,
      },
    ],
    announcements: [
      {
        id: newId(),
        tenantId,
        propertyId,
        title: "Welcome to Green Ruby Demo",
        body: "Quét QR trong phòng để gọi trợ lý AI hoặc gửi yêu cầu dịch vụ.",
        publishedAt: new Date(),
        active: true,
      },
    ],
    pendingActions: [],
    tickets: [],
    ticketTransitions: [],
    auditLogs: [],
    promptProfiles: [
      {
        id: newId(),
        tenantId: null,
        propertyId: null,
        name: "platform-guest-inform",
        scope: "platform",
      },
    ],
    promptVersions: [],
    seedMeta: { guestQrToken: rawToken, tenantId, propertyId, roomId },
  };
  return db;
}

export function createMemoryRepos(db: MemoryDb): LotivaRepos {
  const qr: QrRepository = {
    async resolveByToken(token) {
      const hash = hashQrToken(token);
      const row = db.qr.find(
        (q) =>
          q.tokenHash === hash &&
          !q.revokedAt &&
          q.activeFrom <= new Date() &&
          (!q.activeUntil || q.activeUntil > new Date()),
      );
      if (!row) return null;
      const room = db.rooms.find((r) => r.id === row.roomId)!;
      return {
        qrContextId: row.id,
        tenantId: row.tenantId,
        propertyId: row.propertyId,
        roomId: row.roomId,
        roomLabel: room.label,
        stayContextId: null,
      };
    },
    async createContext(input) {
      const rawToken = generateOpaqueQrToken();
      const id = newId();
      db.qr.push({
        id,
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        roomId: input.roomId,
        tokenHash: input.tokenHash || hashQrToken(rawToken),
        activeFrom: input.activeFrom,
        activeUntil: input.activeUntil,
        revokedAt: null,
      });
      return { id, rawToken };
    },
    async revoke(id, tenantId) {
      const row = db.qr.find((q) => q.id === id && q.tenantId === tenantId);
      if (!row) return false;
      row.revokedAt = new Date();
      return true;
    },
    async isActive(id, tenantId) {
      const row = db.qr.find((q) => q.id === id && q.tenantId === tenantId);
      if (!row || row.revokedAt) return false;
      if (row.activeFrom > new Date()) return false;
      if (row.activeUntil && row.activeUntil <= new Date()) return false;
      return true;
    },
    async rotate(id, tenantId) {
      const prev = db.qr.find((q) => q.id === id && q.tenantId === tenantId);
      if (!prev || prev.revokedAt) return null;
      prev.revokedAt = new Date();
      const rawToken = generateOpaqueQrToken();
      const newQrId = newId();
      db.qr.push({
        id: newQrId,
        tenantId: prev.tenantId,
        propertyId: prev.propertyId,
        roomId: prev.roomId,
        tokenHash: hashQrToken(rawToken),
        activeFrom: new Date(),
        activeUntil: prev.activeUntil,
        revokedAt: null,
      });
      return { id: newQrId, rawToken };
    },
  };

  const sessions: GuestSessionRepository = {
    async create(input) {
      const id = newId();
      db.guestSessions.push({ id, ...input });
      return { id };
    },
    async get(id) {
      return db.guestSessions.find((s) => s.id === id) ?? null;
    },
    async setLocale(id, locale) {
      const row = db.guestSessions.find((s) => s.id === id);
      if (row) row.locale = locale;
    },
  };

  const themes: ThemeRepository = {
    async getPublished(propertyId) {
      const pub = [...db.themePublications]
        .filter((p) => p.propertyId === propertyId)
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())[0];
      if (!pub) return null;
      const ver = db.themeVersions.find((v) => v.id === pub.versionId);
      if (!ver) return null;
      return { ...ver.tokens, versionId: ver.id };
    },
    async getDraft(propertyId) {
      const draft = [...db.themeVersions]
        .filter((v) => v.propertyId === propertyId && v.status === "draft")
        .at(-1);
      if (!draft) return null;
      return { ...draft.tokens, versionId: draft.id };
    },
    async saveDraft(propertyId, tenantId, draft) {
      const versionId = newId();
      db.themeVersions.push({
        id: versionId,
        tenantId,
        propertyId,
        status: "draft",
        tokens: draft,
      });
      return { versionId };
    },
    async publish(propertyId, tenantId, versionId) {
      const ver = db.themeVersions.find((v) => v.id === versionId && v.propertyId === propertyId);
      if (!ver) throw new Error("Theme version not found");
      // immutable publish: clone if draft
      let publishId = ver.id;
      if (ver.status === "draft") {
        publishId = newId();
        db.themeVersions.push({
          ...ver,
          id: publishId,
          status: "published_immutable",
        });
      }
      const publicationId = newId();
      db.themePublications.push({
        id: publicationId,
        tenantId,
        propertyId,
        versionId: publishId,
        publishedAt: new Date(),
      });
      db.auditLogs.push({
        id: newId(),
        tenantId,
        actorId: null,
        action: "theme.publish",
        entityType: "portal_theme",
        entityId: publishId,
        payload: { propertyId },
        createdAt: new Date(),
      });
      return { publicationId };
    },
    async rollback(propertyId, tenantId, versionId) {
      return themes.publish(propertyId, tenantId, versionId);
    },
  };

  const knowledge: KnowledgeRepository = {
    async search({ tenantId, propertyId, query, limit, searchTerms, normalizedQuery }) {
      const terms = searchTerms?.length
        ? searchTerms
        : [normalizedQuery ?? normalizeSearchText(query)];
      return db.knowledgeChunks
        .filter((c) => c.tenantId === tenantId && c.propertyId === propertyId)
        .map((c) => {
          const doc = db.knowledgeDocs.find((d) => d.id === c.documentId);
          if (doc && doc.status !== "published") return null;
          const hay = normalizeSearchText(`${doc?.title ?? ""} ${c.content}`);
          const score = scoreKnowledgeMatch(hay, terms);
          if (score < 0.15) return null;
          return {
            chunkId: c.id,
            documentTitle: doc?.title ?? "Knowledge",
            content: c.content,
            score: Math.min(1, score),
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    },
  };

  const conversations: ConversationRepository = {
    async getOrCreate(guestSessionId, tenantId) {
      const existing = db.conversations.find((c) => c.guestSessionId === guestSessionId);
      if (existing) return { id: existing.id };
      const id = newId();
      db.conversations.push({ id, tenantId, guestSessionId });
      return { id };
    },
    async addMessage(input) {
      const id = newId();
      const createdAt = new Date();
      db.messages.push({ id, createdAt, ...input });
      return { id, createdAt };
    },
    async listMessages(conversationId, tenantId) {
      return db.messages.filter((m) => m.conversationId === conversationId && m.tenantId === tenantId);
    },
  };

  const pending: PendingActionRepository = {
    async create(input) {
      const id = newId();
      db.pendingActions.push({ id, status: "pending", ...input });
      return { id };
    },
    async get(id, tenantId) {
      const row = db.pendingActions.find((p) => p.id === id && p.tenantId === tenantId);
      if (!row) return null;
      return { ...row };
    },
    async mark(id, tenantId, status) {
      const row = db.pendingActions.find((p) => p.id === id && p.tenantId === tenantId);
      if (row) row.status = status;
    },
  };

  const tickets: TicketRepository = {
    async create(input) {
      const existing = db.tickets.find(
        (t) => t.tenantId === input.tenantId && t.idempotencyKey === input.idempotencyKey,
      );
      if (existing) return { id: existing.id, created: false };
      const id = newId();
      db.tickets.push({
        id,
        status: "submitted",
        version: 1,
        createdAt: new Date(),
        ...input,
      });
      return { id, created: true };
    },
    async listForProperty(propertyId, tenantId) {
      return db.tickets
        .filter((t) => t.propertyId === propertyId && t.tenantId === tenantId)
        .map((t) => ({
          id: t.id,
          status: t.status,
          category: t.category,
          description: t.description,
          department: t.department,
          createdAt: t.createdAt,
          guestSessionId: t.guestSessionId,
        }));
    },
    async listForGuestSession(guestSessionId, tenantId) {
      return db.tickets
        .filter((t) => t.guestSessionId === guestSessionId && t.tenantId === tenantId)
        .map((t) => ({
          id: t.id,
          status: t.status,
          category: t.category,
          description: t.description,
          department: t.department,
          createdAt: t.createdAt,
        }));
    },
    async updateStatus(id, tenantId, status) {
      const row = db.tickets.find((t) => t.id === id && t.tenantId === tenantId);
      if (row) row.status = status;
    },
    async transition(input) {
      const row = db.tickets.find((t) => t.id === input.id && t.tenantId === input.tenantId);
      if (!row || row.version !== input.expectedVersion || row.status !== input.fromStatus) {
        throw Object.assign(new Error("Ticket update conflict"), { code: "CONCURRENCY_CONFLICT" });
      }
      row.status = input.toStatus;
      row.version += 1;
      db.ticketTransitions.push({
        id: newId(),
        tenantId: input.tenantId,
        ticketId: input.id,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        actorId: input.actorId ?? null,
        actorType: input.actorType,
        reason: input.reason,
        correlationId: input.correlationId,
        createdAt: new Date(),
      });
      return { version: row.version };
    },
    async get(id, tenantId) {
      const row = db.tickets.find((t) => t.id === id && t.tenantId === tenantId);
      if (!row) return null;
      return {
        id: row.id,
        status: row.status,
        category: row.category,
        description: row.description,
        guestSessionId: row.guestSessionId,
        version: row.version,
      };
    },
  };

  const schedules: ScheduleRepository = {
    async listActive(propertyId, tenantId) {
      return db.schedules
        .filter((s) => s.propertyId === propertyId && s.tenantId === tenantId && s.active)
        .map((s) => ({
          id: s.id,
          title: s.title,
          startsAt: s.startsAt,
          endsAt: s.endsAt,
          location: s.location,
        }));
    },
  };

  const announcements: AnnouncementRepository = {
    async listActive(propertyId, tenantId) {
      return db.announcements
        .filter((a) => a.propertyId === propertyId && a.tenantId === tenantId && a.active)
        .map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          publishedAt: a.publishedAt,
        }));
    },
  };

  return {
    qr,
    sessions,
    themes,
    knowledge,
    conversations,
    pending,
    tickets,
    schedules,
    announcements,
    identity: {
      async findByEmail(email) {
        return db.users.find((u) => u.email === email) ?? null;
      },
      async findById(id) {
        return db.users.find((u) => u.id === id) ?? null;
      },
      async listByTenant(tenantId) {
        return db.users
          .filter((u) => u.tenantId === tenantId)
          .map((u) => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            role: u.role,
          }));
      },
    },
    catalog: {
      async getSeedMeta() {
        return db.seedMeta;
      },
      async getPropertyForTenant(tenantId) {
        const p = db.properties.find((x) => x.tenantId === tenantId);
        return p ? { id: p.id, name: p.name, tenantId: p.tenantId } : null;
      },
      async getRoom(roomId, tenantId) {
        const r = db.rooms.find((x) => x.id === roomId && x.tenantId === tenantId);
        return r ? { id: r.id, label: r.label } : null;
      },
      async countGuestSessions(tenantId) {
        return db.guestSessions.filter((g) => g.tenantId === tenantId).length;
      },
      async countConversations(tenantId) {
        return db.conversations.filter((c) => c.tenantId === tenantId).length;
      },
    },
    knowledgeAdmin: {
      async listDocuments(tenantId) {
        return db.knowledgeDocs
          .filter((d) => d.tenantId === tenantId)
          .map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            propertyId: d.propertyId,
          }));
      },
      async listChunks(tenantId) {
        return db.knowledgeChunks
          .filter((c) => c.tenantId === tenantId)
          .map((c) => ({
            id: c.id,
            documentId: c.documentId,
            content: c.content,
            propertyId: c.propertyId,
          }));
      },
      async publishDocument(input) {
        const id = newId();
        const chunkId = newId();
        db.knowledgeDocs.push({
          id,
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          title: input.title,
          status: "published",
        });
        db.knowledgeChunks.push({
          id: chunkId,
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          documentId: id,
          content: input.content,
        });
        return { id, chunkId, embedded: Boolean(input.embedding?.length) };
      },
    },
    passwordReset: {
      async createToken(input) {
        const id = newId();
        (db as MemoryDb & { resetTokens?: Array<Record<string, unknown>> }).resetTokens ??= [];
        (db as MemoryDb & { resetTokens: Array<Record<string, unknown>> }).resetTokens.push({
          id,
          ...input,
          usedAt: null,
        });
        return { id };
      },
      async consumeToken(tokenHash) {
        const list =
          (db as MemoryDb & { resetTokens?: Array<Record<string, unknown>> }).resetTokens ?? [];
        const row = list.find((t) => t.tokenHash === tokenHash && !t.usedAt) as
          | { userId: string; expiresAt: Date; usedAt: Date | null }
          | undefined;
        if (!row || row.expiresAt.getTime() < Date.now()) return null;
        row.usedAt = new Date();
        return { userId: row.userId };
      },
      async updatePassword(userId, passwordHash) {
        const u = db.users.find((x) => x.id === userId);
        if (u) u.passwordHash = passwordHash;
      },
    },
    ticketOutbox: {
      async append(input) {
        const list =
          ((db as MemoryDb & { outbox?: Array<Record<string, unknown>> }).outbox ??= []);
        const id = list.length + 1;
        list.push({ id, ...input, createdAt: new Date() });
        return { id };
      },
      async listSince(propertyId, tenantId, afterId, limit = 100) {
        const list =
          ((db as MemoryDb & { outbox?: Array<Record<string, unknown>> }).outbox ??= []);
        return list
          .filter(
            (e) =>
              e.propertyId === propertyId &&
              e.tenantId === tenantId &&
              Number(e.id) > afterId,
          )
          .slice(0, limit)
          .map((e) => ({
            id: Number(e.id),
            ticketId: String(e.ticketId),
            eventType: String(e.eventType),
            status: String(e.status),
            propertyId: String(e.propertyId),
            createdAt: e.createdAt as Date,
          }));
      },
    },
    audit: {
      async append(input) {
        db.auditLogs.push({
          id: newId(),
          tenantId: input.tenantId,
          actorId: input.actorId,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          payload: input.payload ?? {},
          createdAt: new Date(),
        });
      },
      async list(tenantId, limit = 100) {
        return db.auditLogs
          .filter((a) => a.tenantId === tenantId)
          .slice(-limit)
          .reverse()
          .map((a) => ({
            id: a.id,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            payload: a.payload,
            createdAt: a.createdAt,
            actorId: a.actorId,
          }));
      },
    },
    prompts: {
      async listProfiles() {
        return db.promptProfiles;
      },
      async listVersions() {
        return db.promptVersions;
      },
      async createVersion(profileId, body) {
        const version =
          Math.max(
            0,
            ...db.promptVersions.filter((v) => v.profileId === profileId).map((v) => v.version),
          ) + 1;
        const id = newId();
        db.promptVersions.push({
          id,
          profileId,
          version,
          body,
          status: "draft",
        });
        return { id, version };
      },
    },
  };
}
