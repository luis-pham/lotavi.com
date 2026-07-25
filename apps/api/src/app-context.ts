import type { LotivaRepos } from "@lotiva/application";
import { hashPassword as scryptHash, verifyPassword } from "@lotiva/domain";
import {
  createMemoryDb,
  createMemoryRepos,
  createPostgresRepos,
  createRateLimiter,
  GeminiLiveAdapter,
  EmbeddingClient,
  pingPostgres,
  type MemoryDb,
  type RateLimiter,
} from "@lotiva/infrastructure";
import { getConfig, loadConfig } from "./config.js";

export type AppContext = {
  store: "memory" | "postgres";
  memory: MemoryDb | null;
  repos: LotivaRepos;
  voice: GeminiLiveAdapter;
  embedding: EmbeddingClient;
  rateLimit: RateLimiter;
  hashPassword(password: string): string;
  verifyPassword(password: string, encoded: string): boolean;
  voiceEnabled: boolean;
};

let singleton: AppContext | null = null;
let initPromise: Promise<AppContext> | null = null;

export async function initAppContext(): Promise<AppContext> {
  if (singleton) return singleton;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const env = loadConfig();

    if (env.LOTIVA_STORE === "memory") {
      if (!env.ALLOW_MEMORY_STORE && env.NODE_ENV !== "test") {
        throw new Error(
          "LOTIVA_STORE=memory requires ALLOW_MEMORY_STORE=true (development/test only).",
        );
      }
      process.env.LOTIVA_STORE = "memory";
      const memory = createMemoryDb();
      const rateLimit = await createRateLimiter({
        redisUrl: env.REDIS_URL,
        requireRedis: false,
        capacity: 30,
        windowMs: 60_000,
        store: "memory",
      });
      singleton = {
        store: "memory",
        memory,
        repos: createMemoryRepos(memory),
        voice: new GeminiLiveAdapter(env.GEMINI_API_KEY, env.VOICE_ENABLED),
        embedding: new EmbeddingClient(env.EMBEDDING_SERVICE_URL, env.LOTIVA_STORE),
        rateLimit,
        hashPassword: scryptHash,
        verifyPassword,
        voiceEnabled: env.VOICE_ENABLED,
      };
      return singleton;
    }

    const ok = await pingPostgres();
    if (!ok) {
      throw new Error(
        `LOTIVA_STORE=postgres but DATABASE_URL is unreachable (${env.DATABASE_URL}). Refusing to start.`,
      );
    }

    const requireRedis =
      env.REQUIRE_REDIS_RATE_LIMIT ||
      env.NODE_ENV === "production" ||
      env.NODE_ENV === "staging";

    const rateLimit = await createRateLimiter({
      redisUrl: env.REDIS_URL,
      requireRedis,
      capacity: 60,
      windowMs: 60_000,
      store: "postgres",
    });

    if (requireRedis && rateLimit.backend === "fail-closed") {
      console.warn(
        JSON.stringify({
          msg: "Redis rate limiter unavailable — fail-closed active for sensitive routes",
          redisUrl: env.REDIS_URL.replace(/:[^:@/]+@/, ":***@"),
        }),
      );
    }

    singleton = {
      store: "postgres",
      memory: null,
      repos: createPostgresRepos(),
      voice: new GeminiLiveAdapter(env.GEMINI_API_KEY, env.VOICE_ENABLED),
      embedding: new EmbeddingClient(env.EMBEDDING_SERVICE_URL, env.LOTIVA_STORE),
      rateLimit,
      hashPassword: scryptHash,
      verifyPassword,
      voiceEnabled: env.VOICE_ENABLED,
    };
    return singleton;
  })();

  return initPromise;
}

export function getAppContext(): AppContext {
  if (!singleton) {
    throw new Error("AppContext not initialized — call await initAppContext() first");
  }
  return singleton;
}

export function resetAppContextForTests(): void {
  singleton = null;
  initPromise = null;
}

export { getConfig };
