/** Testes unitarios dos cards de estatisticas. */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EstatisticasCards from "../../src/components/EstatisticasCards.jsx";

const ESTATISTICAS = {
  partidas: 5,
  vitorias: 3,
  derrotas: 2,
  taxa_vitoria: 60,
  gols_pro: 11,
  gols_contra: 8,
  saldo_gols: 3,
  sequencia: { resultado: "vitoria", quantidade: 2 },
  variacao_mmr: 12,
};

/** O card inteiro (rotulo, valor e detalhe) a partir do rotulo. */
function card(rotulo) {
  return screen.getByText(rotulo).parentElement;
}

describe("EstatisticasCards", () => {
  it("mostra o título e a descrição na região", () => {
    render(
      <EstatisticasCards
        titulo="Resumo geral"
        descricao="Somando 2 sessões"
        estatisticas={ESTATISTICAS}
      />,
    );

    expect(screen.getByRole("region", { name: "Resumo geral" })).toHaveTextContent(
      "Somando 2 sessões",
    );
  });

  it("mostra cada número formatado", () => {
    render(<EstatisticasCards titulo="Estatísticas" estatisticas={ESTATISTICAS} />);

    expect(card("Partidas")).toHaveTextContent("5");
    expect(card("Partidas")).toHaveTextContent("3 vitórias · 2 derrotas");
    expect(card("Taxa de vitória")).toHaveTextContent("60%");
    expect(card("Sequência atual")).toHaveTextContent("2 vitórias seguidas");
    expect(card("Variação de MMR")).toHaveTextContent("+12");
    expect(card("Saldo de gols")).toHaveTextContent("+3");
    expect(card("Saldo de gols")).toHaveTextContent("11 pró · 8 contra");
  });

  it("pinta de verde o que subiu, de vermelho o que caiu e deixa o zero neutro", () => {
    render(
      <EstatisticasCards
        titulo="Estatísticas"
        estatisticas={{ ...ESTATISTICAS, variacao_mmr: -8, saldo_gols: 0 }}
      />,
    );

    expect(screen.getByText("-8")).toHaveClass("text-red-700");
    expect(screen.getByText("0")).toHaveClass("text-slate-900");

    render(<EstatisticasCards titulo="Outra" estatisticas={ESTATISTICAS} />);

    expect(screen.getByText("+12")).toHaveClass("text-emerald-700");
    expect(screen.getByText("+3")).toHaveClass("text-emerald-700");
  });

  it("sem partidas, avisa em vez de mostrar zeros", () => {
    render(
      <EstatisticasCards
        titulo="Estatísticas"
        estatisticas={{ ...ESTATISTICAS, partidas: 0, sequencia: null }}
      />,
    );

    expect(screen.getByText("Os números aparecem depois da primeira partida.")).toBeInTheDocument();
    expect(screen.queryByText("Taxa de vitória")).not.toBeInTheDocument();
  });
});
