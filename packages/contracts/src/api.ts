import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  service: z.string(),
  version: z.string(),
});

export const GuestSessionResponseSchema = z.object({
  sessionId: z.string().uuid(),
  propertyId: z.string().uuid(),
  roomLabel: z.string(),
  locale: z.string(),
  themeVersionId: z.string().uuid().nullable(),
  expiresAt: z.string().datetime(),
});

export const ThemeTokensSchema = z.object({
  brandName: z.string(),
  primaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  fontFamily: z.string(),
  logoUrl: z.string().url().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  assistantName: z.string(),
  borderRadius: z.string(),
});

export type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export const ChatMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["guest", "assistant", "system"]),
  content: z.string(),
  createdAt: z.string().datetime(),
});

export const SendChatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
});

export const TicketStatusSchema = z.enum([
  "new",
  "accepted",
  "in_progress",
  "needs_info",
  "completed",
  "cancelled",
  "reopened",
]);

export const PrepareTicketRequestSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1).max(4000),
  department: z.string().optional(),
});

export const ConfirmTicketRequestSchema = z.object({
  pendingActionId: z.string().uuid(),
  confirmed: z.boolean(),
  idempotencyKey: z.string().min(8).max(128),
});

export const KnowledgeSearchRequestSchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(20).default(5),
});
