/** Testes unitarios da lista de sessoes encerradas. */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HistoricoLista from "../../src/components/HistoricoLista.jsx";

const SESSAO = {
  id: 4,
  playlist: "3v3",
  mmr_inicial: 1000,
  status: "encerrada",
  iniciada_em: "2026-11-25T12:00:00Z",
  encerrada_em: "2026-11-25T14:00:00Z",
  observacoes: "Trio com a galera",
};

const ESTATISTICAS = {
  partidas: 5,
  vitorias: 3,
  derrotas: 2,
  mmr_atual: 1012,
  variacao_mmr: 12,
};

describe("HistoricoLista", () => {
  it("mostra o resumo de cada sessão", () => {
    render(<HistoricoLista itens={[{ sessao: SESSAO, estatisticas: ESTATISTICAS }]} playlist="" />);

    const item = screen.getByRole("listitem");
    expect(item).toHaveTextContent("3v3");
    expect(item).toHaveTextContent(/25\/11\/2026.* até 25\/11\/2026/);
    expect(item).toHaveTextContent("3 vitórias e 2 derrotas");
    expect(item).toHaveTextContent("MMR 1000 → 1012 (+12)");
    expect(item).toHaveTextContent("Trio com a galera");
    expect(screen.getByText("(+12)")).toHaveClass("text-emerald-700");
  });

  it("avisa quando a sessão não teve partidas", () => {
    render(
      <HistoricoLista
        itens={[{ sessao: { ...SESSAO, observacoes: null }, estatisticas: { partidas: 0 } }]}
        playlist=""
      />,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("Nenhuma partida registrada.");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("MMR");
  });

  it("avisa quando ainda não há sessões encerradas", () => {
    render(<HistoricoLista itens={[]} playlist="" />);

    expect(screen.getByText(/Nenhuma sessão encerrada ainda/)).toBeInTheDocument();
  });

  it("com filtro, diz qual playlist está vazia", () => {
    render(<HistoricoLista itens={[]} playlist="1v1" />);

    expect(screen.getByText("Nenhuma sessão 1v1 encerrada.")).toBeInTheDocument();
  });
});
