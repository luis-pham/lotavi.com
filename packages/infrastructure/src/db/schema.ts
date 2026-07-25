import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    vertical: text("vertical").notNull().default("hotel"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("properties_tenant_idx").on(t.tenantId)],
);

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rooms_property_idx").on(t.propertyId)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_tenant_idx").on(t.tenantId)],
);

export const qrContexts = pgTable(
  "qr_contexts",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    tokenHash: text("token_hash").notNull(),
    activeFrom: timestamp("active_from", { withTimezone: true }).notNull(),
    activeUntil: timestamp("active_until", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedFrom: uuid("rotated_from"),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("qr_token_hash_uidx").on(t.tokenHash),
    index("qr_property_idx").on(t.propertyId),
  ],
);

export const guestSessions = pgTable(
  "guest_sessions",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    qrContextId: uuid("qr_context_id")
      .notNull()
      .references(() => qrContexts.id),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    locale: text("locale").notNull(),
    localeSelected: text("locale_selected"),
    themeVersionId: uuid("theme_version_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("guest_sessions_tenant_idx").on(t.tenantId)],
);

export const portalThemeVersions = pgTable(
  "portal_theme_versions",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    status: text("status").notNull(), // draft | published_immutable
    tokens: jsonb("tokens").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("theme_versions_property_idx").on(t.propertyId)],
);

export const portalThemePublications = pgTable(
  "portal_theme_publications",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    versionId: uuid("version_id")
      .notNull()
      .references(() => portalThemeVersions.id),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("theme_pub_property_idx").on(t.propertyId)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  guestSessionId: uuid("guest_session_id")
    .notNull()
    .references(() => guestSessions.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id),
    role: text("role").notNull(),
    content: text("content").notNull(),
    sourceLocale: text("source_locale"),
    translatedContent: text("translated_content"),
    translationProvider: text("translation_provider"),
    translationStatus: text("translation_status"),
    grounding: jsonb("grounding"),
    fallbackReason: text("fallback_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId)],
);

export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  title: text("title").notNull(),
  titleNormalized: text("title_normalized"),
  status: text("status").notNull().default("draft"),
  locale: text("locale"),
  criticality: text("criticality").default("normal"),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const knowledgeChunks = pgTable(
  "knowledge_chunks",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    documentId: uuid("document_id")
      .notNull()
      .references(() => knowledgeDocuments.id),
    content: text("content").notNull(),
    contentNormalized: text("content_normalized"),
    contentHash: text("content_hash"),
    embeddingModel: text("embedding_model"),
    embeddingModelVersion: text("embedding_model_version"),
    embeddingDimension: integer("embedding_dimension"),
    embeddedAt: timestamp("embedded_at", { withTimezone: true }),
    locale: text("locale"),
    criticality: text("criticality").default("normal"),
    // embedding column is vector|jsonb managed in SQL migrations — use raw SQL for writes
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("chunks_property_idx").on(t.propertyId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  requestIp: text("request_ip"),
  userAgent: text("user_agent"),
});

export const staffSessions = pgTable("staff_sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tenantId: uuid("tenant_id"),
  role: text("role").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  title: text("title").notNull(),
  location: text("location"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const pendingActions = pgTable("pending_actions", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  guestSessionId: uuid("guest_session_id")
    .notNull()
    .references(() => guestSessions.id),
  category: text("category").notNull(),
  description: text("description").notNull(),
  department: text("department"),
  status: text("status").notNull().default("pending"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id),
    guestSessionId: uuid("guest_session_id")
      .notNull()
      .references(() => guestSessions.id),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    category: text("category").notNull(),
    description: text("description").notNull(),
    department: text("department"),
    status: text("status").notNull().default("submitted"),
    version: integer("version").notNull().default(1),
    guestConfirmedAt: timestamp("guest_confirmed_at", { withTimezone: true }),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tickets_idem_uidx").on(t.tenantId, t.idempotencyKey),
    index("tickets_property_idx").on(t.propertyId),
  ],
);

export const ticketEvents = pgTable("ticket_events", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id),
  eventType: text("event_type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const ticketTransitions = pgTable(
  "ticket_transitions",
  {
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => tickets.id),
    fromStatus: text("from_status").notNull(),
    toStatus: text("to_status").notNull(),
    actorId: uuid("actor_id"),
    actorType: text("actor_type").notNull(),
    reason: text("reason"),
    correlationId: text("correlation_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("ticket_transitions_ticket_idx").on(t.ticketId)],
);

export const ticketOutboxEvents = pgTable("ticket_outbox_events", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id),
  eventType: text("event_type").notNull(),
  status: text("status").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voiceSessions = pgTable("voice_sessions", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id),
  provider: text("provider").notNull().default("gemini_live"),
  status: text("status").notNull().default("initializing"),
  revision: integer("revision").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
});

export const promptProfiles = pgTable("prompt_profiles", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id),
  propertyId: uuid("property_id").references(() => properties.id),
  name: text("name").notNull(),
  scope: text("scope").notNull(), // platform | tenant | property
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const promptVersions = pgTable("prompt_versions", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => promptProfiles.id),
  version: integer("version").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey(),
  tenantId: uuid("tenant_id"),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  payload: jsonb("payload").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appMeta = pgTable("app_meta", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
