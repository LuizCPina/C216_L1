/** Testes unitarios das validacoes dos formularios. */

import { describe, expect, it } from "vitest";
import { validarInteiroNaoNegativo, validarPartida, validarSessao } from "../../src/validacao.js";

describe("validarInteiroNaoNegativo", () => {
  it.each(["0", "1000", " 42 ", 7])("aceita %s", (valor) => {
    expect(validarInteiroNaoNegativo(valor, "o MMR")).toBeNull();
  });

  it.each(["", "   ", undefined, null])("pede o valor quando vem vazio (%s)", (valor) => {
    expect(validarInteiroNaoNegativo(valor, "o MMR")).toBe("Informe o MMR.");
  });

  it.each(["-1", "10.5", "abc"])("recusa %s", (valor) => {
    expect(validarInteiroNaoNegativo(valor, "o MMR")).toBe(
      "O MMR precisa ser um número inteiro a partir de 0.",
    );
  });
});

describe("validarSessao", () => {
  it("aceita uma sessão completa", () => {
    expect(validarSessao({ playlist: "3v3", mmr_inicial: "900", observacoes: "" })).toEqual({});
  });

  it("aponta cada campo com problema", () => {
    const erros = validarSessao({
      playlist: "4v4",
      mmr_inicial: "",
      observacoes: "x".repeat(501),
    });

    expect(Object.keys(erros).sort()).toEqual(["mmr_inicial", "observacoes", "playlist"]);
  });
});

describe("validarPartida", () => {
  const VITORIA = {
    gols_pro: "3",
    gols_contra: "1",
    overtime: false,
    mmr_depois: "1012",
    companheiro: "",
    notas: "",
  };

  it("aceita uma partida completa", () => {
    expect(validarPartida(VITORIA)).toEqual({});
  });

  it("aceita uma vitória no overtime por um gol", () => {
    expect(validarPartida({ ...VITORIA, gols_pro: "2", overtime: true })).toEqual({});
  });

  it("recusa empate", () => {
    expect(validarPartida({ ...VITORIA, gols_contra: "3" })).toEqual({
      placar: "No Rocket League não existe empate: o placar precisa ter um vencedor.",
    });
  });

  it("recusa overtime com mais de um gol de diferença", () => {
    expect(validarPartida({ ...VITORIA, overtime: true })).toEqual({
      overtime: "O overtime termina no primeiro gol, então a diferença precisa ser de 1.",
    });
  });

  // Number("") vale 0: sem essa protecao, 0 x vazio viraria um "empate".
  it.each([
    ["0", "", { gols_contra: "Informe o placar do adversário." }],
    ["", "0", { gols_pro: "Informe o placar do seu time." }],
  ])("só confere o placar quando os dois números são válidos (caso %#)", (pro, contra, erros) => {
    expect(validarPartida({ ...VITORIA, gols_pro: pro, gols_contra: contra })).toEqual(erros);
  });

  it("aponta cada campo com problema", () => {
    const erros = validarPartida({
      ...VITORIA,
      gols_contra: "-1",
      mmr_depois: "abc",
      companheiro: "x".repeat(51),
      notas: "x".repeat(501),
    });

    expect(Object.keys(erros).sort()).toEqual([
      "companheiro",
      "gols_contra",
      "mmr_depois",
      "notas",
    ]);
  });

  it("aceita companheiro e notas no limite", () => {
    const partida = { ...VITORIA, companheiro: "x".repeat(50), notas: "x".repeat(500) };

    expect(validarPartida(partida)).toEqual({});
  });
});
