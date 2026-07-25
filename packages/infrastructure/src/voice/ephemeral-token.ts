/**
 * Server-side Gemini Live ephemeral token minting (V1.5).
 * Uses REST AuthTokens API — long-lived GEMINI_API_KEY never leaves the server.
 * No write tools / RAG tools are included in liveConnectConstraints.
 *
 * Provider docs (verified 2026-07-26):
 * - https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 * - https://ai.google.dev/api/live
 */

export type EphemeralTokenResult = {
  /** Token name/value for client Live connect (treat as secret; short-lived). */
  token: string;
  expireTime: string;
  newSessionExpireTime: string;
  model: string;
  providerEndpoint: string;
  apiVersion: "v1alpha";
  responseModalities: ["AUDIO"];
  transcription: { input: true; output: true };
};

export type MintEphemeralInput = {
  apiKey: string;
  model: string;
  /** System instruction locked server-side (no tools). */
  systemInstruction?: string;
  expireMinutes?: number;
  newSessionExpireSeconds?: number;
};

const PROVIDER_ENDPOINT =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained";

/**
 * Mint a one-use ephemeral token locked to AUDIO response modality and no tools.
 * Proven restrictions via AuthTokens API: uses, expireTime, newSessionExpireTime,
 * liveConnectConstraints.model + config.responseModalities (+ optional systemInstruction,
 * empty transcription configs). Client cannot choose tools/model/key.
 */
export async function mintGeminiLiveEphemeralToken(
  input: MintEphemeralInput,
): Promise<EphemeralTokenResult> {
  const expireMinutes = input.expireMinutes ?? 30;
  const newSessionExpireSeconds = input.newSessionExpireSeconds ?? 60;
  const expireTime = new Date(Date.now() + expireMinutes * 60_000).toISOString();
  const newSessionExpireTime = new Date(
    Date.now() + newSessionExpireSeconds * 1000,
  ).toISOString();

  const modelPath = input.model.startsWith("models/")
    ? input.model
    : `models/${input.model}`;

  const body: Record<string, unknown> = {
    uses: 1,
    expireTime,
    newSessionExpireTime,
    liveConnectConstraints: {
      model: modelPath,
      config: {
        responseModalities: ["AUDIO"],
        // Empty objects enable transcription; no client override of tools.
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        ...(input.systemInstruction
          ? {
              systemInstruction: {
                parts: [{ text: input.systemInstruction }],
              },
            }
          : {}),
      },
    },
  };

  // Constrained ephemeral Live tokens require v1alpha AuthTokens + Constrained WS.
  const res = await fetch("https://generativelanguage.googleapis.com/v1alpha/auth_tokens", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": input.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(new Error(`ephemeral token mint failed (${res.status})`), {
      code: "EPHEMERAL_MINT_FAILED",
      status: res.status,
      // Keep short; never echo request key. Avoid logging this detail with token-like strings.
      detail: text.slice(0, 200).replace(/auth_tokens?\/[A-Za-z0-9._-]+/gi, "[redacted]"),
    });
  }

  const data = (await res.json()) as { name?: string; expireTime?: string };
  if (!data.name) {
    throw Object.assign(new Error("ephemeral token response missing name"), {
      code: "EPHEMERAL_MINT_INVALID",
    });
  }

  return {
    token: data.name,
    expireTime: data.expireTime ?? expireTime,
    newSessionExpireTime,
    model: input.model.replace(/^models\//, ""),
    apiVersion: "v1alpha",
    providerEndpoint: PROVIDER_ENDPOINT,
    responseModalities: ["AUDIO"],
    transcription: { input: true, output: true },
  };
}

/** Build browser WS URL. Token goes in query only for Gemini Constrained path (provider requirement). */
export function buildGeminiLiveWsUrl(token: string): string {
  return `${PROVIDER_ENDPOINT}?access_token=${encodeURIComponent(token)}`;
}

export function propertyAllowlisted(allowlistCsv: string, propertyId: string): boolean {
  const ids = allowlistCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!ids.length) return false;
  return ids.includes(propertyId);
}
