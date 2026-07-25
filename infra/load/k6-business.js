/**
 * Business-path load for text-only pilot.
 * Assumptions: 1–5 properties, 10–50 concurrent guests, voice off.
 *
 * Run: k6 run -e API_URL=http://127.0.0.1:4000 -e QR_TOKEN=... infra/load/k6-business.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: Number(__ENV.VUS || 15),
  duration: __ENV.DURATION || "2m",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500", "p(99)<3000"],
    checks: ["rate>0.99"],
  },
};

const API = __ENV.API_URL || "http://127.0.0.1:4000";
const TOKEN = __ENV.QR_TOKEN || "";

export default function () {
  const health = http.get(`${API}/ready`);
  check(health, { "ready 200": (r) => r.status === 200 });

  if (!TOKEN) {
    sleep(1);
    return;
  }

  const jar = http.cookieJar();
  const session = http.post(
    `${API}/api/v1/guest/sessions/from-qr`,
    JSON.stringify({ token: TOKEN, locale: "vi-VN" }),
    { headers: { "content-type": "application/json" }, jar },
  );
  check(session, { "session ok": (r) => r.status === 200 });

  const chat = http.post(
    `${API}/api/v1/guest/chat`,
    JSON.stringify({ message: "Ho boi o dau?" }),
    { headers: { "content-type": "application/json" }, jar },
  );
  check(chat, {
    "chat 200": (r) => r.status === 200,
    "chat grounded or fallback": (r) => {
      try {
        const j = r.json();
        return Boolean(j.assistantMessage?.content);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
