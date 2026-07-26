/**
 * Phase 0 console + guest workflow.
 * Prerequisites: postgres stack + RUN_E2E=1
 */
import { test, expect } from "@playwright/test";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:4000";

test.describe("Phase 0 UX-literal workflows", () => {
  test.skip(!process.env.RUN_E2E, "Set RUN_E2E=1 with postgres stack");

  test("admin shell navigation and requests board/list", async ({ page, request }) => {
    const ready = await request.get(`${API}/ready`);
    expect(ready.ok()).toBeTruthy();

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin");
    await page.getByLabel(/email/i).fill("admin@lotiva.vn");
    await page.locator('input[type="password"]').fill(process.env.SEED_ADMIN_PASSWORD ?? "admin123");
    await page.getByRole("button", { name: /sign in|đăng nhập/i }).click();
    await expect(page).toHaveURL(/\/admin\/overview/);
    await expect(page.getByRole("heading", { name: /overview/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: /guest requests|requests/i }).first().click();
    await expect(page).toHaveURL(/\/admin\/requests/);
    await page.getByRole("button", { name: /^Board$/i }).click();
    await page.getByRole("button", { name: /^List$/i }).click();

    for (const label of [/guests/i, /cabins/i, /journeys/i, /announcements/i, /qr/i, /departments/i, /settings/i]) {
      await page.getByRole("link", { name: label }).first().click();
      await expect(page.locator(".console-page-header h1")).toBeVisible();
    }
  });

  test("staff my work after guest request", async ({ page, request }) => {
    const seed = await request.get(`${API}/api/v1/meta/seed`);
    test.skip(!seed.ok(), "seed meta endpoint unavailable");
    const meta = await seed.json();

    await page.goto(meta.guestQrPath);
    await expect(page.getByText(/Cabin|Phòng|1208/i)).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: /^Requests$/i }).click();
    const category = page.getByRole("button", { name: /Housekeeping|Front desk/i }).first();
    if (await category.isVisible()) await category.click();
    await page.getByPlaceholder(/Describe|mô tả/i).fill("Extra towels please");
    await page.getByRole("button", { name: /Review request|Chuẩn bị/i }).click();
    await page.getByRole("button", { name: /^Confirm$|Xác nhận/i }).click();
    await expect(page.getByText(/New|submitted|Request sent/i)).toBeVisible({ timeout: 15_000 });

    await page.goto("/staff");
    await page.getByLabel(/email/i).fill("staff@lotiva.vn");
    await page.locator('input[type="password"]').fill(process.env.SEED_ADMIN_PASSWORD ?? "admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/staff\/my-work/);
    await page.getByRole("button", { name: /^Refresh$/i }).click();
    await expect(page.getByText(/Extra towels|Housekeeping/i).first()).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /^Accept$/i }).first().click();
    await page.getByRole("button", { name: /^Start$/i }).first().click();
    await page.getByRole("button", { name: /^Complete$/i }).first().click();
  });

  test("staff forbidden from admin settings API", async ({ request }) => {
    const login = await request.post(`${API}/api/v1/auth/login`, {
      data: { email: "staff@lotiva.vn", password: process.env.SEED_ADMIN_PASSWORD ?? "admin123" },
    });
    expect(login.ok()).toBeTruthy();
    const settings = await request.get(`${API}/api/v1/admin/settings`);
    expect(settings.status()).toBe(403);
  });
});
