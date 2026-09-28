import { test, expect } from "@playwright/test";

test("premium landing, all datasets, valuation, model evidence, sensitivity and export", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#campaign-title")).toContainText("MORE THAN");
  await expect(page.locator(".campaign-image")).toHaveJSProperty("complete", true);
  await expect(page.locator("#load-status")).toContainText("MODEL READY");
  await page.screenshot({ path: "test-results/premium-desktop.png", fullPage: false });
  for (const key of ["v3", "v4", "basic", "small"]) {
    await page.locator("#dataset").selectOption(key);
    await expect(page.locator("#load-status")).toContainText("MODEL READY");
    await expect(page.locator("#active-code")).toHaveText(key.toUpperCase());
    await page.locator("#tab-predict").click();
    await page.locator("#estimate-button").click();
    await expect(page.locator("#result")).toBeVisible();
    await expect(page.locator("#result-price")).toContainText("₹");
    await expect(page.locator("#scenario-body tr")).not.toHaveCount(0);
    await page.locator("#scenario-feature").selectOption("km_driven");
    await expect(page.locator("#scenario-feature-label")).toContainText("Kilometres");
    await expect(page.locator("#scenario-chart svg")).toBeVisible();
    await page.locator("#tab-models").click();
    await expect(page.locator(".model-scorecard")).toHaveCount(3);
    await expect(page.locator(".model-scorecard.selected")).toHaveCount(1);
    await expect(page.locator(".performance-row")).toHaveCount(4);
  }
  await page.locator("#tab-predict").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-valuation").click();
  expect((await downloadPromise).suggestedFilename()).toBe("cardekho-small-valuation.json");
  await page.locator("#field-year").fill("2013");
  await expect(page.locator("#result")).toBeHidden();
  await expect(page.locator("#scenario-panel")).toBeHidden();
  expect(errors).toEqual([]);
});

test("genuine locally hosted 3D car loads, rotates, changes finish and supports keyboard", async ({ page }) => {
  const errors = [], failures = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.status() >= 400 && response.url().includes("/web/media/")) failures.push(response.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: /ENTER THE 3D EXPERIENCE/ }).click();
  await expect(page.getByRole("button", { name: "Pearl paint" })).toBeEnabled({ timeout: 45_000 });
  await expect(page.locator(".viewer-status")).toContainText("Drag to rotate");
  await page.getByRole("button", { name: "Pearl paint" }).click();
  await expect(page.locator(".viewer-label strong")).toHaveText("Pearl");
  await expect(page.getByRole("button", { name: "Pearl paint" })).toHaveAttribute("aria-pressed", "true");
  const canvas = page.locator(".three-mount canvas");
  await canvas.focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("+");
  await expect(page.getByRole("button", { name: "Start rotation" })).toBeVisible();
  await page.locator(".car-showroom").screenshot({ path: "test-results/premium-3d.png" });
  await page.getByRole("button", { name: "Reset camera" }).click();
  await page.getByRole("button", { name: "Expand showroom" }).click();
  await expect(page.locator(".car-showroom")).toHaveClass(/expanded/);
  expect(errors).toEqual([]); expect(failures).toEqual([]);
});

test("mobile navigation, touch layout and reduced-motion presentation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.screenshot({ path: "test-results/premium-mobile.png" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await page.getByRole("link", { name: "The price lab", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#load-status")).toContainText("MODEL READY");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
  await page.locator("#estimate-button").click();
  await expect(page.locator("#result")).toBeVisible();
  await page.screenshot({ path: "test-results/premium-mobile-valuation.png" });
  await page.getByRole("button", { name: /ENTER THE 3D EXPERIENCE/ }).click();
  await expect(page.getByRole("button", { name: "Start rotation" })).toBeEnabled({ timeout: 45_000 });
});

test("WebGL failure falls back without breaking predictions", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (String(kind).includes("webgl")) return null;
      return original.call(this, kind, ...args);
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: /ENTER THE 3D EXPERIENCE/ }).click();
  await expect(page.locator(".showroom-fallback")).toBeVisible();
  await expect(page.locator(".viewer-status")).toContainText("isn't available");
  await expect(page.locator("#load-status")).toContainText("MODEL READY");
  await page.locator("#estimate-button").click();
  await expect(page.locator("#result")).toBeVisible();
});
