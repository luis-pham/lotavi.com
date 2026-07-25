import type { EmbeddingPort } from "@lotiva/application";

const DIMS = 768;

/**
 * Embedding client for self-hosted embedding-service.
 * Pseudo-vectors are ONLY allowed when store=memory (explicit local/dev).
 * Production/postgres must not silently invent embeddings.
 */
export class EmbeddingClient implements EmbeddingPort {
  constructor(
    private readonly baseUrl = process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8081",
    private readonly store: string = process.env.LOTIVA_STORE ?? "memory",
  ) {}

  async embed(texts: string[]): Promise<number[][]> {
    const meta = await this.embedWithMeta(texts);
    return meta.embeddings;
  }

  async embedWithMeta(texts: string[]): Promise<{
    embeddings: number[][];
    model: string;
    modelVersion: string;
    dimensions: number;
  }> {
    if (!texts.length) throw new Error("empty embedding input");
    if (this.store === "memory") {
      return {
        embeddings: texts.map((t) => pseudoEmbed(t)),
        model: "memory-pseudo",
        modelVersion: "memory-v1",
        dimensions: DIMS,
      };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(process.env.EMBEDDING_TIMEOUT_MS ?? 30000));
    try {
      const res = await fetch(`${this.baseUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texts }),
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`embedding service failed with status ${res.status}`);
      }
      const data = (await res.json()) as {
        embeddings: number[][];
        model?: string;
        model_version?: string;
        dimensions?: number;
      };
      if (!data.embeddings?.length) {
        throw new Error("embedding service returned empty embeddings");
      }
      for (const v of data.embeddings) {
        if (v.length !== DIMS) {
          throw new Error(`wrong embedding dimension ${v.length}`);
        }
      }
      return {
        embeddings: data.embeddings,
        model: data.model ?? "unknown",
        modelVersion: data.model_version ?? "unknown",
        dimensions: data.dimensions ?? DIMS,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

function pseudoEmbed(text: string, dims = DIMS): number[] {
  const out = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i++) {
    out[i % dims]! += (text.charCodeAt(i) % 31) / 31;
  }
  const norm = Math.sqrt(out.reduce((s, v) => s + v * v, 0)) || 1;
  return out.map((v) => v / norm);
}
