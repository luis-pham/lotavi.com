import type { PortalThemeDraft } from "@lotiva/domain";
import type { TicketStatus } from "@lotiva/domain";

export type TenantContext = {
  tenantId: string;
  propertyId?: string;
  actorType: "guest" | "staff" | "admin" | "platform" | "system";
  actorId?: string;
};

export interface UnitOfWork {
  withTenant<T>(tenantId: string, fn: () => Promise<T>): Promise<T>;
}

export type QrResolveResult = {
  qrContextId: string;
  tenantId: string;
  propertyId: string;
  roomId: string;
  roomLabel: string;
  stayContextId: string | null;
};

export interface QrRepository {
  resolveByToken(token: string): Promise<QrResolveResult | null>;
  createContext(input: {
    tenantId: string;
    propertyId: string;
    roomId: string;
    tokenHash: string;
    activeFrom: Date;
    activeUntil: Date | null;
  }): Promise<{ id: string; rawToken: string }>;
  revoke(id: string, tenantId: string): Promise<boolean>;
  /** Issue a new token for the same room; revokes the previous context. Returns raw token once. */
  rotate(id: string, tenantId: string): Promise<{ id: string; rawToken: string } | null>;
  isActive(id: string, tenantId: string): Promise<boolean>;
}

export interface GuestSessionRepository {
  create(input: {
    tenantId: string;
    propertyId: string;
    qrContextId: string;
    roomId: string;
    locale: string;
    themeVersionId: string | null;
    expiresAt: Date;
  }): Promise<{ id: string }>;
  get(id: string): Promise<{
    id: string;
    tenantId: string;
    propertyId: string;
    roomId: string;
    qrContextId: string;
    locale: string;
    themeVersionId: string | null;
    expiresAt: Date;
  } | null>;
  setLocale(id: string, locale: string): Promise<void>;
}

export interface ThemeRepository {
  getPublished(propertyId: string): Promise<(PortalThemeDraft & { versionId: string }) | null>;
  getDraft(propertyId: string): Promise<(PortalThemeDraft & { versionId: string }) | null>;
  saveDraft(propertyId: string, tenantId: string, draft: PortalThemeDraft): Promise<{ versionId: string }>;
  publish(propertyId: string, tenantId: string, versionId: string): Promise<{ publicationId: string }>;
  rollback(propertyId: string, tenantId: string, versionId: string): Promise<{ publicationId: string }>;
}

export type KnowledgeHit = {
  chunkId: string;
  documentId?: string;
  documentTitle: string;
  content: string;
  score: number;
  denseScore?: number;
  ftsScore?: number;
  trigramScore?: number;
  criticality?: string;
};

export interface KnowledgeRepository {
  search(input: {
    tenantId: string;
    propertyId: string;
    query: string;
    limit: number;
    searchTerms?: string[];
    normalizedQuery?: string;
    locale?: string;
    queryEmbedding?: number[];
  }): Promise<KnowledgeHit[]>;
}

export interface ConversationRepository {
  getOrCreate(guestSessionId: string, tenantId: string): Promise<{ id: string }>;
  addMessage(input: {
    conversationId: string;
    tenantId: string;
    role: "guest" | "assistant" | "system";
    content: string;
    grounding?: Record<string, unknown>;
    answerConfidence?: number;
    fallbackReason?: string;
    sourceLocale?: string;
  }): Promise<{ id: string; createdAt: Date }>;
  listMessages(conversationId: string, tenantId: string): Promise<
    Array<{ id: string; role: "guest" | "assistant" | "system"; content: string; createdAt: Date }>
  >;
}

export interface PendingActionRepository {
  create(input: {
    tenantId: string;
    guestSessionId: string;
    category: string;
    description: string;
    department: string | null;
    expiresAt: Date;
  }): Promise<{ id: string }>;
  get(id: string, tenantId: string): Promise<{
    id: string;
    guestSessionId: string;
    category: string;
    description: string;
    department: string | null;
    status: "pending" | "confirmed" | "cancelled" | "expired";
    expiresAt: Date;
  } | null>;
  mark(id: string, tenantId: string, status: "confirmed" | "cancelled"): Promise<void>;
}

export interface TicketRepository {
  create(input: {
    tenantId: string;
    propertyId: string;
    guestSessionId: string;
    roomId: string;
    category: string;
    description: string;
    department: string | null;
    idempotencyKey: string;
  }): Promise<{ id: string; created: boolean }>;
  listForProperty(propertyId: string, tenantId: string): Promise<
    Array<{
      id: string;
      status: TicketStatus;
      category: string;
      description: string;
      department: string | null;
      createdAt: Date;
      guestSessionId: string;
    }>
  >;
  listForGuestSession(guestSessionId: string, tenantId: string): Promise<
    Array<{
      id: string;
      status: TicketStatus;
      category: string;
      description: string;
      department: string | null;
      createdAt: Date;
    }>
  >;
  updateStatus(id: string, tenantId: string, status: TicketStatus): Promise<void>;
  /**
   * Atomic status change with optimistic concurrency + immutable transition row.
   * Throws CONCURRENCY_CONFLICT when expectedVersion mismatches.
   */
  transition(input: {
    id: string;
    tenantId: string;
    fromStatus: TicketStatus;
    toStatus: TicketStatus;
    expectedVersion: number;
    actorId?: string | null;
    actorType: "guest" | "staff" | "system";
    reason?: string;
    correlationId?: string;
  }): Promise<{ version: number }>;
  get(id: string, tenantId: string): Promise<{
    id: string;
    status: TicketStatus;
    category: string;
    description: string;
    guestSessionId: string;
    version: number;
  } | null>;
}

export interface IdentityRepository {
  findByEmail(email: string): Promise<{
    id: string;
    tenantId: string | null;
    email: string;
    passwordHash: string;
    displayName: string;
    role: string;
  } | null>;
  findById(id: string): Promise<{
    id: string;
    tenantId: string | null;
    email: string;
    passwordHash: string;
    displayName: string;
    role: string;
  } | null>;
  listByTenant(tenantId: string): Promise<
    Array<{ id: string; email: string; displayName: string; role: string }>
  >;
}

export interface CatalogRepository {
  getSeedMeta(): Promise<{
    guestQrToken?: string;
    tokenHash?: string;
    tenantId: string;
    propertyId: string;
    roomId: string;
  } | null>;
  getPropertyForTenant(tenantId: string): Promise<{ id: string; name: string; tenantId: string } | null>;
  getRoom(roomId: string, tenantId: string): Promise<{ id: string; label: string } | null>;
  countGuestSessions(tenantId: string): Promise<number>;
  countConversations(tenantId: string): Promise<number>;
}

export interface KnowledgeAdminRepository {
  listDocuments(tenantId: string): Promise<
    Array<{ id: string; title: string; status: string; propertyId: string }>
  >;
  listChunks(tenantId: string): Promise<
    Array<{ id: string; documentId: string; content: string; propertyId: string }>
  >;
  publishDocument(input: {
    tenantId: string;
    propertyId: string;
    title: string;
    content: string;
    locale?: string;
    criticality?: string;
    embedding?: number[];
    embeddingModel?: string;
    embeddingModelVersion?: string;
  }): Promise<{ id: string; chunkId: string; embedded: boolean }>;
}

export interface PasswordResetRepository {
  createToken(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    requestIp?: string | null;
  }): Promise<{ id: string }>;
  consumeToken(tokenHash: string): Promise<{ userId: string } | null>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}

export interface TicketOutboxRepository {
  append(input: {
    tenantId: string;
    propertyId: string;
    ticketId: string;
    eventType: string;
    status: string;
    payload?: Record<string, unknown>;
  }): Promise<{ id: number }>;
  listSince(propertyId: string, tenantId: string, afterId: number, limit?: number): Promise<
    Array<{
      id: number;
      ticketId: string;
      eventType: string;
      status: string;
      propertyId: string;
      createdAt: Date;
    }>
  >;
}

export interface AuditRepository {
  append(input: {
    tenantId: string | null;
    actorId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    payload?: Record<string, unknown>;
  }): Promise<void>;
  list(tenantId: string, limit?: number): Promise<
    Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      payload: Record<string, unknown>;
      createdAt: Date;
      actorId: string | null;
    }>
  >;
}

export interface PromptRepository {
  listProfiles(): Promise<
    Array<{ id: string; name: string; scope: string; tenantId: string | null; propertyId: string | null }>
  >;
  listVersions(): Promise<
    Array<{ id: string; profileId: string; version: number; body: string; status: string }>
  >;
  createVersion(profileId: string, body: string): Promise<{ id: string; version: number }>;
}

export type LotivaRepos = {
  qr: QrRepository;
  sessions: GuestSessionRepository;
  themes: ThemeRepository;
  knowledge: KnowledgeRepository;
  conversations: ConversationRepository;
  pending: PendingActionRepository;
  tickets: TicketRepository;
  schedules: ScheduleRepository;
  announcements: AnnouncementRepository;
  identity: IdentityRepository;
  catalog: CatalogRepository;
  knowledgeAdmin: KnowledgeAdminRepository;
  audit: AuditRepository;
  prompts: PromptRepository;
  passwordReset: PasswordResetRepository;
  ticketOutbox: TicketOutboxRepository;
};

export interface ScheduleRepository {
  listActive(propertyId: string, tenantId: string): Promise<
    Array<{ id: string; title: string; startsAt: Date; endsAt: Date | null; location: string | null }>
  >;
}

export interface AnnouncementRepository {
  listActive(propertyId: string, tenantId: string): Promise<
    Array<{ id: string; title: string; body: string; publishedAt: Date }>
  >;
}

export interface EmbeddingPort {
  embed(texts: string[]): Promise<number[][]>;
  embedWithMeta?(texts: string[]): Promise<{
    embeddings: number[][];
    model: string;
    modelVersion: string;
    dimensions: number;
  }>;
}

export interface VoiceProviderPort {
  connect(sessionId: string, config: Record<string, unknown>): Promise<void>;
  sendAudio(sessionId: string, chunk: Buffer): Promise<void>;
  close(sessionId: string): Promise<void>;
}
