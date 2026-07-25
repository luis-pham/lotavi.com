/** Remove Vietnamese diacritics for retrieval normalization. */
export function stripVietnameseDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function normalizeSearchText(input: string): string {
  return stripVietnameseDiacritics(input)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Lightweight synonym expansion for hospitality terms. */
const SYNONYMS: Record<string, string[]> = {
  "ho boi": ["be boi", "swimming pool", "pool"],
  "be boi": ["ho boi", "swimming pool", "pool"],
  pool: ["ho boi", "be boi", "swimming pool"],
  "swimming pool": ["ho boi", "be boi", "pool"],
  wifi: ["wi-fi", "internet", "mang wifi"],
  "wi-fi": ["wifi", "internet"],
  breakfast: ["bua sang", "an sang"],
  "bua sang": ["breakfast", "an sang"],
  spa: ["massage", "cham soc suc khoe"],
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "what",
  "when",
  "where",
  "how",
  "can",
  "may",
  "are",
  "is",
  "was",
  "will",
  "you",
  "your",
  "our",
  "not",
  "cua",
  "voi",
  "cho",
  "cac",
  "mot",
  "nhu",
  "hay",
  "nao",
  "gi",
  "o",
  "va",
  "la",
  "co",
  "khong",
  "toi",
  "minh",
]);

function meaningfulTokens(text: string): string[] {
  // Keep 3-letter hospitality tokens (boi, spa) but drop stopwords.
  return text.split(" ").filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

export function expandSearchTerms(query: string): string[] {
  const normalized = normalizeSearchText(query);
  const terms = new Set<string>([normalized, ...meaningfulTokens(normalized)]);
  for (const [key, values] of Object.entries(SYNONYMS)) {
    if (normalized.includes(key) || key.split(" ").every((w) => normalized.includes(w))) {
      for (const v of values) terms.add(normalizeSearchText(v));
    }
  }
  return [...terms];
}

/** Lexical score for approved knowledge; ignores short/stopword noise. */
export function scoreKnowledgeMatch(hayNormalized: string, terms: string[]): number {
  const hayWords = new Set(meaningfulTokens(hayNormalized));
  let score = 0;
  for (const term of terms) {
    if (!term || term.length < 3) continue;
    if (STOPWORDS.has(term)) continue;
    if (hayNormalized.includes(term) && term.length >= 4) {
      score += term.includes(" ") ? 1 : 0.55;
      continue;
    }
    const words = meaningfulTokens(term);
    if (!words.length) continue;
    const hit = words.filter((w) => hayWords.has(w)).length;
    if (hit) score += (hit / words.length) * 0.75;
    if (hit && term.length >= 4) {
      let shared = 0;
      for (let i = 0; i < term.length - 1; i++) {
        if (hayNormalized.includes(term.slice(i, i + 2))) shared++;
      }
      score += Math.min(0.2, (shared / Math.max(1, term.length - 1)) * 0.2);
    }
  }
  return Math.min(1, score);
}
