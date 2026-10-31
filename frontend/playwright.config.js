import { defineConfig, devices } from "@playwright/test";

const PORTA = 5173;
const BASE_URL = `http://127.0.0.1:${PORTA}`;

export default defineConfig({
  // So os .spec.js daqui. Os testes do Vitest ficam em tests/unit e
  // tests/integration e usam outro runner.
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",

  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // O Playwright sobe o Vite sozinho antes dos testes e derruba no final.
  webServer: {
    command: `npm run dev -- --port ${PORTA}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
