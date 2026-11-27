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
 * - relatorios/junit.xml e relatorios/coverage/cobertura-coverage.xml: o mesmo
 *   em formatos padrao, que o backend/scripts/resumo_testes.py le para montar o
 *   resumo em portugues.
 *
 * No GitHub Actions, o reporter github-actions marca as falhas no codigo. O
 * resumo dele (em ingles) fica desligado: quem escreve o resumo e o script.
 */
export default mergeConfig(
  configuracao,
  defineConfig({
    test: {
      reporters: [
        "default",
        ["html", { outputDir: "relatorios", singleFile: true }],
        ["junit", { outputFile: "relatorios/junit.xml" }],
        ...(process.env.GITHUB_ACTIONS === "true"
          ? [["github-actions", { jobSummary: { enabled: false } }]]
          : []),
      ],
      coverage: {
        enabled: true,
        provider: "v8",
        include: ["src/**/*.{js,jsx}"],
        reporter: ["text", "html", "cobertura"],
        reportsDirectory: "relatorios/coverage",
        // Gera a cobertura mesmo com teste falhando, como o pytest-cov.
        reportOnFailure: true,
      },
    },
  }),
);
