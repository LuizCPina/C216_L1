/** Testes unitarios das validacoes dos formularios. */

import { describe, expect, it } from "vitest";
import { validarInteiroNaoNegativo, validarSessao } from "../../src/validacao.js";

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
