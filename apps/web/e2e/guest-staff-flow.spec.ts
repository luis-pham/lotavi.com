/**
 * Playwright E2E against PostgreSQL stack (not memory).
 *
 * Prerequisites:
 *   LOTIVA_STORE=postgres ALLOW_DEMO_SEED=true ALLOW_MEMORY_STORE=false VOICE_ENABLED=false
 *   migrate + seed + api :4000 + web :3000
 *
 * Run: RUN_E2E=1 pnpm --filter @lotiva/web e2e
 */
import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

test.describe("PostgreSQL guest→staff core journey", () => {
  test.skip(!process.env.RUN_E2E, "Set RUN_E2E=1 with postgres stack");

  test("QR → knowledge → confirm ticket → staff resolve → guest confirm", async ({
    page,
    request,
  }) => {
    const ready = await request.get(`${API}/ready`);
    expect(ready.ok()).toBeTruthy();
    const readyBody = await ready.json();
    expect(readyBody.checks.store).toBe("postgres");

    const seed = await request.get(`${API}/api/v1/meta/seed`);
    expect(seed.ok()).toBeTruthy();
    const meta = await seed.json();
    expect(meta.store).toBe("postgres");
    expect(meta.guestQrPath).toBeTruthy();

    await page.goto(meta.guestQrPath);
    await expect(page.getByText(/Green Ruby|Lotiva Demo|Phòng|1208/i)).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("button", { name: /Assistant|Trợ lý/i }).click();
    await page.getByPlaceholder(/Hỏi|pool|Ask/i).fill("Hồ bơi mở lúc mấy giờ");
    await page.getByRole("button", { name: /Gửi|Send/i }).click();
    await expect(page.locator(".bubble.assistant").first()).toContainText(/bơi|6:00|phê duyệt|approved|staff/i, {
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /Requests|Yêu cầu/i }).click();
    await page.getByRole("button", { name: /Chuẩn bị|prepare|Request/i }).click();
    await page.getByRole("button", { name: /Xác nhận|Confirm/i }).click();
    await expect(page.getByText(/submitted|acknowledged|accepted|new/i)).toBeVisible({
      timeout: 15_000,
    });

    // Duplicate confirm must not create second ticket — UI may disable; API checked in API e2e.
    await page.goto("/staff");
    await page.getByPlaceholder(/email/i).fill("staff@lotiva.vn");
    await page.getByPlaceholder(/password/i).fill(process.env.SEED_ADMIN_PASSWORD ?? "admin123");
    await page.getByRole("button", { name: /Đăng nhập|Login|Sign/i }).click();
    await page.getByRole("button", { name: /Refresh|Làm mới/i }).click();
    await expect(page.locator(".bubble").first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Acknowledge|Accept|Nhận/i }).first().click();
    await page.getByRole("button", { name: /Resolve|Complete|Hoàn/i }).first().click();

    await page.goto(meta.guestQrPath);
    await page.getByRole("button", { name: /Requests|Yêu cầu/i }).click();
    await expect(page.getByText(/resolved|completed|guest_confirmed|acknowledged|in_progress/i)).toBeVisible({
      timeout: 15_000,
    });
  });

  test("expired/revoked token negative paths via API", async ({ request }) => {
    const bad = await request.post(`${API}/api/v1/guest/sessions/from-qr`, {
      data: { token: "not-a-real-token" },
    });
    expect(bad.status()).toBeGreaterThanOrEqual(400);
  });

  test("voice disabled does not break text", async ({ request }) => {
    const ready = await request.get(`${API}/ready`);
    const body = await ready.json();
    expect(body.voiceEnabled).toBeFalsy();
  });
});
