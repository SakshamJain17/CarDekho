import { test, expect } from "@playwright/test";

test("only an explicit share sends a valuation to the live feed", async ({ page }) => {
  const errors = [];
  const submissions = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => {
    if (request.url().endsWith("/api/submit-valuation")) submissions.push(request);
  });
  await page.goto("/performance/");
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  await expect(page.getByTestId("ai-predicted-price")).not.toHaveText("₹ —");
  expect(submissions).toHaveLength(0);
  const shared = page.waitForResponse(response => response.url().endsWith("/api/submit-valuation") && response.status() === 201);
  await page.getByRole("button", { name: "SHARE THIS ESTIMATE ANONYMOUSLY" }).click();
  await shared;
  await expect(page.getByRole("button", { name: "SHARED WITH THE LIVE DASHBOARD" })).toBeDisabled();
  expect(submissions).toHaveLength(1);
  await page.goto("/presenter/");
  await page.getByLabel("PRESENTER KEY").fill("cardekho-playwright-only-key");
  await page.getByRole("button", { name: "OPEN DASHBOARD" }).click();
  await expect(page.locator(".presenter-feed tbody tr").first()).toContainText("Maruti Swift Dzire Vdi");
  await page.screenshot({ path: "test-results/presenter-live.png", fullPage: true });
  expect(errors).toEqual([]);
});

test("presenter feed is locked without a secret", async ({ page }) => {
  await page.goto("/presenter/");
  await expect(page.getByRole("heading", { name: /THE ROOM/ })).toBeVisible();
  await expect(page.getByLabel("PRESENTER KEY")).toBeVisible();
  await expect(page.locator(".presenter-stats")).toHaveCount(0);
  await page.screenshot({ path: "test-results/presenter-locked.png" });
});
