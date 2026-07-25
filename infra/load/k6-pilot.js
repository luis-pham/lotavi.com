/**
 * Pilot load assumptions (document in observability.md):
 * - 5 active properties
 * - ~50 concurrent guest sessions
 * - chat-heavy, limited voice
 *
 * Run: k6 run infra/load/k6-pilot.js
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 20,
  duration: "1m",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800", "p(99)<1500"],
  },
};

const API = __ENV.API_URL || "http://127.0.0.1:4000";

export default function () {
  const health = http.get(`${API}/health`);
  check(health, { "health 200": (r) => r.status === 200 });
  const ready = http.get(`${API}/ready`);
  check(ready, { "ready ok-ish": (r) => r.status === 200 || r.status === 503 });
  sleep(1);
}
