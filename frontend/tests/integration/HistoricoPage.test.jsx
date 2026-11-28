/**
 * Testes de integracao da pagina de historico.
 *
 * Filtro, cards, lista e estado da pagina juntos; so a API e simulada.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ErroDaApi,
  estatisticasDaSessao,
  estatisticasGerais,
  listarSessoes,
} from "../../src/api.js";
import HistoricoPage from "../../src/pages/HistoricoPage.jsx";

vi.mock("../../src/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listarSessoes: vi.fn(),
  estatisticasGerais: vi.fn(),
  estatisticasDaSessao: vi.fn(),
}));

const SESSOES = [
  {
    id: 5,
    playlist: "3v3",
    mmr_inicial: 1012,
    status: "encerrada",
    iniciada_em: "2026-11-26T12:00:00Z",
    encerrada_em: "2026-11-26T13:00:00Z",
    observacoes: null,
  },
  {
    id: 4,
    playlist: "2v2",
    mmr_inicial: 1000,
    status: "encerrada",
    iniciada_em: "2026-11-25T12:00:00Z",
    encerrada_em: "2026-11-25T13:00:00Z",
    observacoes: null,
  },
];

const RESUMO = {
  partidas: 0,
  vitorias: 0,
  derrotas: 0,
  taxa_vitoria: 0,
  gols_pro: 0,
  gols_contra: 0,
  saldo_gols: 0,
  sequencia: null,
  variacao_mmr: 0,
};

const GERAIS = {
  ...RESUMO,
  partidas: 4,
  vitorias: 3,
  derrotas: 1,
  taxa_vitoria: 75,
  sequencia: { resultado: "vitoria", quantidade: 2 },
  variacao_mmr: 20,
  playlist: null,
  sessoes: 2,
};

/** Numeros de cada sessao, pelo id: a 5 ganhou 1 e a 4 ganhou 2 e perdeu 1. */
const POR_SESSAO = {
  5: { ...RESUMO, partidas: 1, vitorias: 1, taxa_vitoria: 100, mmr_atual: 1020, variacao_mmr: 8 },
  4: {
    ...RESUMO,
    partidas: 3,
    vitorias: 2,
    derrotas: 1,
    taxa_vitoria: 66.7,
    mmr_atual: 1012,
    variacao_mmr: 12,
  },
};

beforeEach(() => {
  vi.resetAllMocks();
  estatisticasGerais.mockResolvedValue(GERAIS);
  listarSessoes.mockResolvedValue(SESSOES);
  estatisticasDaSessao.mockImplementation(async (id) => POR_SESSAO[id]);
});

describe("HistoricoPage", () => {
  it("mostra o resumo geral e as sessões encerradas com os números de cada uma", async () => {
    render(<HistoricoPage />);

    expect(screen.getByText("Carregando o histórico...")).toBeInTheDocument();
    const resumo = await screen.findByRole("region", { name: "Resumo geral" });
    expect(resumo).toHaveTextContent("2 sessões no total");
    expect(resumo).toHaveTextContent("75%");

    expect(listarSessoes).toHaveBeenCalledWith({ playlist: "", status: "encerrada" });
    expect(estatisticasDaSessao).toHaveBeenCalledWith(5);
    expect(estatisticasDaSessao).toHaveBeenCalledWith(4);

    const [maisNova, maisVelha] = within(
      screen.getByRole("region", { name: "Sessões encerradas" }),
    ).getAllByRole("listitem");
    expect(maisNova).toHaveTextContent("1 vitória e 0 derrotas · MMR 1012 → 1020 (+8)");
    expect(maisNova).toHaveTextContent("100% de vitórias");
    expect(maisVelha).toHaveTextContent("2 vitórias e 1 derrota · MMR 1000 → 1012 (+12)");
    expect(maisVelha).toHaveTextContent("66,7% de vitórias");
  });

  it("busca de novo quando o filtro de playlist muda", async () => {
    const usuario = userEvent.setup();
    render(<HistoricoPage />);
    await screen.findByRole("region", { name: "Resumo geral" });

    listarSessoes.mockResolvedValue([]);
    estatisticasGerais.mockResolvedValue({ ...GERAIS, playlist: "1v1", sessoes: 1 });
    await usuario.selectOptions(screen.getByLabelText("Playlist"), "1v1");

    expect(await screen.findByText("Nenhuma sessão 1v1 encerrada.")).toBeInTheDocument();
    expect(estatisticasGerais).toHaveBeenLastCalledWith({ playlist: "1v1" });
    expect(listarSessoes).toHaveBeenLastCalledWith({ playlist: "1v1", status: "encerrada" });
    expect(screen.getByRole("region", { name: "Resumo geral" })).toHaveTextContent(
      "1 sessão no total",
    );
  });

  it("se a troca de filtro falha, não mostra os números do filtro anterior", async () => {
    const usuario = userEvent.setup();
    render(<HistoricoPage />);
    await screen.findByRole("region", { name: "Resumo geral" });

    estatisticasGerais.mockRejectedValue(
      new ErroDaApi("Não foi possível falar com a API. Ela está no ar?", 0),
    );
    await usuario.selectOptions(screen.getByLabelText("Playlist"), "2v2");

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível falar com a API");
    expect(screen.queryByRole("region", { name: "Resumo geral" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Sessões encerradas" })).not.toBeInTheDocument();
  });

  it("trava o filtro enquanto carrega", async () => {
    render(<HistoricoPage />);

    expect(screen.getByLabelText("Playlist")).toBeDisabled();
    await screen.findByRole("region", { name: "Resumo geral" });
    expect(screen.getByLabelText("Playlist")).toBeEnabled();
  });

  it("avisa quando a API está fora do ar e deixa tentar de novo", async () => {
    const usuario = userEvent.setup();
    estatisticasGerais
      .mockRejectedValueOnce(new ErroDaApi("Não foi possível falar com a API. Ela está no ar?", 0))
      .mockResolvedValueOnce(GERAIS);
    render(<HistoricoPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível falar com a API");
    expect(screen.queryByRole("region", { name: "Resumo geral" })).not.toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: "Tentar de novo" }));

    expect(await screen.findByRole("region", { name: "Resumo geral" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
