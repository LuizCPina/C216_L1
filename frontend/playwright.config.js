import { defineConfig, devices } from "@playwright/test";

/**
 * Testes E2E contra a aplicacao inteira: frontend, API e banco de verdade.
 *
 * O Playwright nao sobe nada sozinho: antes, `make up` precisa estar rodando.
 * O endereco padrao e o do servico web do compose (que e o mesmo do Vite em
 * desenvolvimento, entao `npm run dev` com a API no ar tambem serve).
 */
export default defineConfig({
  // So os .spec.js daqui. Os testes do Vitest ficam em tests/unit e
  // tests/integration e usam outro runner.
  testDir: "./tests/e2e",
  testMatch: "**/*.spec.js",

  // Os testes dividem o mesmo banco, e a API so deixa existir uma sessao
  // aberta por vez. Por isso rodam um de cada vez.
  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
