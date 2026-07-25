import { expect, test } from "@playwright/test";

/**
 * Automatable UI guards — NOT a real microphone / Gemini provider test.
 */
test.describe("voice direct UI guards (mocked)", () => {
  test("voice start control hidden when capabilities say disabled", async ({ page }) => {
    await page.route("**/api/v1/voice/capabilities", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          voiceEnabled: false,
          transport: "off",
          directEnabled: false,
          writeToolsEnabled: false,
          ragToolsEnabled: false,
          textFallbackEnabled: true,
          diagnosticsEnabled: false,
          experimental: true,
          environment: "development",
        }),
      });
    });
    await page.route("**/api/v1/guest/**", async (route) => {
      const url = route.request().url();
      if (url.includes("from-qr")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            roomLabel: "101",
            theme: {
              brandName: "Lotavi",
              primaryColor: "#000",
              accentColor: "#000",
              backgroundColor: "#fff",
              textColor: "#000",
              fontFamily: "serif",
              assistantName: "Assistant",
              borderRadius: "8px",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto("/g/test-token/");
    await page.getByRole("button", { name: "Assistant" }).click();
    await expect(page.getByRole("button", { name: /voice/i })).toHaveCount(0);
    await expect(page.getByText(/Experimental voice/i)).toHaveCount(0);
  });
});
