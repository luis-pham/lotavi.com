import type { NextConfig } from "next";

const apiOrigin =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

/** Exact Gemini Live origins — no wildcards. Only when direct mode may be used. */
const directAllowed =
  process.env.NODE_ENV !== "production" &&
  (process.env.DIRECT_GEMINI_ENABLED === "true" ||
    process.env.VOICE_TRANSPORT === "direct" ||
    process.env.NEXT_PUBLIC_DIRECT_GEMINI_CSP === "true");

const geminiConnect = directAllowed
  ? " wss://generativelanguage.googleapis.com https://generativelanguage.googleapis.com"
  : "";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} ${apiOrigin.replace(/^http/, "ws")}${geminiConnect}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  transpilePackages: ["@lotiva/ui", "@lotiva/design-tokens", "@lotiva/design-system"],
  trailingSlash: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
