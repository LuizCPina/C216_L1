/** Testes unitarios da formatacao de valores. */

import { describe, expect, it } from "vitest";
import {
  contar,
  corDoSinal,
  faixaDoSinal,
  formatarDataHora,
  formatarPercentual,
  formatarSequencia,
  formatarVariacao,
} from "../../src/formatacao.js";

describe("formatarDataHora", () => {
  it("usa o formato brasileiro de data", () => {
    // Meio-dia em UTC: a data e a mesma em qualquer fuso do Brasil.
    expect(formatarDataHora("2026-11-26T12:00:00Z")).toMatch(/^26\/11\/2026/);
  });

  it("mostra um traço quando não há data", () => {
    expect(formatarDataHora(null)).toBe("—");
  });
});

describe("formatarPercentual", () => {
  it.each([
    [66.7, "66,7%"],
    [50, "50%"],
    [0, "0%"],
    [100, "100%"],
  ])("%s vira %s", (valor, texto) => {
    expect(formatarPercentual(valor)).toBe(texto);
  });
});

describe("formatarVariacao", () => {
  it.each([
    [9, "+9"],
    [-8, "-8"],
    [0, "0"],
  ])("%s vira %s", (valor, texto) => {
    expect(formatarVariacao(valor)).toBe(texto);
  });
});

describe("corDoSinal", () => {
  it.each([
    [12, "text-emerald-700"],
    [-8, "text-red-700"],
    [0, "text-slate-900"],
  ])("%s usa %s", (valor, classe) => {
    expect(corDoSinal(valor)).toBe(classe);
  });
});

describe("faixaDoSinal", () => {
  it.each([
    [1, "border-l-emerald-500"],
    [-1, "border-l-red-500"],
    [0, "border-l-slate-300"],
  ])("%s usa %s", (valor, classe) => {
    expect(faixaDoSinal(valor)).toBe(classe);
  });
});

describe("contar", () => {
  it.each([
    [0, "0 partidas"],
    [1, "1 partida"],
    [2, "2 partidas"],
  ])("%s vira %s", (quantidade, texto) => {
    expect(contar(quantidade, "partida")).toBe(texto);
  });
});

describe("formatarSequencia", () => {
  it.each([
    [{ resultado: "vitoria", quantidade: 1 }, "1 vitória"],
    [{ resultado: "vitoria", quantidade: 3 }, "3 vitórias seguidas"],
    [{ resultado: "derrota", quantidade: 1 }, "1 derrota"],
    [{ resultado: "derrota", quantidade: 2 }, "2 derrotas seguidas"],
  ])("%o vira %s", (sequencia, texto) => {
    expect(formatarSequencia(sequencia)).toBe(texto);
  });

  it("mostra um traço quando ainda não há partidas", () => {
    expect(formatarSequencia(null)).toBe("—");
  });
});
