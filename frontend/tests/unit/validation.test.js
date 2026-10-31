/**
 * Testes unitarios das regras de validacao.
 *
 * Funcoes puras, sem React e sem DOM: entra um valor, sai outro.
 */

import { describe, expect, it } from "vitest";
import {
  emailJaUsado,
  filtrarPorNome,
  normalizarEmail,
  validarEmail,
  validarNome,
  validarUsuario,
} from "../../src/validation.js";

describe("normalizarEmail", () => {
  it("remove espaços e passa para minúsculas", () => {
    expect(normalizarEmail("  Ana@Teste.COM  ")).toBe("ana@teste.com");
  });

  it("devolve string vazia para valores que não são texto", () => {
    expect(normalizarEmail(null)).toBe("");
    expect(normalizarEmail(undefined)).toBe("");
    expect(normalizarEmail(42)).toBe("");
  });

  it.each([
    ["ana@teste.com", "ana@teste.com"],
    ["ANA@TESTE.COM", "ana@teste.com"],
    ["  ana@teste.com  ", "ana@teste.com"],
    ["Ana@Teste.Com", "ana@teste.com"],
  ])("normaliza %s para %s", (entrada, esperado) => {
    expect(normalizarEmail(entrada)).toBe(esperado);
  });
});

describe("validarNome", () => {
  it("aceita um nome comum", () => {
    expect(validarNome("Ana")).toBeNull();
  });

  it("rejeita nome vazio", () => {
    expect(validarNome("")).toBe("Informe o nome.");
  });

  it("rejeita nome só com espaços", () => {
    expect(validarNome("   ")).toBe("Informe o nome.");
  });

  it("rejeita nome acima do limite", () => {
    const erro = validarNome("a".repeat(81));
    expect(erro).toContain("80");
  });

  it("aceita nome exatamente no limite", () => {
    expect(validarNome("a".repeat(80))).toBeNull();
  });
});

describe("validarEmail", () => {
  it.each(["ana@teste.com", "ana@sub.teste.com", "ana.souza@teste.com.br"])(
    "aceita %s",
    (entrada) => {
      expect(validarEmail(entrada)).toBeNull();
    },
  );

  it.each([
    ["", "Informe o email."],
    ["ana.teste.com", "Email invalido: falta o @."],
    ["@teste.com", "Email invalido."],
    ["ana@", "Email invalido."],
    ["ana@teste", "Email invalido."],
    // Os cinco abaixo passavam na primeira versao da funcao: ela olhava
    // apenas as duas primeiras partes do split e aceitava qualquer dominio
    // que tivesse um ponto em algum lugar.
    ["ana@teste.com@outro", "Email invalido."],
    ["ana@@teste.com", "Email invalido."],
    ["ana souza@teste.com", "Email invalido."],
    ["ana@.com", "Email invalido."],
    ["ana@teste.", "Email invalido."],
  ])("rejeita %s", (entrada, esperado) => {
    expect(validarEmail(entrada)).toBe(esperado);
  });
});

describe("emailJaUsado", () => {
  const usuarios = [{ id: 1, nome: "Ana", email: "ana@teste.com" }];

  it("encontra o email mesmo escrito em maiúsculas", () => {
    expect(emailJaUsado("ANA@TESTE.COM", usuarios)).toBe(true);
  });

  it("devolve false quando o email é novo", () => {
    expect(emailJaUsado("bruno@teste.com", usuarios)).toBe(false);
  });

  it("devolve false com a lista vazia", () => {
    expect(emailJaUsado("ana@teste.com", [])).toBe(false);
  });
});

describe("validarUsuario", () => {
  it("devolve objeto vazio quando tudo está certo", () => {
    const erros = validarUsuario({ nome: "Ana", email: "ana@teste.com" });
    expect(erros).toEqual({});
  });

  it("acusa os dois campos de uma vez", () => {
    const erros = validarUsuario({ nome: "", email: "" });
    expect(erros).toHaveProperty("nome");
    expect(erros).toHaveProperty("email");
  });

  it("acusa email repetido", () => {
    const existentes = [{ id: 1, nome: "Ana", email: "ana@teste.com" }];
    const erros = validarUsuario({ nome: "Outra Ana", email: "ana@teste.com" }, existentes);
    expect(erros.email).toBe("Este email ja esta cadastrado.");
  });

  it("não acusa repetição quando o email é inválido", () => {
    const erros = validarUsuario({ nome: "Ana", email: "sem-arroba" });
    expect(erros.email).toBe("Email invalido: falta o @.");
  });
});

describe("filtrarPorNome", () => {
  const usuarios = [
    { id: 1, nome: "Ana", email: "ana@teste.com" },
    { id: 2, nome: "Bruno", email: "bruno@teste.com" },
  ];

  it.each([
    ["ana", ["Ana"]],
    ["BRU", ["Bruno"]],
    ["o", ["Bruno"]],
    ["zzz", []],
    ["", ["Ana", "Bruno"]],
    ["   ", ["Ana", "Bruno"]],
  ])("filtrando por %s", (termo, esperados) => {
    const nomes = filtrarPorNome(usuarios, termo).map((usuario) => usuario.nome);
    expect(nomes).toEqual(esperados);
  });

  it("devolve a lista original quando não há termo", () => {
    expect(filtrarPorNome(usuarios)).toBe(usuarios);
  });
});
