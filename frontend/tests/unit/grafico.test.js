/** Testes unitarios das contas do grafico de MMR. */

import { describe, expect, it } from "vitest";
import { posicoesNoGrafico } from "../../src/grafico.js";

const AREA = { x: 10, y: 20, largura: 300, altura: 100 };

describe("posicoesNoGrafico", () => {
  it("divide a largura em partes iguais, do começo ao fim da área", () => {
    const xs = posicoesNoGrafico([1000, 1009, 1001, 1010], AREA).map((ponto) => ponto.x);

    expect(xs).toEqual([10, 110, 210, 310]);
  });

  it("põe o maior MMR no topo da área, o menor embaixo e o resto na proporção", () => {
    const ys = posicoesNoGrafico([1000, 1020, 1010, 1015], AREA).map((ponto) => ponto.y);

    expect(ys).toEqual([120, 20, 70, 45]);
  });

  it("deixa a linha no meio da área quando o MMR não mudou", () => {
    const ys = posicoesNoGrafico([1000, 1000, 1000], AREA).map((ponto) => ponto.y);

    expect(ys).toEqual([70, 70, 70]);
  });

  it("com um valor só, o ponto fica no começo e no meio da área", () => {
    expect(posicoesNoGrafico([1000], AREA)).toEqual([{ x: 10, y: 70 }]);
  });
});
