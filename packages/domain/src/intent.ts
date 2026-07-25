export type GuestIntent =
  | "knowledge_question"
  | "service_request"
  | "clarification_required"
  | "unsupported_request"
  | "emergency_or_safety"
  | "human_handoff"
  | "language_switch";

const SERVICE_RE =
  /\b(towel|khan|extra|them|clean|don phong|housekeeping|sua|fix|repair|pillow|goi|nuoc|water|amenit)/i;
const EMERGENCY_RE =
  /\b(emergency|cap cuu|chay|fire|bao chay|police|cong an|ambulance|nguy hiem|danger|help me|cuu toi)\b/i;
const HANDOFF_RE = /\b(staff|nhan vien|nguoi that|human|talk to|gap nhan vien|le tan)\b/i;
const LANG_RE = /\b(switch to|doi sang|change language|tieng anh|english|tieng viet|vietnamese)\b/i;

export function classifyGuestIntent(message: string): GuestIntent {
  const text = message.trim();
  if (!text) return "clarification_required";
  if (EMERGENCY_RE.test(text)) return "emergency_or_safety";
  if (LANG_RE.test(text)) return "language_switch";
  if (HANDOFF_RE.test(text)) return "human_handoff";
  if (SERVICE_RE.test(text)) return "service_request";
  if (text.length < 3) return "clarification_required";
  return "knowledge_question";
}

export function lowConfidenceFallbackMessage(locale: string): string {
  if (locale.startsWith("vi")) {
    return "Mình chưa có đủ thông tin đã được phê duyệt để trả lời chính xác. Bạn có muốn mình chuyển câu hỏi này cho nhân viên không?";
  }
  return "I do not have enough approved information to answer this accurately. I can forward the question to a staff member.";
}
