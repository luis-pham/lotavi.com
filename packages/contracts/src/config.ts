import { z } from "zod";

const boolish = z
  .enum(["true", "false", "1", "0"])
  .default("false")
  .transform((v) => v === "true" || v === "1");

export const LotivaEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production", "staging"]).default("development"),
    LOTIVA_STORE: z.enum(["memory", "postgres"]).default("memory"),
    DATABASE_URL: z.string().optional(),
    REDIS_URL: z.string().default("redis://localhost:6379"),
    API_PORT: z.coerce.number().int().positive().default(4000),
    SESSION_SECRET: z.string().min(32).optional(),
    GUEST_COOKIE_NAME: z.string().default("lotiva_guest"),
    STAFF_COOKIE_NAME: z.string().default("lotiva_staff"),
    EMBEDDING_SERVICE_URL: z.string().url().or(z.string().startsWith("http")).default("http://localhost:8081"),
    EMBEDDING_BACKEND: z.enum(["model", "stub"]).default("stub"),
    EMBEDDING_ALLOW_STUB: boolish,
    EMBEDDING_MODEL_ID: z.string().default("google/embeddinggemma-300m"),
    EMBEDDING_MODEL_PATH: z.string().optional(),
    REQUIRE_REDIS_RATE_LIMIT: boolish,
    GEMINI_API_KEY: z.string().optional(),
    VOICE_ENABLED: boolish,
    VOICE_TRANSPORT: z.enum(["relay", "direct", "off"]).default("off"),
    DIRECT_GEMINI_ENABLED: boolish,
    /** Explicit operator acknowledgement required for staging direct mode */
    DIRECT_GEMINI_STAGING_ACKNOWLEDGED: boolish,
    DIRECT_GEMINI_PROPERTY_ALLOWLIST: z.string().default(""),
    VOICE_WRITE_TOOLS_ENABLED: boolish,
    VOICE_RAG_TOOLS_ENABLED: boolish,
    VOICE_TRANSCRIPT_ENABLED: z
      .enum(["true", "false", "1", "0"])
      .default("true")
      .transform((v) => v === "true" || v === "1"),
    VOICE_AUDIO_RECORDING_ENABLED: boolish,
    VOICE_MAX_SESSION_SECONDS: z.coerce.number().int().positive().default(1800),
    VOICE_MAX_CONCURRENT_PER_PROPERTY: z.coerce.number().int().positive().default(2),
    VOICE_HEARTBEAT_TTL_SECONDS: z.coerce.number().int().positive().default(90),
    VOICE_TEXT_FALLBACK_ENABLED: z
      .enum(["true", "false", "1", "0"])
      .default("true")
      .transform((v) => v === "true" || v === "1"),
    GEMINI_LIVE_MODEL: z.string().default("gemini-2.5-flash-preview-native-audio-dialog"),
    PUBLIC_WEB_URL: z.string().optional(),
    PUBLIC_API_URL: z.string().optional(),
    NEXT_PUBLIC_WEB_URL: z.string().optional(),
    NEXT_PUBLIC_API_URL: z.string().optional(),
    ALLOW_DEMO_SEED: boolish,
    ALLOW_MEMORY_STORE: boolish,
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    PUBLIC_APP_HOST: z.string().default("localhost:3000"),
    LOG_LEVEL: z.string().default("info"),
  })
  .superRefine((env, ctx) => {
    const isProd = env.NODE_ENV === "production";
    const isStaging = env.NODE_ENV === "staging";
    const isProdLike = isProd || isStaging;

    if (isProdLike && env.LOTIVA_STORE === "memory") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LOTIVA_STORE"],
        message:
          "LOTIVA_STORE=memory is forbidden when NODE_ENV is production|staging. Use postgres.",
      });
    }

    if (isProdLike && !env.ALLOW_MEMORY_STORE && env.LOTIVA_STORE !== "postgres") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["LOTIVA_STORE"],
        message: "Production-like environments require LOTIVA_STORE=postgres.",
      });
    }

    if (env.LOTIVA_STORE === "postgres" && !env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DATABASE_URL"],
        message: "DATABASE_URL is required when LOTIVA_STORE=postgres.",
      });
    }

    if (isProdLike && (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be at least 32 characters in staging/production.",
      });
    }

    if (isProdLike && env.ALLOW_DEMO_SEED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ALLOW_DEMO_SEED"],
        message: "ALLOW_DEMO_SEED must be false in staging/production.",
      });
    }

    if (isProdLike && env.VOICE_ENABLED && !env.GEMINI_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["GEMINI_API_KEY"],
        message:
          "VOICE_ENABLED=true requires GEMINI_API_KEY in staging/production. Disable voice or provide the key.",
      });
    }

    // Production: direct Gemini always forbidden
    if (isProd && env.DIRECT_GEMINI_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DIRECT_GEMINI_ENABLED"],
        message: "DIRECT_GEMINI_ENABLED is forbidden in production.",
      });
    }

    if (env.DIRECT_GEMINI_ENABLED && !env.VOICE_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DIRECT_GEMINI_ENABLED"],
        message: "DIRECT_GEMINI_ENABLED requires VOICE_ENABLED=true.",
      });
    }

    if (env.DIRECT_GEMINI_ENABLED && env.VOICE_TRANSPORT !== "direct") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["VOICE_TRANSPORT"],
        message: "DIRECT_GEMINI_ENABLED requires VOICE_TRANSPORT=direct.",
      });
    }

    if (env.VOICE_WRITE_TOOLS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["VOICE_WRITE_TOOLS_ENABLED"],
        message: "VOICE_WRITE_TOOLS_ENABLED must remain false in V1.5 (no write tools).",
      });
    }

    if (env.VOICE_RAG_TOOLS_ENABLED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["VOICE_RAG_TOOLS_ENABLED"],
        message: "VOICE_RAG_TOOLS_ENABLED must remain false in V1.5 (no RAG tools).",
      });
    }

    // Staging direct: all safety conditions required
    if (isStaging && env.DIRECT_GEMINI_ENABLED) {
      if (!env.DIRECT_GEMINI_STAGING_ACKNOWLEDGED) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DIRECT_GEMINI_STAGING_ACKNOWLEDGED"],
          message:
            "Staging direct mode requires DIRECT_GEMINI_STAGING_ACKNOWLEDGED=true (operator acknowledgement).",
        });
      }
      if (!env.DIRECT_GEMINI_PROPERTY_ALLOWLIST.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DIRECT_GEMINI_PROPERTY_ALLOWLIST"],
          message: "Staging direct mode requires a non-empty property allowlist.",
        });
      }
      if (!env.GEMINI_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["GEMINI_API_KEY"],
          message: "Staging direct mode requires GEMINI_API_KEY.",
        });
      }
      const web = env.PUBLIC_WEB_URL || env.NEXT_PUBLIC_WEB_URL || "";
      const api = env.PUBLIC_API_URL || env.NEXT_PUBLIC_API_URL || "";
      if (!web.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PUBLIC_WEB_URL"],
          message: "Staging direct mode requires PUBLIC_WEB_URL (or NEXT_PUBLIC_WEB_URL) https://…",
        });
      }
      if (!api.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["PUBLIC_API_URL"],
          message: "Staging direct mode requires PUBLIC_API_URL (or NEXT_PUBLIC_API_URL) https://…",
        });
      }
    }

    if (isProdLike && env.EMBEDDING_BACKEND === "stub" && !env.EMBEDDING_ALLOW_STUB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMBEDDING_BACKEND"],
        message:
          "EMBEDDING_BACKEND=stub is forbidden in staging/production. Use model or set EMBEDDING_ALLOW_STUB only for emergency break-glass.",
      });
    }

    if (isProdLike && env.EMBEDDING_BACKEND === "model" && !env.EMBEDDING_MODEL_PATH && !env.EMBEDDING_MODEL_ID) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMBEDDING_MODEL_PATH"],
        message: "EMBEDDING_BACKEND=model requires EMBEDDING_MODEL_ID or EMBEDDING_MODEL_PATH.",
      });
    }

    if (isProdLike && !env.REQUIRE_REDIS_RATE_LIMIT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["REQUIRE_REDIS_RATE_LIMIT"],
        message:
          "REQUIRE_REDIS_RATE_LIMIT=true is required in staging/production for multi-replica safety.",
      });
    }
  });

export type LotivaEnv = z.infer<typeof LotivaEnvSchema>;

export function parseLotivaEnv(raw: NodeJS.ProcessEnv = process.env): LotivaEnv {
  const result = LotivaEnvSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid Lotiva configuration:\n${details}`);
  }
  return result.data;
}

/** Exact Gemini Live WSS host for CSP allowlisting (no wildcards). */
export const GEMINI_LIVE_WSS_ORIGIN = "wss://generativelanguage.googleapis.com";
export const GEMINI_LIVE_HTTPS_ORIGIN = "https://generativelanguage.googleapis.com";
