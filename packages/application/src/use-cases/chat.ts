import {
  classifyGuestIntent,
  expandSearchTerms,
  lowConfidenceFallbackMessage,
  normalizeSearchText,
} from "@lotiva/domain";
import type { ConversationRepository, EmbeddingPort, KnowledgeRepository } from "../ports.js";

const NORMAL_THRESHOLD = 0.15;
const CRITICAL_THRESHOLD = 0.35;

export async function sendGuestChat(deps: {
  conversations: ConversationRepository;
  knowledge: KnowledgeRepository;
  embedding?: EmbeddingPort;
  tenantId: string;
  propertyId: string;
  guestSessionId: string;
  message: string;
  conversationId?: string;
  locale?: string;
}) {
  const conversation = deps.conversationId
    ? { id: deps.conversationId }
    : await deps.conversations.getOrCreate(deps.guestSessionId, deps.tenantId);

  await deps.conversations.addMessage({
    conversationId: conversation.id,
    tenantId: deps.tenantId,
    role: "guest",
    content: deps.message,
    sourceLocale: deps.locale,
  });

  const intent = classifyGuestIntent(deps.message);
  const locale = deps.locale ?? "vi-VN";

  if (intent === "emergency_or_safety") {
    const answer =
      locale.startsWith("vi")
        ? "Nếu đây là tình huống khẩn cấp, vui lòng gọi ngay số khẩn cấp địa phương hoặc liên hệ lễ tân. Mình sẽ đánh dấu để nhân viên hỗ trợ ưu tiên."
        : "If this is an emergency, contact local emergency services or the front desk immediately. I will flag this for priority staff attention.";
    const assistantMsg = await deps.conversations.addMessage({
      conversationId: conversation.id,
      tenantId: deps.tenantId,
      role: "assistant",
      content: answer,
      grounding: { intent, mode: "emergency_escalation" },
      answerConfidence: 1,
      sourceLocale: locale,
    });
    return {
      conversationId: conversation.id,
      intent,
      assistantMessage: {
        id: assistantMsg.id,
        role: "assistant" as const,
        content: answer,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
      sources: [],
      requiresConfirmation: false,
      confidence: 1,
      fallbackReason: null,
    };
  }

  if (intent === "service_request") {
    const answer =
      locale.startsWith("vi")
        ? "Mình hiểu bạn cần hỗ trợ dịch vụ. Vui lòng dùng mục Requests để chuẩn bị yêu cầu, xem tóm tắt, rồi xác nhận trước khi gửi nhân viên."
        : "I understand you need a service. Please use Requests to prepare the request, review the summary, and confirm before it is sent to staff.";
    const assistantMsg = await deps.conversations.addMessage({
      conversationId: conversation.id,
      tenantId: deps.tenantId,
      role: "assistant",
      content: answer,
      grounding: { intent, mode: "service_nudge" },
      answerConfidence: 1,
      sourceLocale: locale,
    });
    return {
      conversationId: conversation.id,
      intent,
      assistantMessage: {
        id: assistantMsg.id,
        role: "assistant" as const,
        content: answer,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
      sources: [],
      requiresConfirmation: true,
      confidence: 1,
      fallbackReason: null,
    };
  }

  const terms = expandSearchTerms(deps.message);
  let queryEmbedding: number[] | undefined;
  if (deps.embedding) {
    try {
      const vectors = await deps.embedding.embed([deps.message]);
      queryEmbedding = vectors[0];
    } catch {
      queryEmbedding = undefined;
    }
  }

  const hits = await deps.knowledge.search({
    tenantId: deps.tenantId,
    propertyId: deps.propertyId,
    query: deps.message,
    limit: 5,
    searchTerms: terms,
    normalizedQuery: normalizeSearchText(deps.message),
    locale,
    queryEmbedding,
  });

  const critical = hits.some((h) => h.criticality === "critical" || h.criticality === "safety");
  const threshold = critical ? CRITICAL_THRESHOLD : NORMAL_THRESHOLD;
  const grounded = hits.filter((h) => h.score >= threshold);
  const confidence = grounded[0]?.score ?? 0;
  const fallbackReason =
    grounded.length === 0 ? (hits.length ? "low_confidence" : "no_evidence") : null;

  // Knowledge text is untrusted data — answer is extractive citation only, never instruction-following.
  const answer =
    grounded.length === 0
      ? lowConfidenceFallbackMessage(locale)
      : locale.startsWith("vi")
        ? `Dựa trên thông tin đã phê duyệt của property:\n\n${grounded
            .map((h, i) => `${i + 1}. ${h.documentTitle}: ${h.content}`)
            .join("\n\n")}`
        : `Based on approved property information:\n\n${grounded
            .map((h, i) => `${i + 1}. ${h.documentTitle}: ${h.content}`)
            .join("\n\n")}`;

  const grounding = {
    retrieved_chunk_ids: grounded.map((h) => h.chunkId),
    retrieval_scores: grounded.map((h) => h.score),
    answer_confidence: confidence,
    fallback_reason: fallbackReason,
    model_provider: "extractive",
    model_version: "grounded-v1",
    // Separated from system instructions — content is data only
    context_role: "untrusted_approved_knowledge",
  };

  const assistantMsg = await deps.conversations.addMessage({
    conversationId: conversation.id,
    tenantId: deps.tenantId,
    role: "assistant",
    content: answer,
    grounding,
    answerConfidence: confidence,
    fallbackReason: fallbackReason ?? undefined,
    sourceLocale: locale,
  });

  return {
    conversationId: conversation.id,
    intent,
    assistantMessage: {
      id: assistantMsg.id,
      role: "assistant" as const,
      content: answer,
      createdAt: assistantMsg.createdAt.toISOString(),
    },
    sources: grounded.map(({ chunkId, documentTitle, content, score }) => ({
      chunkId,
      documentTitle,
      content,
      score,
    })),
    requiresConfirmation: false,
    confidence,
    fallbackReason,
  };
}
