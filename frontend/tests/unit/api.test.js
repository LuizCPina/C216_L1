/**
 * Testes unitarios do cliente HTTP.
 *
 * O fetch de verdade e trocado por um falso, entao nenhuma API precisa estar
 * no ar: os testes conferem a URL, o metodo e o corpo de cada chamada, e como
 * as respostas de erro viram mensagens para a tela.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  atualizarSessao,
  ErroDaApi,
  editarPartida,
  encerrarSessao,
  estatisticasGerais,
  iniciarSessao,
  listarSessoes,
  mensagemDeErro,
  registrarPartida,
  removerPartida,
} from "../../src/api.js";

const API = "http://localhost:8000";

/** Resposta HTTP com corpo JSON, como a API devolveria. */
function respostaJson(status, corpo) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchFalso;

beforeEach(() => {
  fetchFalso = vi.fn().mockResolvedValue(respostaJson(200, []));
  vi.stubGlobal("fetch", fetchFalso);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("chamadas", () => {
  it("faz GET na URL da API e devolve o JSON", async () => {
    fetchFalso.mockResolvedValue(respostaJson(200, [{ id: 1 }]));

    const sessoes = await listarSessoes();

    expect(sessoes).toEqual([{ id: 1 }]);
    expect(fetchFalso).toHaveBeenCalledWith(`${API}/sessoes`, { method: "GET" });
  });

  it("coloca na URL só os filtros preenchidos", async () => {
    await listarSessoes({ playlist: "2v2", status: undefined });
    await estatisticasGerais({ playlist: "" });

    expect(fetchFalso.mock.calls[0][0]).toBe(`${API}/sessoes?playlist=2v2`);
    expect(fetchFalso.mock.calls[1][0]).toBe(`${API}/estatisticas`);
  });

  it("envia os dados como JSON no corpo", async () => {
    const partida = { gols_pro: 3, gols_contra: 1, mmr_depois: 1010 };

    await registrarPartida(7, partida);

    expect(fetchFalso).toHaveBeenCalledWith(`${API}/sessoes/7/partidas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partida),
    });
  });

  it("usa o método e a rota certos em cada ação", async () => {
    await iniciarSessao({ playlist: "3v3", mmr_inicial: 900 });
    await atualizarSessao(2, { observacoes: "Duo" });
    await encerrarSessao(2);
    await editarPartida(5, { gols_pro: 1, gols_contra: 0, mmr_depois: 910 });

    const chamadas = fetchFalso.mock.calls.map(([url, opcoes]) => `${opcoes.method} ${url}`);
    expect(chamadas).toEqual([
      `POST ${API}/sessoes`,
      `PATCH ${API}/sessoes/2`,
      `POST ${API}/sessoes/2/encerrar`,
      `PUT ${API}/partidas/5`,
    ]);
  });

  it("devolve null quando a resposta não tem corpo (204)", async () => {
    fetchFalso.mockResolvedValue(new Response(null, { status: 204 }));

    expect(await removerPartida(5)).toBeNull();
    expect(fetchFalso).toHaveBeenCalledWith(`${API}/partidas/5`, { method: "DELETE" });
  });
});

describe("erros", () => {
  it("transforma o detail da API em ErroDaApi com o status", async () => {
    fetchFalso.mockResolvedValue(
      respostaJson(409, { detail: "Já existe uma sessão aberta (sessão 1)." }),
    );

    const erro = await iniciarSessao({ playlist: "2v2", mmr_inicial: 1000 }).catch((e) => e);

    expect(erro).toBeInstanceOf(ErroDaApi);
    expect(erro.status).toBe(409);
    expect(erro.message).toBe("Já existe uma sessão aberta (sessão 1).");
  });

  it("avisa quando a API não responde", async () => {
    fetchFalso.mockRejectedValue(new TypeError("Failed to fetch"));

    const erro = await listarSessoes().catch((e) => e);

    expect(erro).toBeInstanceOf(ErroDaApi);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch("Não foi possível falar com a API");
  });

  it("usa uma mensagem genérica quando o erro não tem corpo JSON", async () => {
    fetchFalso.mockResolvedValue(new Response("Internal Server Error", { status: 500 }));

    const erro = await listarSessoes().catch((e) => e);

    expect(erro.message).toBe("A API respondeu com erro 500.");
  });

  it("resume os erros de validação do Pydantic", () => {
    const corpo = {
      detail: [
        { loc: ["body", "gols_pro"], msg: "Input should be greater than or equal to 0" },
        { loc: ["body", "mmr_depois"], msg: "Field required" },
      ],
    };

    expect(mensagemDeErro(corpo, 422)).toBe(
      "Dados inválidos (gols_pro: Input should be greater than or equal to 0; mmr_depois: Field required).",
    );
  });
});
