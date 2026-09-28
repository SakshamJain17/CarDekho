import { test, expect } from "@playwright/test";

test("alternative uses real Python models, comparison, sensitivity and export", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/ai/");
  await expect(page.locator("h1")).toContainText("KNOW THE");
  await expect(page.locator(".ai-api-strip")).toContainText("CONNECTED");
  await expect(page.locator(".ai-model-panel")).toHaveCount(3);
  await page.screenshot({ path: "test-results/ai-desktop.png" });
  await page.locator("#predict").scrollIntoViewIfNeeded();
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/predict") && r.status() === 200,
  );
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  const prediction = await (await response).json();
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(prediction.predicted_price);
  await expect(page.getByTestId("ai-predicted-price")).toHaveText(formatted);
  await expect(page.locator(".ai-prediction-comparison>div")).toHaveCount(3);
  await page.locator(".ai-sensitivity").scrollIntoViewIfNeeded();
  await expect(
    page.locator(".ai-sensitivity-chart .recharts-line-dot").first(),
  ).toBeVisible();
  await page.locator("#ai-sensitivity-feature").selectOption("year");
  await expect(page.locator(".ai-sensitivity")).toContainText(
    "Only year changes",
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "EXPORT VALUATION RECORD" }).click();
  expect((await download).suggestedFilename()).toBe(
    "cardekho-ai-valuation.json",
  );
  await page
    .locator(".ai-configurator")
    .screenshot({ path: "test-results/ai-configurator.png" });
  await page.locator("#ai-input-year").fill("10");
  await expect(page.getByTestId("ai-predicted-price")).toHaveText("₹ —");
  expect(errors).toEqual([]);
});

test("alternative mobile, keyboard navigation, reduced motion and no overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/ai/");
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: "test-results/ai-mobile.png" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .locator("#ai-navigation")
    .getByRole("link", { name: "Predict", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  await expect(page.locator(".ai-prediction-comparison>div")).toHaveCount(3);
  await page
    .locator(".ai-valuation-panel")
    .screenshot({ path: "test-results/ai-mobile-valuation.png" });
});

test("backend failure is explicit and never produces a fake price", async ({
  page,
}) => {
  await page.route("**/api/**", (route) => route.abort());
  await page.goto("/ai/");
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  await expect(page.locator(".ai-vehicle-form [role=alert]")).toBeVisible();
  await expect(page.getByTestId("ai-predicted-price")).toHaveText("₹ —");
  await expect(page.locator(".ai-prediction-comparison")).toHaveCount(0);
});

test("navigation, genuine scatter points and dataset-linked vehicle choices", async ({
  page,
}) => {
  await page.goto("/ai/");
  for (const id of [
    "data",
    "models",
    "performance",
    "insights",
    "predict",
    "overview",
  ]) {
    await page.locator(`#ai-navigation a[href='#${id}']`).click();
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
  }
  await page.locator("#ai-scatter-model").selectOption("Random Forest");
  await expect(
    page.locator(".ai-scatter-section .recharts-scatter-symbol"),
  ).toHaveCount(1387);
  await page
    .locator(".ai-scatter-section")
    .screenshot({ path: "test-results/ai-scatter.png" });
  await page.locator("#ai-input-brand").selectOption("hyundai");
  await expect(page.locator("#ai-input-vehicle_name")).toHaveValue(/^hyundai /);
  await page.locator("#ai-input-km_driven").fill("-1");
  let predictions = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/api/predict")) predictions++;
  });
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  expect(
    await page
      .locator("#ai-input-km_driven")
      .evaluate((input) => input.validity.valid),
  ).toBe(false);
  expect(predictions).toBe(0);
});
