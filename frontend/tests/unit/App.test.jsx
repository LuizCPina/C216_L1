/**
 * Teste da raiz da aplicacao: o cabecalho, as abas e a pagina de cada aba.
 *
 * A API e simulada para o teste nao depender de nada no ar.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../../src/App.jsx";

vi.mock("../../src/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listarSessoes: vi.fn().mockResolvedValue([]),
  estatisticasGerais: vi.fn().mockResolvedValue({
    partidas: 0,
    vitorias: 0,
    derrotas: 0,
    taxa_vitoria: 0,
    gols_pro: 0,
    gols_contra: 0,
    saldo_gols: 0,
    sequencia: null,
    variacao_mmr: 0,
    playlist: null,
    sessoes: 0,
  }),
}));

describe("App", () => {
  it("abre na aba da sessão atual", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Diário de Ranked" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sessão atual" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await screen.findByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
  });

  it("troca para o histórico e volta", async () => {
    const usuario = userEvent.setup();
    render(<App />);
    await screen.findByRole("form", { name: "Nova sessão" });

    await usuario.click(screen.getByRole("button", { name: "Histórico" }));

    expect(await screen.findByRole("region", { name: "Resumo geral" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Histórico" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Sessão atual" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.queryByRole("form", { name: "Nova sessão" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Sessão atual" }));

    expect(await screen.findByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
  });
});
