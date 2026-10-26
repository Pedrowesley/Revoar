import { defineConfig, devices } from "@playwright/test";

const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "npm run dev -w @revoar/api",
      url: "http://localhost:3002/health",
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: "npm run dev -w @revoar/extranet",
      url: "http://localhost:3000",
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: "npm run dev -w @revoar/admin",
      url: "http://localhost:3001",
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: "npm run dev -w @revoar/guest",
      url: "http://127.0.0.1:3003",
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});
