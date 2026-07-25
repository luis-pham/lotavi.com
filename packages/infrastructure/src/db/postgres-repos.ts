import {
  generateOpaqueQrToken,
  hashQrToken,
  newId,
  type PortalThemeDraft,
  type TicketStatus,
} from "@lotiva/domain";
import type { LotivaRepos } from "@lotiva/application";
import { and, asc, desc, eq, gt, isNull, sql as dsql } from "drizzle-orm";
import { withBypassRls, withTenant } from "./client.js";
import * as t from "./schema.js";

export function createPostgresRepos(): LotivaRepos {
  const repos: LotivaRepos = {
    qr: {
      async resolveByToken(token) {
        const hash = hashQrToken(token);
        return withBypassRls(async (db) => {
          const rows = await db
            .select({
              id: t.qrContexts.id,
              tenantId: t.qrContexts.tenantId,
              propertyId: t.qrContexts.propertyId,
              roomId: t.qrContexts.roomId,
              label: t.rooms.label,
              activeFrom: t.qrContexts.activeFrom,
              activeUntil: t.qrContexts.activeUntil,
              revokedAt: t.qrContexts.revokedAt,
            })
            .from(t.qrContexts)
            .innerJoin(t.rooms, eq(t.rooms.id, t.qrContexts.roomId))
            .where(eq(t.qrContexts.tokenHash, hash))
            .limit(1);
          const row = rows[0];
          if (!row || row.revokedAt) return null;
          const now = new Date();
          if (row.activeFrom > now) return null;
          if (row.activeUntil && row.activeUntil <= now) return null;
          return {
            qrContextId: row.id,
            tenantId: row.tenantId,
            propertyId: row.propertyId,
            roomId: row.roomId,
            roomLabel: row.label,
            stayContextId: null,
          };
        });
      },
      async createContext(input) {
        const rawToken = generateOpaqueQrToken();
        const id = newId();
        await withTenant(input.tenantId, async (db) => {
          await db.insert(t.qrContexts).values({
            id,
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            roomId: input.roomId,
            tokenHash: input.tokenHash || hashQrToken(rawToken),
            activeFrom: input.activeFrom,
            activeUntil: input.activeUntil,
          });
        });
        return { id, rawToken };
      },
      async revoke(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .update(t.qrContexts)
            .set({ revokedAt: new Date() })
            .where(and(eq(t.qrContexts.id, id), eq(t.qrContexts.tenantId, tenantId)))
            .returning({ id: t.qrContexts.id });
          return rows.length > 0;
        });
      },
      async isActive(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select({
              revokedAt: t.qrContexts.revokedAt,
              activeFrom: t.qrContexts.activeFrom,
              activeUntil: t.qrContexts.activeUntil,
            })
            .from(t.qrContexts)
            .where(and(eq(t.qrContexts.id, id), eq(t.qrContexts.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];
          if (!row || row.revokedAt) return false;
          const now = new Date();
          if (row.activeFrom > now) return false;
          if (row.activeUntil && row.activeUntil <= now) return false;
          return true;
        });
      },
      async rotate(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const existing = await db
            .select()
            .from(t.qrContexts)
            .where(and(eq(t.qrContexts.id, id), eq(t.qrContexts.tenantId, tenantId)))
            .limit(1);
          const prev = existing[0];
          if (!prev || prev.revokedAt) return null;
          await db
            .update(t.qrContexts)
            .set({ revokedAt: new Date(), rotatedAt: new Date() })
            .where(eq(t.qrContexts.id, id));
          const rawToken = generateOpaqueQrToken();
          const newIdQr = newId();
          await db.insert(t.qrContexts).values({
            id: newIdQr,
            tenantId: prev.tenantId,
            propertyId: prev.propertyId,
            roomId: prev.roomId,
            tokenHash: hashQrToken(rawToken),
            activeFrom: new Date(),
            activeUntil: prev.activeUntil,
            rotatedFrom: prev.id,
          });
          return { id: newIdQr, rawToken };
        });
      },
    },

    sessions: {
      async create(input) {
        const id = newId();
        await withTenant(input.tenantId, async (db) => {
          await db.insert(t.guestSessions).values({ id, ...input });
        });
        return { id };
      },
      async get(id) {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.guestSessions).where(eq(t.guestSessions.id, id)).limit(1);
          const row = rows[0];
          if (!row) return null;
          return {
            id: row.id,
            tenantId: row.tenantId,
            propertyId: row.propertyId,
            roomId: row.roomId,
            qrContextId: row.qrContextId,
            locale: row.localeSelected ?? row.locale,
            themeVersionId: row.themeVersionId,
            expiresAt: row.expiresAt,
          };
        });
      },
      async setLocale(id, locale) {
        await withBypassRls(async (db) => {
          await db
            .update(t.guestSessions)
            .set({ locale, localeSelected: locale })
            .where(eq(t.guestSessions.id, id));
        });
      },
    },

    themes: {
      async getPublished(propertyId) {
        return withBypassRls(async (db) => {
          const pubs = await db
            .select()
            .from(t.portalThemePublications)
            .where(eq(t.portalThemePublications.propertyId, propertyId))
            .orderBy(desc(t.portalThemePublications.publishedAt))
            .limit(1);
          const pub = pubs[0];
          if (!pub) return null;
          const vers = await db
            .select()
            .from(t.portalThemeVersions)
            .where(eq(t.portalThemeVersions.id, pub.versionId))
            .limit(1);
          const ver = vers[0];
          if (!ver) return null;
          return { ...(ver.tokens as PortalThemeDraft), versionId: ver.id };
        });
      },
      async getDraft(propertyId) {
        return withBypassRls(async (db) => {
          const rows = await db
            .select()
            .from(t.portalThemeVersions)
            .where(
              and(
                eq(t.portalThemeVersions.propertyId, propertyId),
                eq(t.portalThemeVersions.status, "draft"),
              ),
            )
            .orderBy(desc(t.portalThemeVersions.createdAt))
            .limit(1);
          const ver = rows[0];
          if (!ver) return null;
          return { ...(ver.tokens as PortalThemeDraft), versionId: ver.id };
        });
      },
      async saveDraft(propertyId, tenantId, draft) {
        const versionId = newId();
        await withTenant(tenantId, async (db) => {
          await db.insert(t.portalThemeVersions).values({
            id: versionId,
            tenantId,
            propertyId,
            status: "draft",
            tokens: draft,
          });
        });
        return { versionId };
      },
      async publish(propertyId, tenantId, versionId) {
        return withTenant(tenantId, async (db) => {
          const vers = await db
            .select()
            .from(t.portalThemeVersions)
            .where(eq(t.portalThemeVersions.id, versionId))
            .limit(1);
          const ver = vers[0];
          if (!ver || ver.propertyId !== propertyId) throw new Error("Theme version not found");
          let publishId = ver.id;
          if (ver.status === "draft") {
            publishId = newId();
            await db.insert(t.portalThemeVersions).values({
              id: publishId,
              tenantId,
              propertyId,
              status: "published_immutable",
              tokens: ver.tokens,
            });
          }
          const publicationId = newId();
          await db.insert(t.portalThemePublications).values({
            id: publicationId,
            tenantId,
            propertyId,
            versionId: publishId,
          });
          await db.insert(t.auditLogs).values({
            id: newId(),
            tenantId,
            actorId: null,
            action: "theme.publish",
            entityType: "portal_theme",
            entityId: publishId,
            payload: { propertyId },
          });
          return { publicationId };
        });
      },
      async rollback(propertyId, tenantId, versionId) {
        return repos.themes.publish(propertyId, tenantId, versionId);
      },
    },

    knowledge: {
      async search({ tenantId, propertyId, query, limit, searchTerms, normalizedQuery, locale, queryEmbedding }) {
        const { normalizeSearchText } = await import("@lotiva/domain");
        const { hybridSearchSql } = await import("../retrieval/hybrid-sql.js");
        const terms = (searchTerms?.length
          ? searchTerms
          : [normalizedQuery ?? normalizeSearchText(query)]
        ).filter(Boolean);

        return withTenant(tenantId, async (db) => {
          const hits = await hybridSearchSql(db, {
            tenantId,
            propertyId,
            query,
            normalizedQuery: normalizedQuery ?? normalizeSearchText(query),
            searchTerms: terms,
            queryEmbedding,
            limit,
            locale,
            hasPgvector: false,
          });
          return hits.map((h) => ({
            chunkId: h.chunkId,
            documentId: h.documentId,
            documentTitle: h.documentTitle,
            content: h.content,
            score: h.score,
            denseScore: h.denseScore,
            ftsScore: h.ftsScore,
            trigramScore: h.trigramScore,
            criticality: h.criticality,
          }));
        });
      },
    },

    conversations: {
      async getOrCreate(guestSessionId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const existing = await db
            .select()
            .from(t.conversations)
            .where(eq(t.conversations.guestSessionId, guestSessionId))
            .limit(1);
          if (existing[0]) return { id: existing[0].id };
          const id = newId();
          await db.insert(t.conversations).values({ id, tenantId, guestSessionId });
          return { id };
        });
      },
      async addMessage(input) {
        const id = newId();
        const createdAt = new Date();
        await withTenant(input.tenantId, async (db) => {
          await db.insert(t.messages).values({
            id,
            grounding: input.grounding
              ? {
                  ...input.grounding,
                  answerConfidence: input.answerConfidence,
                }
              : input.answerConfidence != null
                ? { answerConfidence: input.answerConfidence }
                : null,
            fallbackReason: input.fallbackReason ?? null,
            sourceLocale: input.sourceLocale ?? null,
            tenantId: input.tenantId,
            conversationId: input.conversationId,
            role: input.role,
            content: input.content,
            createdAt,
          });
        });
        return { id, createdAt };
      },
      async listMessages(conversationId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.messages)
            .where(
              and(eq(t.messages.conversationId, conversationId), eq(t.messages.tenantId, tenantId)),
            );
          return rows.map((r) => ({
            id: r.id,
            role: r.role as "guest" | "assistant" | "system",
            content: r.content,
            createdAt: r.createdAt,
          }));
        });
      },
    },

    pending: {
      async create(input) {
        const id = newId();
        await withTenant(input.tenantId, async (db) => {
          await db.insert(t.pendingActions).values({
            id,
            status: "pending",
            ...input,
          });
        });
        return { id };
      },
      async get(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.pendingActions)
            .where(and(eq(t.pendingActions.id, id), eq(t.pendingActions.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];
          if (!row) return null;
          return {
            id: row.id,
            guestSessionId: row.guestSessionId,
            category: row.category,
            description: row.description,
            department: row.department,
            status: row.status as "pending" | "confirmed" | "cancelled" | "expired",
            expiresAt: row.expiresAt,
          };
        });
      },
      async mark(id, tenantId, status) {
        await withTenant(tenantId, async (db) => {
          await db
            .update(t.pendingActions)
            .set({ status })
            .where(and(eq(t.pendingActions.id, id), eq(t.pendingActions.tenantId, tenantId)));
        });
      },
    },

    tickets: {
      async create(input) {
        return withTenant(input.tenantId, async (db) => {
          const existing = await db
            .select()
            .from(t.tickets)
            .where(
              and(
                eq(t.tickets.tenantId, input.tenantId),
                eq(t.tickets.idempotencyKey, input.idempotencyKey),
              ),
            )
            .limit(1);
          if (existing[0]) return { id: existing[0].id, created: false };
          const id = newId();
          await db.insert(t.tickets).values({
            id,
            status: "submitted",
            ...input,
          });
          return { id, created: true };
        });
      },
      async listForProperty(propertyId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.tickets)
            .where(and(eq(t.tickets.propertyId, propertyId), eq(t.tickets.tenantId, tenantId)));
          return rows.map((row) => ({
            id: row.id,
            status: row.status as TicketStatus,
            category: row.category,
            description: row.description,
            department: row.department,
            createdAt: row.createdAt,
            guestSessionId: row.guestSessionId,
          }));
        });
      },
      async listForGuestSession(guestSessionId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.tickets)
            .where(
              and(
                eq(t.tickets.guestSessionId, guestSessionId),
                eq(t.tickets.tenantId, tenantId),
              ),
            );
          return rows.map((row) => ({
            id: row.id,
            status: row.status as TicketStatus,
            category: row.category,
            description: row.description,
            department: row.department,
            createdAt: row.createdAt,
          }));
        });
      },
      async updateStatus(id, tenantId, status) {
        await withTenant(tenantId, async (db) => {
          await db
            .update(t.tickets)
            .set({ status })
            .where(and(eq(t.tickets.id, id), eq(t.tickets.tenantId, tenantId)));
        });
      },
      async transition(input) {
        return withTenant(input.tenantId, async (db) => {
          const patch: Record<string, unknown> = {
            status: input.toStatus,
            version: input.expectedVersion + 1,
          };
          if (input.toStatus === "guest_confirmed") {
            patch.guestConfirmedAt = new Date();
          }
          const updated = await db
            .update(t.tickets)
            .set(patch)
            .where(
              and(
                eq(t.tickets.id, input.id),
                eq(t.tickets.tenantId, input.tenantId),
                eq(t.tickets.version, input.expectedVersion),
                eq(t.tickets.status, input.fromStatus),
              ),
            )
            .returning({ id: t.tickets.id, version: t.tickets.version });
          if (!updated[0]) {
            throw Object.assign(new Error("Ticket update conflict"), {
              code: "CONCURRENCY_CONFLICT",
            });
          }
          await db.insert(t.ticketTransitions).values({
            id: newId(),
            tenantId: input.tenantId,
            ticketId: input.id,
            fromStatus: input.fromStatus,
            toStatus: input.toStatus,
            actorId: input.actorId ?? null,
            actorType: input.actorType,
            reason: input.reason ?? null,
            correlationId: input.correlationId ?? null,
          });
          return { version: updated[0].version };
        });
      },
      async get(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.tickets)
            .where(and(eq(t.tickets.id, id), eq(t.tickets.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];
          if (!row) return null;
          return {
            id: row.id,
            status: row.status as TicketStatus,
            category: row.category,
            description: row.description,
            guestSessionId: row.guestSessionId,
            version: row.version ?? 1,
          };
        });
      },
    },

    schedules: {
      async listActive(propertyId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.schedules)
            .where(
              and(
                eq(t.schedules.propertyId, propertyId),
                eq(t.schedules.tenantId, tenantId),
                eq(t.schedules.active, true),
              ),
            );
          return rows.map((s) => ({
            id: s.id,
            title: s.title,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            location: s.location,
          }));
        });
      },
    },

    announcements: {
      async listActive(propertyId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.announcements)
            .where(
              and(
                eq(t.announcements.propertyId, propertyId),
                eq(t.announcements.tenantId, tenantId),
                eq(t.announcements.active, true),
              ),
            );
          return rows.map((a) => ({
            id: a.id,
            title: a.title,
            body: a.body,
            publishedAt: a.publishedAt,
          }));
        });
      },
    },

    identity: {
      async findByEmail(email) {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.users).where(eq(t.users.email, email)).limit(1);
          const u = rows[0];
          if (!u) return null;
          return {
            id: u.id,
            tenantId: u.tenantId,
            email: u.email,
            passwordHash: u.passwordHash,
            displayName: u.displayName,
            role: u.role,
          };
        });
      },
      async findById(id) {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.users).where(eq(t.users.id, id)).limit(1);
          const u = rows[0];
          if (!u) return null;
          return {
            id: u.id,
            tenantId: u.tenantId,
            email: u.email,
            passwordHash: u.passwordHash,
            displayName: u.displayName,
            role: u.role,
          };
        });
      },
      async listByTenant(tenantId) {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.users).where(eq(t.users.tenantId, tenantId));
          return rows.map((u) => ({
            id: u.id,
            email: u.email,
            displayName: u.displayName,
            role: u.role,
          }));
        });
      },
    },

    catalog: {
      async getSeedMeta() {
        return withBypassRls(async (db) => {
          const rows = await db
            .select()
            .from(t.appMeta)
            .where(eq(t.appMeta.key, "seed"))
            .limit(1);
          const row = rows[0];
          if (!row) return null;
          return row.value as {
            guestQrToken: string;
            tenantId: string;
            propertyId: string;
            roomId: string;
          };
        });
      },
      async getPropertyForTenant(tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.properties)
            .where(eq(t.properties.tenantId, tenantId))
            .limit(1);
          const p = rows[0];
          return p ? { id: p.id, name: p.name, tenantId: p.tenantId } : null;
        });
      },
      async getRoom(roomId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.rooms)
            .where(and(eq(t.rooms.id, roomId), eq(t.rooms.tenantId, tenantId)))
            .limit(1);
          const r = rows[0];
          return r ? { id: r.id, label: r.label } : null;
        });
      },
      async countGuestSessions(tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select({ c: dsql<number>`count(*)::int` })
            .from(t.guestSessions)
            .where(eq(t.guestSessions.tenantId, tenantId));
          return rows[0]?.c ?? 0;
        });
      },
      async countConversations(tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select({ c: dsql<number>`count(*)::int` })
            .from(t.conversations)
            .where(eq(t.conversations.tenantId, tenantId));
          return rows[0]?.c ?? 0;
        });
      },
    },

    knowledgeAdmin: {
      async listDocuments(tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.knowledgeDocuments)
            .where(eq(t.knowledgeDocuments.tenantId, tenantId));
          return rows.map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            propertyId: d.propertyId,
          }));
        });
      },
      async listChunks(tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.knowledgeChunks)
            .where(eq(t.knowledgeChunks.tenantId, tenantId));
          return rows.map((c) => ({
            id: c.id,
            documentId: c.documentId,
            content: c.content,
            propertyId: c.propertyId,
          }));
        });
      },
      async publishDocument(input) {
        const { createHash } = await import("node:crypto");
        const { normalizeSearchText } = await import("@lotiva/domain");
        const id = newId();
        const chunkId = newId();
        const contentHash = createHash("sha256").update(input.content).digest("hex");
        const contentNormalized = normalizeSearchText(input.content);
        let embedded = false;
        await withTenant(input.tenantId, async (db) => {
          await db.insert(t.knowledgeDocuments).values({
            id,
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            title: input.title,
            titleNormalized: normalizeSearchText(input.title),
            status: "published",
            locale: input.locale ?? null,
            criticality: input.criticality ?? "normal",
          });
          await db.insert(t.knowledgeChunks).values({
            id: chunkId,
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            documentId: id,
            content: input.content,
            contentNormalized,
            contentHash,
            locale: input.locale ?? null,
            criticality: input.criticality ?? "normal",
            embeddingModel: input.embeddingModel ?? null,
            embeddingModelVersion: input.embeddingModelVersion ?? null,
            embeddingDimension: input.embedding?.length ?? null,
            embeddedAt: input.embedding ? new Date() : null,
          });
          if (input.embedding?.length === 768) {
            embedded = true;
            // Store as jsonb for environments without pgvector; vector cast when available.
            await db.execute(dsql`
              UPDATE knowledge_chunks
              SET embedding = ${JSON.stringify(input.embedding)}::jsonb
              WHERE id = ${chunkId}::uuid
            `);
          }
          await db.execute(dsql`
            UPDATE knowledge_chunks
            SET content_tsv = to_tsvector('simple', coalesce(content_normalized, lower(content)))
            WHERE id = ${chunkId}::uuid
          `);
        });
        return { id, chunkId, embedded };
      },
    },

    passwordReset: {
      async createToken(input) {
        const id = newId();
        await withBypassRls(async (db) => {
          await db.insert(t.passwordResetTokens).values({
            id,
            userId: input.userId,
            tokenHash: input.tokenHash,
            expiresAt: input.expiresAt,
            requestIp: input.requestIp ?? null,
          });
        });
        return { id };
      },
      async consumeToken(tokenHash) {
        return withBypassRls(async (db) => {
          const rows = await db
            .select()
            .from(t.passwordResetTokens)
            .where(eq(t.passwordResetTokens.tokenHash, tokenHash))
            .limit(1);
          const row = rows[0];
          if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) return null;
          await db
            .update(t.passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(t.passwordResetTokens.id, row.id));
          return { userId: row.userId };
        });
      },
      async updatePassword(userId, passwordHash) {
        await withBypassRls(async (db) => {
          await db.update(t.users).set({ passwordHash }).where(eq(t.users.id, userId));
          await db
            .update(t.staffSessions)
            .set({ revokedAt: new Date() })
            .where(and(eq(t.staffSessions.userId, userId), isNull(t.staffSessions.revokedAt)));
        });
      },
    },

    ticketOutbox: {
      async append(input) {
        return withTenant(input.tenantId, async (db) => {
          const rows = await db
            .insert(t.ticketOutboxEvents)
            .values({
              tenantId: input.tenantId,
              propertyId: input.propertyId,
              ticketId: input.ticketId,
              eventType: input.eventType,
              status: input.status,
              payload: input.payload ?? {},
            })
            .returning({ id: t.ticketOutboxEvents.id });
          return { id: rows[0]!.id };
        });
      },
      async listSince(propertyId, tenantId, afterId, limit = 100) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.ticketOutboxEvents)
            .where(
              and(
                eq(t.ticketOutboxEvents.propertyId, propertyId),
                eq(t.ticketOutboxEvents.tenantId, tenantId),
                gt(t.ticketOutboxEvents.id, afterId),
              ),
            )
            .orderBy(asc(t.ticketOutboxEvents.id))
            .limit(limit);
          return rows.map((r) => ({
            id: r.id,
            ticketId: r.ticketId,
            eventType: r.eventType,
            status: r.status,
            propertyId: r.propertyId,
            createdAt: r.createdAt,
          }));
        });
      },
    },

    audit: {
      async append(input) {
        await withBypassRls(async (db) => {
          await db.insert(t.auditLogs).values({
            id: newId(),
            tenantId: input.tenantId,
            actorId: input.actorId,
            action: input.action,
            entityType: input.entityType,
            entityId: input.entityId,
            payload: input.payload ?? {},
          });
        });
      },
      async list(tenantId, limit = 100) {
        return withBypassRls(async (db) => {
          const rows = await db
            .select()
            .from(t.auditLogs)
            .where(eq(t.auditLogs.tenantId, tenantId))
            .orderBy(desc(t.auditLogs.createdAt))
            .limit(limit);
          return rows.map((a) => ({
            id: a.id,
            action: a.action,
            entityType: a.entityType,
            entityId: a.entityId,
            payload: a.payload as Record<string, unknown>,
            createdAt: a.createdAt,
            actorId: a.actorId,
          }));
        });
      },
    },

    prompts: {
      async listProfiles() {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.promptProfiles);
          return rows.map((p) => ({
            id: p.id,
            name: p.name,
            scope: p.scope,
            tenantId: p.tenantId,
            propertyId: p.propertyId,
          }));
        });
      },
      async listVersions() {
        return withBypassRls(async (db) => {
          const rows = await db.select().from(t.promptVersions);
          return rows.map((v) => ({
            id: v.id,
            profileId: v.profileId,
            version: v.version,
            body: v.body,
            status: v.status,
          }));
        });
      },
      async createVersion(profileId, body) {
        return withBypassRls(async (db) => {
          const existing = await db
            .select()
            .from(t.promptVersions)
            .where(eq(t.promptVersions.profileId, profileId));
          const version = Math.max(0, ...existing.map((v) => v.version)) + 1;
          const id = newId();
          await db.insert(t.promptVersions).values({
            id,
            profileId,
            version,
            body,
            status: "draft",
          });
          return { id, version };
        });
      },
    },

    voiceSessions: {
      async create(input) {
        return withTenant(input.tenantId, async (db) => {
          const now = new Date();
          await db.insert(t.voiceSessions).values({
            id: input.id,
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            guestSessionId: input.guestSessionId,
            conversationId: input.conversationId,
            provider: input.provider ?? "gemini_live",
            transport: input.transport,
            status: input.status ?? "created",
            revision: 0,
            lastHeartbeatAt: now,
          });
          return {
            id: input.id,
            tenantId: input.tenantId,
            propertyId: input.propertyId,
            guestSessionId: input.guestSessionId,
            conversationId: input.conversationId,
            provider: input.provider ?? "gemini_live",
            transport: input.transport,
            status: input.status ?? "created",
            revision: 0,
            lastHeartbeatAt: now,
            terminationReason: null,
            createdAt: now,
            endedAt: null,
          };
        });
      },
      async get(id, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.voiceSessions)
            .where(and(eq(t.voiceSessions.id, id), eq(t.voiceSessions.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];
          if (!row || !row.propertyId || !row.guestSessionId) return null;
          return {
            id: row.id,
            tenantId: row.tenantId,
            propertyId: row.propertyId,
            guestSessionId: row.guestSessionId,
            conversationId: row.conversationId,
            provider: row.provider,
            transport: row.transport as "relay" | "direct" | "off",
            status: row.status,
            revision: row.revision,
            lastHeartbeatAt: row.lastHeartbeatAt ?? null,
            terminationReason: row.terminationReason ?? null,
            createdAt: row.createdAt,
            endedAt: row.endedAt,
          };
        });
      },
      async assertOwnedByGuest(id, guestSessionId, tenantId) {
        const row = await this.get(id, tenantId);
        if (!row || row.guestSessionId !== guestSessionId || row.endedAt) return null;
        return row;
      },
      async countOpenForProperty(propertyId, tenantId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select({ id: t.voiceSessions.id, status: t.voiceSessions.status })
            .from(t.voiceSessions)
            .where(
              and(
                eq(t.voiceSessions.propertyId, propertyId),
                eq(t.voiceSessions.tenantId, tenantId),
                isNull(t.voiceSessions.endedAt),
              ),
            );
          const closed = new Set(["ended", "failed", "expired", "abandoned"]);
          return rows.filter((r) => !closed.has(r.status)).length;
        });
      },
      async updateStatus(input) {
        await withTenant(input.tenantId, async (db) => {
          await db
            .update(t.voiceSessions)
            .set({
              status: input.status,
              ...(input.revision != null ? { revision: input.revision } : {}),
              ...(input.endedAt !== undefined ? { endedAt: input.endedAt } : {}),
              ...(input.lastHeartbeatAt !== undefined
                ? { lastHeartbeatAt: input.lastHeartbeatAt }
                : {}),
              ...(input.terminationReason !== undefined
                ? { terminationReason: input.terminationReason }
                : {}),
              ...(input.providerSessionRef !== undefined
                ? { providerSessionRef: input.providerSessionRef }
                : {}),
            })
            .where(and(eq(t.voiceSessions.id, input.id), eq(t.voiceSessions.tenantId, input.tenantId)));
        });
      },
      async heartbeat(id, tenantId, guestSessionId) {
        return withTenant(tenantId, async (db) => {
          const rows = await db
            .select()
            .from(t.voiceSessions)
            .where(and(eq(t.voiceSessions.id, id), eq(t.voiceSessions.tenantId, tenantId)))
            .limit(1);
          const row = rows[0];
          if (!row || row.guestSessionId !== guestSessionId || row.endedAt) return false;
          const closed = new Set(["ended", "failed", "expired", "abandoned", "disconnecting"]);
          if (closed.has(row.status)) return false;
          await db
            .update(t.voiceSessions)
            .set({ lastHeartbeatAt: new Date() })
            .where(and(eq(t.voiceSessions.id, id), eq(t.voiceSessions.tenantId, tenantId)));
          return true;
        });
      },
      async abandonStale(olderThan) {
        // Cross-tenant cleanup uses admin SQL path via getSql when available.
        try {
          const { getSql } = await import("./client.js");
          const sql = getSql();
          const result = await sql`
            UPDATE voice_sessions
            SET status = 'abandoned',
                ended_at = NOW(),
                termination_reason = 'heartbeat_timeout'
            WHERE ended_at IS NULL
              AND status NOT IN ('ended', 'failed', 'expired', 'abandoned')
              AND COALESCE(last_heartbeat_at, created_at) < ${olderThan}
            RETURNING id
          `;
          return result.length;
        } catch {
          return 0;
        }
      },
    },
  };
  return repos;
}

export async function pingPostgres(): Promise<boolean> {
  try {
    const { getSql } = await import("./client.js");
    await getSql()`select 1`;
    return true;
  } catch {
    return false;
  }
}
