import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60_000,
  expect: { timeout: 20_000 },
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.CARDEKHO_TEST_URL || "http://127.0.0.1:5173",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CARDEKHO_BROWSER_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "npm run dev", url: "http://127.0.0.1:5173", reuseExistingServer: true },
    { command: ".venv/bin/python -m uvicorn backend.app:app --host 127.0.0.1 --port 8000", url: "http://127.0.0.1:8000/api/health", reuseExistingServer: true, env: { CARDEKHO_DATABASE_URL: "sqlite:////private/tmp/cardekho-playwright-submissions.sqlite3", CARDEKHO_PRESENTER_KEY: "cardekho-playwright-only-key" } },
  ],
});
