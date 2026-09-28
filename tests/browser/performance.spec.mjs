import { test, expect } from "@playwright/test";

test("performance edition has genuine model results and Python valuations", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/performance/");
  await expect(page.locator("h1")).toContainText("WITHOUT");
  await expect(page.locator(".performance-hero-image")).toHaveJSProperty(
    "complete",
    true,
  );
  await expect(page.locator(".ai-api-strip")).toContainText("CONNECTED");
  await page.screenshot({ path: "test-results/performance-desktop.png" });
  const lineup = page.getByRole("group", {
    name: "Explore the regression models",
  });
  await lineup.getByRole("button", { name: /RANDOM FOREST/ }).click();
  await expect(page.locator("#performance-lineup-title")).toHaveText(
    "RANDOM FOREST",
  );
  await expect(page.locator(".performance-model-bottom")).toContainText(
    "0.9376",
  );
  await page.getByRole("button", { name: "Next model", exact: true }).click();
  await expect(page.locator("#performance-lineup-title")).toHaveText(
    "GRADIENT BOOSTING",
  );
  await page
    .getByRole("button", { name: "Previous model", exact: true })
    .click();
  await expect(page.locator("#performance-lineup-title")).toHaveText(
    "RANDOM FOREST",
  );
  await page
    .locator(".performance-lineup")
    .screenshot({ path: "test-results/performance-models.png" });
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/predict") && r.status() === 200,
  );
  await page.getByRole("button", { name: "CALCULATE VALUE" }).click();
  const prediction = await (await response).json();
  expect(prediction.model).toBe("Gradient Boosting");
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(prediction.predicted_price);
  await expect(page.getByTestId("ai-predicted-price")).toHaveText(price);
  await expect(page.locator(".ai-prediction-comparison>div")).toHaveCount(3);
  await expect(
    page.locator(".ai-sensitivity-chart .recharts-line-dot").first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("performance edition genuinely loads its 3D assets at the nested route", async ({
  page,
}) => {
  const failures = [];
  page.on("response", (r) => {
    if (r.url().includes("/web/media/") && r.status() >= 400)
      failures.push(r.url());
  });
  await page.goto("/performance/");
  await page.getByRole("button", { name: /ENTER THE 3D SHOWROOM/ }).click();
  await expect(
    page.getByRole("button", { name: "Graphite paint" }),
  ).toBeEnabled({ timeout: 45000 });
  await page.getByRole("button", { name: "Graphite paint" }).click();
  await expect(page.locator(".viewer-label strong")).toHaveText("Graphite");
  await page.locator(".three-mount canvas").focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("button", { name: "Start rotation" }),
  ).toBeVisible();
  await page
    .locator(".car-showroom")
    .screenshot({ path: "test-results/performance-3d.png" });
  expect(failures).toEqual([]);
});

test("performance mobile navigation and reduced-motion layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/performance/");
  await expect(page.locator("h1")).toBeVisible();
  await page.screenshot({ path: "test-results/performance-mobile.png" });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .locator("#ai-navigation")
    .getByRole("link", { name: "Models", exact: true })
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
    .screenshot({ path: "test-results/performance-mobile-valuation.png" });
});
