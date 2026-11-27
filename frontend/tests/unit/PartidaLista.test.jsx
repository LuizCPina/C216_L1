/** Testes unitarios da lista de partidas da sessao. */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PartidaLista from "../../src/components/PartidaLista.jsx";

const PARTIDAS = [
  {
    id: 10,
    sessao_id: 1,
    gols_pro: 2,
    gols_contra: 1,
    overtime: true,
    mmr_depois: 1009,
    companheiro: "Davi",
    notas: "Gol de aéreo no fim",
    resultado: "vitoria",
    jogada_em: "2026-11-26T12:30:00Z",
  },
  {
    id: 11,
    sessao_id: 1,
    gols_pro: 0,
    gols_contra: 3,
    overtime: false,
    mmr_depois: 1000,
    companheiro: null,
    notas: null,
    resultado: "derrota",
    jogada_em: "2026-11-26T12:40:00Z",
  },
];

function renderizar(props = {}) {
  render(<PartidaLista partidas={PARTIDAS} onEditar={vi.fn()} onExcluir={vi.fn()} {...props} />);
}

describe("PartidaLista", () => {
  it("avisa quando a sessão ainda não tem partidas", () => {
    renderizar({ partidas: [] });

    expect(screen.getByText(/Nenhuma partida registrada ainda/)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("mostra cada partida na ordem em que foi jogada", () => {
    renderizar();

    const [primeira, segunda] = screen.getAllByRole("listitem");
    expect(primeira).toHaveTextContent("Vitória");
    expect(primeira).toHaveTextContent("2 × 1");
    expect(primeira).toHaveTextContent("overtime");
    expect(primeira).toHaveTextContent("MMR 1009");
    expect(primeira).toHaveTextContent("Com Davi");
    expect(primeira).toHaveTextContent("Gol de aéreo no fim");

    expect(segunda).toHaveTextContent("Derrota");
    expect(segunda).toHaveTextContent("0 × 3");
    expect(segunda).not.toHaveTextContent("overtime");
    expect(segunda).not.toHaveTextContent("Com");
  });

  it("pinta o placar com as cores dos times: o seu em azul e o adversário em laranja", () => {
    renderizar();

    const [, segunda] = screen.getAllByRole("listitem");
    expect(within(segunda).getByText("0")).toHaveClass("text-blue-700");
    expect(within(segunda).getByText("3")).toHaveClass("text-orange-700");
  });

  it("mostra quanto o MMR mudou em cada partida, com a cor do sinal", () => {
    renderizar({ variacoes: { 10: 9, 11: -9 } });

    expect(screen.getByText("(+9)")).toHaveClass("text-emerald-700");
    expect(screen.getByText("(-9)")).toHaveClass("text-red-700");
    // Espaco de verdade antes da variacao, nao so margem: leitor de tela e
    // copiar e colar tambem precisam dele.
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("MMR 1009 (+9)");
  });

  it("deixa sem variação a partida que ainda não está nos números", () => {
    renderizar({ variacoes: { 10: 9 } });

    const [, segunda] = screen.getAllByRole("listitem");
    expect(segunda).toHaveTextContent("MMR 1000");
    expect(segunda).not.toHaveTextContent("(");
  });

  it("devolve a partida clicada em editar e excluir", async () => {
    const usuario = userEvent.setup();
    const onEditar = vi.fn();
    const onExcluir = vi.fn();
    renderizar({ onEditar, onExcluir });

    await usuario.click(screen.getByRole("button", { name: "Editar partida 2" }));
    await usuario.click(screen.getByRole("button", { name: "Excluir partida 1" }));

    expect(onEditar).toHaveBeenCalledWith(PARTIDAS[1]);
    expect(onExcluir).toHaveBeenCalledWith(PARTIDAS[0], 1);
  });

  it("mostra o formulário de edição no lugar da partida editada", () => {
    renderizar({ editandoId: 11, formularioDeEdicao: <p>formulário de edição</p> });

    const [primeira, segunda] = screen.getAllByRole("listitem");
    expect(within(segunda).getByText("formulário de edição")).toBeInTheDocument();
    expect(segunda).not.toHaveTextContent("Derrota");
    expect(within(primeira).getByRole("button", { name: "Editar partida 1" })).toBeInTheDocument();
  });

  it("trava os botões enquanto a página está ocupada", () => {
    renderizar({ ocupado: true });

    for (const botao of screen.getAllByRole("button")) {
      expect(botao).toBeDisabled();
    }
  });
});
