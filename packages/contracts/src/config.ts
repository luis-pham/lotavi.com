import { z } from "zod";

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
    EMBEDDING_ALLOW_STUB: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    EMBEDDING_MODEL_ID: z.string().default("google/embeddinggemma-300m"),
    EMBEDDING_MODEL_PATH: z.string().optional(),
    REQUIRE_REDIS_RATE_LIMIT: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    GEMINI_API_KEY: z.string().optional(),
    VOICE_ENABLED: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    ALLOW_DEMO_SEED: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    ALLOW_MEMORY_STORE: z
      .enum(["true", "false", "1", "0"])
      .default("false")
      .transform((v) => v === "true" || v === "1"),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    PUBLIC_APP_HOST: z.string().default("localhost:3000"),
    LOG_LEVEL: z.string().default("info"),
  })
  .superRefine((env, ctx) => {
    const isProdLike = env.NODE_ENV === "production" || env.NODE_ENV === "staging";

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
