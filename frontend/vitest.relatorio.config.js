import { defineConfig, mergeConfig } from "vitest/config";
import configuracao from "./vite.config.js";

/**
 * Configuracao do `npm run test:report`: os mesmos testes do `npm run test`,
 * mas gerando os relatorios em relatorios/.
 *
 * - relatorios/index.html: cada teste, se passou e quanto tempo levou. E um
 *   arquivo so (singleFile), que abre direto no navegador.
 * - relatorios/coverage/index.html: cobertura, ou seja, quanto do codigo de
 *   src/ os testes executam. Tambem aparece na aba Coverage do relatorio acima.
 *
 * No GitHub Actions, o reporter github-actions escreve ainda um resumo dos
 * testes na pagina da execucao.
 */
export default mergeConfig(
  configuracao,
  defineConfig({
    test: {
      reporters: [
        "default",
        ["html", { outputDir: "relatorios", singleFile: true }],
        ...(process.env.GITHUB_ACTIONS === "true" ? ["github-actions"] : []),
      ],
      coverage: {
        enabled: true,
        provider: "v8",
        include: ["src/**/*.{js,jsx}"],
        reporter: ["text", "html"],
        reportsDirectory: "relatorios/coverage",
      },
    },
  }),
);
