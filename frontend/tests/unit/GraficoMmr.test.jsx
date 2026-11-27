/** Testes unitarios do grafico de evolucao do MMR. */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GraficoMmr from "../../src/components/GraficoMmr.jsx";

const EVOLUCAO = [
  { partida_id: 10, mmr_depois: 1009, variacao: 9 },
  { partida_id: 11, mmr_depois: 1001, variacao: -8 },
  { partida_id: 12, mmr_depois: 1001, variacao: 0 },
];

/** Os pontos do desenho, na ordem: o inicio e depois uma partida por vez. */
function pontos() {
  return [...screen.getByRole("img").querySelectorAll("circle")];
}

describe("GraficoMmr", () => {
  it("não mostra nada antes da primeira partida", () => {
    const { container } = render(<GraficoMmr mmrInicial={1000} evolucao={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("resume a evolução em texto, que também descreve o gráfico", () => {
    render(<GraficoMmr mmrInicial={1000} evolucao={EVOLUCAO} />);

    expect(screen.getByRole("region", { name: "Evolução do MMR" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Começou em 1000 e está em 1001 depois de 3 partidas." }),
    ).toBeInTheDocument();
  });

  it("desenha um ponto no início e um por partida, com o MMR de cada um", () => {
    render(<GraficoMmr mmrInicial={1000} evolucao={EVOLUCAO} />);

    expect(pontos().map((ponto) => ponto.textContent)).toEqual([
      "Início: MMR 1000",
      "Partida 1: MMR 1009 (+9)",
      "Partida 2: MMR 1001 (-8)",
      "Partida 3: MMR 1001 (0)",
    ]);
  });

  it("pinta cada ponto conforme o MMR subiu, caiu ou ficou igual", () => {
    render(<GraficoMmr mmrInicial={1000} evolucao={EVOLUCAO} />);

    const [inicio, subiu, caiu, igual] = pontos();
    expect(inicio).toHaveClass("fill-slate-400");
    expect(subiu).toHaveClass("fill-emerald-600");
    expect(caiu).toHaveClass("fill-red-600");
    expect(igual).toHaveClass("fill-slate-400");
  });

  it("mostra o maior MMR no topo e o menor embaixo", () => {
    render(<GraficoMmr mmrInicial={1000} evolucao={EVOLUCAO} />);

    const eixo = screen.getByText("1009").parentElement;
    expect([...eixo.children].map((numero) => numero.textContent)).toEqual(["1009", "1000"]);
    expect(eixo).toHaveClass("justify-between");
  });

  it("com o MMR parado, mostra um número só, no meio", () => {
    render(
      <GraficoMmr
        mmrInicial={1000}
        evolucao={[{ partida_id: 10, mmr_depois: 1000, variacao: 0 }]}
      />,
    );

    const eixo = screen.getByText("1000").parentElement;
    expect([...eixo.children].map((numero) => numero.textContent)).toEqual(["1000"]);
    expect(eixo).toHaveClass("justify-center");
  });

  it("passa a linha tracejada na altura do MMR inicial", () => {
    render(<GraficoMmr mmrInicial={1000} evolucao={EVOLUCAO} />);

    const linha = screen.getByRole("img").querySelector("line");
    expect(linha).toHaveAttribute("y1", pontos()[0].getAttribute("cy"));
    expect(linha).toHaveAttribute("y2", pontos()[0].getAttribute("cy"));
  });
});
