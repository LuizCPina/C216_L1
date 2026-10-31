import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // O Tailwind v4 entra como plugin do Vite: nao existe tailwind.config.js
  // nem postcss.config.js neste projeto.
  plugins: [react(), tailwindcss()],

  server: {
    // Sem host explicito o Vite escuta apenas em IPv6 (::1), e quem procurar
    // por 127.0.0.1 — como o Playwright e boa parte das ferramentas de CI —
    // nao encontra o servidor.
    host: "127.0.0.1",
    port: 5173,
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    // Sem o include o Vitest tentaria executar os arquivos .spec.js do
    // Playwright, que usam outro runner. Os testes e2e rodam por
    // `npm run test:e2e`.
    include: ["tests/unit/**/*.test.{js,jsx}", "tests/integration/**/*.test.{js,jsx}"],
  },
});
