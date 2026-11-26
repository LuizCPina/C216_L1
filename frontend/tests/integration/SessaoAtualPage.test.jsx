/**
 * Testes de integracao da pagina da sessao atual.
 *
 * Formulario, resumo, avisos e estado da pagina trabalham juntos. So a API e
 * simulada: o vi.mock troca as funcoes de src/api.js por dubles, mantendo o
 * ErroDaApi verdadeiro. O que se verifica e o que o jogador ve na tela.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErroDaApi, encerrarSessao, iniciarSessao, listarSessoes } from "../../src/api.js";
import SessaoAtualPage from "../../src/pages/SessaoAtualPage.jsx";

vi.mock("../../src/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listarSessoes: vi.fn(),
  iniciarSessao: vi.fn(),
  encerrarSessao: vi.fn(),
}));

const SESSAO_ABERTA = {
  id: 1,
  playlist: "2v2",
  mmr_inicial: 1000,
  status: "aberta",
  iniciada_em: "2026-11-26T12:00:00Z",
  encerrada_em: null,
  observacoes: null,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("SessaoAtualPage", () => {
  it("mostra o carregando e depois o formulário quando não há sessão aberta", async () => {
    listarSessoes.mockResolvedValue([]);
    render(<SessaoAtualPage />);

    expect(screen.getByText("Carregando a sessão atual...")).toBeInTheDocument();
    expect(await screen.findByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
    expect(listarSessoes).toHaveBeenCalledWith({ status: "aberta" });
  });

  it("mostra a sessão que já estava aberta", async () => {
    listarSessoes.mockResolvedValue([SESSAO_ABERTA]);
    render(<SessaoAtualPage />);

    expect(await screen.findByRole("heading", { name: "Sessão atual" })).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Nova sessão" })).not.toBeInTheDocument();
  });

  it("inicia uma sessão e mostra a mensagem de sucesso", async () => {
    const usuario = userEvent.setup();
    listarSessoes.mockResolvedValue([]);
    iniciarSessao.mockResolvedValue(SESSAO_ABERTA);
    render(<SessaoAtualPage />);

    await usuario.type(await screen.findByLabelText("MMR inicial"), "1000");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(iniciarSessao).toHaveBeenCalledWith({
      playlist: "2v2",
      mmr_inicial: 1000,
      observacoes: null,
    });
    expect(await screen.findByText(/Sessão 2v2 iniciada/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sessão atual" })).toBeInTheDocument();
  });

  it("mostra o erro da API e continua no formulário", async () => {
    const usuario = userEvent.setup();
    listarSessoes.mockResolvedValue([]);
    iniciarSessao.mockRejectedValue(
      new ErroDaApi(
        "Já existe uma sessão aberta (sessão 9). Encerre-a antes de iniciar outra.",
        409,
      ),
    );
    render(<SessaoAtualPage />);

    await usuario.type(await screen.findByLabelText("MMR inicial"), "1000");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sessão aberta");
    expect(screen.getByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
  });

  it("encerra a sessão e volta para o formulário", async () => {
    const usuario = userEvent.setup();
    listarSessoes.mockResolvedValue([SESSAO_ABERTA]);
    encerrarSessao.mockResolvedValue({ ...SESSAO_ABERTA, status: "encerrada" });
    render(<SessaoAtualPage />);

    await usuario.click(await screen.findByRole("button", { name: "Encerrar sessão" }));

    expect(encerrarSessao).toHaveBeenCalledWith(1);
    expect(await screen.findByText(/Sessão encerrada/)).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
  });

  it("avisa quando a API está fora do ar e deixa tentar de novo", async () => {
    const usuario = userEvent.setup();
    listarSessoes
      .mockRejectedValueOnce(new ErroDaApi("Não foi possível falar com a API. Ela está no ar?", 0))
      .mockResolvedValueOnce([]);
    render(<SessaoAtualPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível falar com a API");

    await usuario.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
