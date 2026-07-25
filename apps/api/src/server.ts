import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { initAppContext, getAppContext, getConfig } from "./app-context.js";
import { isDevLike, loadConfig } from "./config.js";
import { registerObservability } from "./plugins/observability.js";
import { registerAuthRoutes } from "./routes/auth.js";
import { registerGuestRoutes } from "./routes/guest.js";
import { registerStaffRoutes } from "./routes/staff.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerVoiceRoutes } from "./routes/voice.js";
import { registerRealtimeRoutes } from "./routes/realtime.js";

async function main() {
  const env = loadConfig();
  const ctx = await initAppContext();

  // logger:false avoids Fastify→pino→thread-stream resolution failures under pnpm.
  // Structured request logs / metrics come from registerObservability.
  const app = Fastify({
    logger: false,
    bodyLimit: 1_048_576,
  });

  const origins = env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
  await app.register(cors, {
    origin: origins.length ? origins : false,
    credentials: true,
  });
  await app.register(cookie, {
    secret: env.SESSION_SECRET ?? "dev-only-insecure-session-secret-32b",
    hook: "onRequest",
  });
  await app.register(websocket);

  await registerObservability(app);
  await registerAuthRoutes(app);
  await registerGuestRoutes(app);
  await registerStaffRoutes(app);
  await registerAdminRoutes(app);
  await registerVoiceRoutes(app);
  await registerRealtimeRoutes(app);

  // Seed meta is development/demo only — never in staging/production.
  if (isDevLike(env) && env.ALLOW_DEMO_SEED) {
    app.get("/api/v1/meta/seed", async (_req, reply) => {
      const current = getAppContext();
      const seed = await current.repos.catalog.getSeedMeta();
      return reply.send({
        store: current.store,
        guestQrPath: seed?.guestQrToken ? `/g/${seed.guestQrToken}` : null,
        // raw token only when ALLOW_DEMO_SEED
        guestQrToken: seed?.guestQrToken ?? null,
        adminEmail: "admin@lotiva.vn",
        staffEmail: "staff@lotiva.vn",
        note: "DEV ONLY — disabled unless ALLOW_DEMO_SEED=true",
      });
    });
  }

  const port = env.API_PORT;
  await app.listen({ port, host: "0.0.0.0" });
  console.log(
    JSON.stringify({
      msg: "Lotiva API listening",
      port,
      store: ctx.store,
      nodeEnv: env.NODE_ENV,
      voiceEnabled: ctx.voiceEnabled,
      logLevel: env.LOG_LEVEL,
    }),
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
