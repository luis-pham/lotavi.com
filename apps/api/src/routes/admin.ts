import type { FastifyInstance } from "fastify";
import {
  defaultThemeDraft,
  generateOpaqueQrToken,
  hashQrToken,
  type PortalThemeDraft,
} from "@lotiva/domain";
import { publishTheme, rollbackTheme, saveThemeDraft } from "@lotiva/application";
import { getAppContext } from "../app-context.js";
import { sendError } from "../plugins/observability.js";
import { readStaff } from "./auth.js";

export async function registerAdminRoutes(app: FastifyInstance) {
  function requireAdmin(req: { cookies?: Partial<Record<string, string>> }) {
    const staff = readStaff(req);
    if (!staff || !["property_admin", "platform_admin", "manager"].includes(staff.role)) {
      return null;
    }
    return staff;
  }

  app.get("/api/v1/admin/home", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const property = await ctx.repos.catalog.getPropertyForTenant(staff.tenantId);
    const seed = await ctx.repos.catalog.getSeedMeta();
    const tickets = property
      ? await ctx.repos.tickets.listForProperty(property.id, staff.tenantId)
      : [];
    const docs = await ctx.repos.knowledgeAdmin.listDocuments(staff.tenantId);
    return {
      property,
      openTickets: tickets.filter((t) => !["completed", "cancelled"].includes(t.status)).length,
      knowledgeDocs: docs.length,
      seedQrPath: seed?.guestQrToken ? `/g/${seed.guestQrToken}` : null,
    };
  });

  app.get("/api/v1/admin/brand/draft", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    const draft = await ctx.repos.themes.getDraft(seed.propertyId);
    const published = await ctx.repos.themes.getPublished(seed.propertyId);
    return { draft, published };
  });

  app.put("/api/v1/admin/brand/draft", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    const draft = req.body as PortalThemeDraft;
    try {
      return await saveThemeDraft({
        themes: ctx.repos.themes,
        propertyId: seed.propertyId,
        tenantId: staff.tenantId,
        draft: { ...defaultThemeDraft(), ...draft },
      });
    } catch (err) {
      return sendError(reply, req, 400, "THEME_INVALID", (err as Error).message);
    }
  });

  app.post("/api/v1/admin/brand/publish", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    const body = req.body as { versionId?: string };
    if (!body.versionId) return sendError(reply, req, 400, "VALIDATION", "versionId required");
    return publishTheme({
      themes: ctx.repos.themes,
      propertyId: seed.propertyId,
      tenantId: staff.tenantId,
      versionId: body.versionId,
    });
  });

  app.post("/api/v1/admin/brand/rollback", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    const body = req.body as { versionId?: string };
    if (!body.versionId) return sendError(reply, req, 400, "VALIDATION", "versionId required");
    return rollbackTheme({
      themes: ctx.repos.themes,
      propertyId: seed.propertyId,
      tenantId: staff.tenantId,
      versionId: body.versionId,
    });
  });

  app.get("/api/v1/admin/knowledge", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    return {
      documents: await ctx.repos.knowledgeAdmin.listDocuments(staff.tenantId),
      chunks: await ctx.repos.knowledgeAdmin.listChunks(staff.tenantId),
    };
  });

  app.post("/api/v1/admin/knowledge", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const body = req.body as { title?: string; content?: string };
    if (!body.title || !body.content) {
      return sendError(reply, req, 400, "VALIDATION", "title and content required");
    }
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    let embedding: number[] | undefined;
    let embeddingModel: string | undefined;
    let embeddingModelVersion: string | undefined;
    try {
      const meta = await ctx.embedding.embedWithMeta?.([body.content]);
      if (meta) {
        embedding = meta.embeddings[0];
        embeddingModel = meta.model;
        embeddingModelVersion = meta.modelVersion;
      } else {
        embedding = (await ctx.embedding.embed([body.content]))[0];
      }
    } catch (err) {
      return sendError(reply, req, 503, "EMBEDDING_UNAVAILABLE", (err as Error).message);
    }
    const created = await ctx.repos.knowledgeAdmin.publishDocument({
      tenantId: staff.tenantId,
      propertyId: seed.propertyId,
      title: body.title,
      content: body.content,
      embedding,
      embeddingModel,
      embeddingModelVersion,
    });
    await ctx.repos.audit.append({
      tenantId: staff.tenantId,
      actorId: staff.userId,
      action: "knowledge.publish",
      entityType: "knowledge_document",
      entityId: created.id,
      payload: { title: body.title, embedded: created.embedded },
    });
    return { id: created.id, chunkId: created.chunkId, embedded: created.embedded };
  });

  app.get("/api/v1/admin/ai-settings", async (req, reply) => {
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    return {
      voiceProvider: "gemini_live",
      fallbackText: true,
      modelProfile: "property-default",
      store: getAppContext().store,
    };
  });

  app.get("/api/v1/admin/prompts", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    return {
      profiles: await ctx.repos.prompts.listProfiles(),
      versions: await ctx.repos.prompts.listVersions(),
    };
  });

  app.post("/api/v1/admin/prompts", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const body = req.body as { profileId?: string; body?: string };
    if (!body.profileId || !body.body) {
      return sendError(reply, req, 400, "VALIDATION", "profileId and body required");
    }
    return ctx.repos.prompts.createVersion(body.profileId, body.body);
  });

  app.get("/api/v1/admin/team", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    return {
      members: await ctx.repos.identity.listByTenant(staff.tenantId),
    };
  });

  app.get("/api/v1/admin/audit", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const items = await ctx.repos.audit.list(staff.tenantId, 100);
    return {
      items: items.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
    };
  });

  app.get("/api/v1/admin/analytics", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const property = await ctx.repos.catalog.getPropertyForTenant(staff.tenantId);
    const tickets = property
      ? await ctx.repos.tickets.listForProperty(property.id, staff.tenantId)
      : [];
    return {
      guestSessions: await ctx.repos.catalog.countGuestSessions(staff.tenantId),
      conversations: await ctx.repos.catalog.countConversations(staff.tenantId),
      tickets: tickets.length,
      completedTickets: tickets.filter((t) => t.status === "completed").length,
    };
  });

  app.post("/api/v1/admin/qr", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const seed = await ctx.repos.catalog.getSeedMeta();
    if (!seed) return sendError(reply, req, 500, "SEED_MISSING", "Seed meta missing");
    const rawToken = generateOpaqueQrToken();
    const created = await ctx.repos.qr.createContext({
      tenantId: staff.tenantId,
      propertyId: seed.propertyId,
      roomId: seed.roomId,
      tokenHash: hashQrToken(rawToken),
      activeFrom: new Date(),
      activeUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
    });
    await ctx.repos.audit.append({
      tenantId: staff.tenantId,
      actorId: staff.userId,
      action: "qr.create",
      entityType: "qr_context",
      entityId: created.id,
    });
    // Raw token returned once — never logged.
    return { id: created.id, path: `/g/${rawToken}`, token: rawToken };
  });

  app.post("/api/v1/admin/qr/:id/revoke", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const { id } = req.params as { id: string };
    const ok = await ctx.repos.qr.revoke(id, staff.tenantId);
    if (!ok) return sendError(reply, req, 404, "QR_NOT_FOUND", "QR not found");
    await ctx.repos.audit.append({
      tenantId: staff.tenantId,
      actorId: staff.userId,
      action: "qr.revoke",
      entityType: "qr_context",
      entityId: id,
    });
    return { revoked: true, id };
  });

  app.post("/api/v1/admin/qr/:id/rotate", async (req, reply) => {
    const ctx = getAppContext();
    const staff = requireAdmin(req);
    if (!staff) return sendError(reply, req, 403, "FORBIDDEN", "Admin only");
    const { id } = req.params as { id: string };
    const rotated = await ctx.repos.qr.rotate(id, staff.tenantId);
    if (!rotated) return sendError(reply, req, 404, "QR_NOT_FOUND", "QR not found or already revoked");
    await ctx.repos.audit.append({
      tenantId: staff.tenantId,
      actorId: staff.userId,
      action: "qr.rotate",
      entityType: "qr_context",
      entityId: rotated.id,
      payload: { previousId: id },
    });
    // Raw token returned once — never logged.
    return { id: rotated.id, path: `/g/${rotated.rawToken}`, token: rotated.rawToken };
  });
}
