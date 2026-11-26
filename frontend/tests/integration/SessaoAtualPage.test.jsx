/**
 * Testes de integracao da pagina da sessao atual.
 *
 * Formulario, resumo, avisos e estado da pagina trabalham juntos. So a API e
 * simulada: o vi.mock troca as funcoes de src/api.js por dubles, mantendo o
 * ErroDaApi verdadeiro. O que se verifica e o que o jogador ve na tela.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErroDaApi,
  editarPartida,
  encerrarSessao,
  iniciarSessao,
  listarPartidas,
  listarSessoes,
  registrarPartida,
  removerPartida,
} from "../../src/api.js";
import SessaoAtualPage from "../../src/pages/SessaoAtualPage.jsx";

vi.mock("../../src/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listarSessoes: vi.fn(),
  iniciarSessao: vi.fn(),
  encerrarSessao: vi.fn(),
  listarPartidas: vi.fn(),
  registrarPartida: vi.fn(),
  editarPartida: vi.fn(),
  removerPartida: vi.fn(),
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

const PARTIDA = {
  id: 10,
  sessao_id: 1,
  gols_pro: 3,
  gols_contra: 1,
  overtime: false,
  mmr_depois: 1009,
  companheiro: null,
  notas: null,
  resultado: "vitoria",
  jogada_em: "2026-11-26T12:30:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  listarPartidas.mockResolvedValue([]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Promessa que o teste resolve quando quiser, para ver o estado de carregando. */
function promessaPendente() {
  let resolver;
  const promessa = new Promise((resolve) => {
    resolver = resolve;
  });
  return { promessa, resolver };
}

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

describe("SessaoAtualPage com partidas", () => {
  beforeEach(() => {
    listarSessoes.mockResolvedValue([SESSAO_ABERTA]);
  });

  /** Abre a pagina e espera a lista de partidas aparecer. */
  async function abrirPagina() {
    render(<SessaoAtualPage />);
    return within(await screen.findByRole("region", { name: "Partidas da sessão" }));
  }

  /** Preenche o formulario de registrar com uma vitoria por 3 x 1. */
  async function preencherVitoria(usuario, formulario) {
    await usuario.type(formulario.getByLabelText("Seu time"), "3");
    await usuario.type(formulario.getByLabelText("Adversário"), "1");
    await usuario.type(formulario.getByLabelText("MMR depois da partida"), "1009");
  }

  it("carrega as partidas da sessão aberta", async () => {
    listarPartidas.mockResolvedValue([PARTIDA]);
    const lista = await abrirPagina();

    expect(listarPartidas).toHaveBeenCalledWith(1);
    expect(lista.getByRole("listitem")).toHaveTextContent("3 × 1");
  });

  it("registra uma partida, mostra o sucesso e coloca ela na lista", async () => {
    const usuario = userEvent.setup();
    registrarPartida.mockResolvedValue(PARTIDA);
    const lista = await abrirPagina();
    const formulario = within(screen.getByRole("form", { name: "Registrar partida" }));

    await preencherVitoria(usuario, formulario);
    await usuario.click(formulario.getByRole("button", { name: "Registrar partida" }));

    expect(registrarPartida).toHaveBeenCalledWith(1, {
      gols_pro: 3,
      gols_contra: 1,
      overtime: false,
      mmr_depois: 1009,
      companheiro: null,
      notas: null,
    });
    expect(await screen.findByText("Partida registrada: 3 × 1.")).toBeInTheDocument();
    expect(lista.getByRole("listitem")).toHaveTextContent("Vitória");
    expect(formulario.getByLabelText("Seu time")).toHaveValue(null);
  });

  it("mostra o carregando e trava os botões enquanto a API responde", async () => {
    const usuario = userEvent.setup();
    const { promessa, resolver } = promessaPendente();
    registrarPartida.mockReturnValue(promessa);
    await abrirPagina();
    const formulario = within(screen.getByRole("form", { name: "Registrar partida" }));

    await preencherVitoria(usuario, formulario);
    await usuario.click(formulario.getByRole("button", { name: "Registrar partida" }));

    expect(screen.getByRole("status")).toHaveTextContent("Registrando a partida...");
    expect(screen.getByRole("button", { name: "Encerrar sessão" })).toBeDisabled();
    expect(formulario.getByRole("button", { name: "Registrar partida" })).toBeDisabled();

    resolver(PARTIDA);

    expect(await screen.findByText("Partida registrada: 3 × 1.")).toBeInTheDocument();
    expect(screen.queryByText("Registrando a partida...")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Encerrar sessão" })).toBeEnabled();
  });

  it("mostra o erro da API e mantém o que foi digitado", async () => {
    const usuario = userEvent.setup();
    registrarPartida.mockRejectedValue(
      new ErroDaApi("A sessão 1 está encerrada. Não é possível alterar as partidas dela.", 409),
    );
    await abrirPagina();
    const formulario = within(screen.getByRole("form", { name: "Registrar partida" }));

    await preencherVitoria(usuario, formulario);
    await usuario.click(formulario.getByRole("button", { name: "Registrar partida" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A sessão 1 está encerrada");
    expect(formulario.getByLabelText("Seu time")).toHaveValue(3);
  });

  it("edita uma partida pela lista", async () => {
    const usuario = userEvent.setup();
    listarPartidas.mockResolvedValue([PARTIDA]);
    editarPartida.mockResolvedValue({ ...PARTIDA, mmr_depois: 1012 });
    const lista = await abrirPagina();

    await usuario.click(lista.getByRole("button", { name: "Editar partida 1" }));
    const edicao = within(lista.getByRole("form", { name: "Editar partida" }));
    await usuario.clear(edicao.getByLabelText("MMR depois da partida"));
    await usuario.type(edicao.getByLabelText("MMR depois da partida"), "1012");
    await usuario.click(edicao.getByRole("button", { name: "Salvar alterações" }));

    expect(editarPartida).toHaveBeenCalledWith(10, {
      gols_pro: 3,
      gols_contra: 1,
      overtime: false,
      mmr_depois: 1012,
      companheiro: null,
      notas: null,
    });
    expect(await screen.findByText("Partida atualizada.")).toBeInTheDocument();
    expect(lista.queryByRole("form", { name: "Editar partida" })).not.toBeInTheDocument();
    expect(lista.getByRole("listitem")).toHaveTextContent("MMR 1012");
  });

  it("cancela a edição sem chamar a API", async () => {
    const usuario = userEvent.setup();
    listarPartidas.mockResolvedValue([PARTIDA]);
    const lista = await abrirPagina();

    await usuario.click(lista.getByRole("button", { name: "Editar partida 1" }));
    await usuario.click(lista.getByRole("button", { name: "Cancelar" }));

    expect(editarPartida).not.toHaveBeenCalled();
    expect(lista.queryByRole("form", { name: "Editar partida" })).not.toBeInTheDocument();
    expect(lista.getByRole("button", { name: "Editar partida 1" })).toBeInTheDocument();
  });

  it("exclui uma partida depois de confirmar", async () => {
    const usuario = userEvent.setup();
    const confirmar = vi.spyOn(window, "confirm").mockReturnValue(true);
    listarPartidas.mockResolvedValue([PARTIDA]);
    removerPartida.mockResolvedValue(null);
    const lista = await abrirPagina();

    await usuario.click(lista.getByRole("button", { name: "Excluir partida 1" }));

    expect(confirmar).toHaveBeenCalledWith("Excluir a partida 1? Isso não pode ser desfeito.");
    expect(removerPartida).toHaveBeenCalledWith(10);
    expect(await screen.findByText("Partida 1 excluída.")).toBeInTheDocument();
    expect(lista.getByText(/Nenhuma partida registrada ainda/)).toBeInTheDocument();
  });

  it("a sessão seguinte começa com a lista vazia", async () => {
    const usuario = userEvent.setup();
    listarPartidas.mockResolvedValue([PARTIDA]);
    encerrarSessao.mockResolvedValue({ ...SESSAO_ABERTA, status: "encerrada" });
    iniciarSessao.mockResolvedValue({ ...SESSAO_ABERTA, id: 2 });
    await abrirPagina();

    await usuario.click(screen.getByRole("button", { name: "Encerrar sessão" }));
    await usuario.type(await screen.findByLabelText("MMR inicial"), "1009");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    const lista = within(await screen.findByRole("region", { name: "Partidas da sessão" }));
    expect(lista.getByText(/Nenhuma partida registrada ainda/)).toBeInTheDocument();
  });

  it("não exclui quando o jogador desiste na confirmação", async () => {
    const usuario = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    listarPartidas.mockResolvedValue([PARTIDA]);
    const lista = await abrirPagina();

    await usuario.click(lista.getByRole("button", { name: "Excluir partida 1" }));

    expect(removerPartida).not.toHaveBeenCalled();
    expect(lista.getByRole("listitem")).toHaveTextContent("3 × 1");
  });
});
