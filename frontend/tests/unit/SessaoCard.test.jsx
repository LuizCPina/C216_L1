/** Testes unitarios do resumo da sessao atual. */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SessaoCard from "../../src/components/SessaoCard.jsx";

const SESSAO = {
  id: 3,
  playlist: "2v2",
  mmr_inicial: 1000,
  status: "aberta",
  iniciada_em: "2026-11-26T12:00:00Z",
  encerrada_em: null,
  observacoes: "Duo com o Pedro",
};

describe("SessaoCard", () => {
  it("mostra a playlist, o MMR inicial e as observações", () => {
    render(<SessaoCard sessao={SESSAO} onEncerrar={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Sessão atual" })).toBeInTheDocument();
    expect(screen.getByText("2v2")).toBeInTheDocument();
    expect(screen.getByText("1000")).toBeInTheDocument();
    expect(screen.getByText("Duo com o Pedro")).toBeInTheDocument();
  });

  it("mostra o MMR atual e quanto ele mudou, na cor do sinal", () => {
    render(<SessaoCard sessao={SESSAO} mmrAtual={1012} variacaoMmr={12} onEncerrar={vi.fn()} />);

    expect(screen.getByText("MMR atual").parentElement).toHaveTextContent("1012 (+12)");
    expect(screen.getByText("(+12)")).toHaveClass("text-emerald-700");
  });

  it("mostra a queda de MMR em vermelho", () => {
    render(<SessaoCard sessao={SESSAO} mmrAtual={991} variacaoMmr={-9} onEncerrar={vi.fn()} />);

    expect(screen.getByText("(-9)")).toHaveClass("text-red-700");
  });

  it("esconde o MMR atual enquanto ele não chegou", () => {
    render(<SessaoCard sessao={SESSAO} onEncerrar={vi.fn()} />);

    expect(screen.queryByText("MMR atual")).not.toBeInTheDocument();
  });

  it("esconde as observações quando não há nenhuma", () => {
    render(<SessaoCard sessao={{ ...SESSAO, observacoes: null }} onEncerrar={vi.fn()} />);

    expect(screen.queryByText("Observações")).not.toBeInTheDocument();
  });

  it("avisa quando o botão de encerrar é clicado", async () => {
    const onEncerrar = vi.fn();
    render(<SessaoCard sessao={SESSAO} onEncerrar={onEncerrar} />);

    await userEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));

    expect(onEncerrar).toHaveBeenCalledTimes(1);
  });

  it("trava o botão enquanto a página está ocupada", () => {
    render(<SessaoCard sessao={SESSAO} onEncerrar={vi.fn()} ocupado />);

    expect(screen.getByRole("button", { name: "Encerrar sessão" })).toBeDisabled();
  });
});
