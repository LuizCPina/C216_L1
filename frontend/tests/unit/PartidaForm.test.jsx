/**
 * Testes unitarios do formulario de partida.
 *
 * Como o IniciarSessaoForm, ele nao chama a API: valida e entrega os dados por
 * onSalvar. O vi.fn() faz o papel da pagina.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PartidaForm from "../../src/components/PartidaForm.jsx";

const PARTIDA = {
  id: 7,
  sessao_id: 1,
  gols_pro: 2,
  gols_contra: 1,
  overtime: true,
  mmr_depois: 1009,
  companheiro: "Davi",
  notas: "Gol de aéreo no fim",
  resultado: "vitoria",
  jogada_em: "2026-11-26T12:30:00Z",
};

/** Preenche o placar e o MMR, os campos obrigatorios. */
async function preencher(usuario, { pro, contra, mmr }) {
  await usuario.type(screen.getByLabelText("Seu time"), pro);
  await usuario.type(screen.getByLabelText("Adversário"), contra);
  await usuario.type(screen.getByLabelText("MMR depois da partida"), mmr);
}

describe("PartidaForm", () => {
  it("entrega os dados no formato da API", async () => {
    const usuario = userEvent.setup();
    const onSalvar = vi.fn();
    render(<PartidaForm playlist="2v2" onSalvar={onSalvar} />);

    await preencher(usuario, { pro: "2", contra: "1", mmr: "1009" });
    await usuario.click(screen.getByLabelText("Foi para o overtime"));
    await usuario.type(screen.getByLabelText("Companheiro (opcional)"), "  Davi ");
    await usuario.type(screen.getByLabelText("Notas (opcional)"), " Gol de aéreo no fim ");
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(onSalvar).toHaveBeenCalledWith({
      gols_pro: 2,
      gols_contra: 1,
      overtime: true,
      mmr_depois: 1009,
      companheiro: "Davi",
      notas: "Gol de aéreo no fim",
    });
  });

  it("manda companheiro e notas vazios como null", async () => {
    const usuario = userEvent.setup();
    const onSalvar = vi.fn();
    render(<PartidaForm playlist="2v2" onSalvar={onSalvar} />);

    await preencher(usuario, { pro: "0", contra: "3", mmr: "990" });
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(onSalvar).toHaveBeenCalledWith({
      gols_pro: 0,
      gols_contra: 3,
      overtime: false,
      mmr_depois: 990,
      companheiro: null,
      notas: null,
    });
  });

  it("não mostra o companheiro em sessão 1v1", () => {
    render(<PartidaForm playlist="1v1" onSalvar={vi.fn()} />);

    expect(screen.queryByLabelText("Companheiro (opcional)")).not.toBeInTheDocument();
  });

  it("não envia empate e mostra o erro no placar", async () => {
    const usuario = userEvent.setup();
    const onSalvar = vi.fn();
    render(<PartidaForm playlist="2v2" onSalvar={onSalvar} />);

    await preencher(usuario, { pro: "2", contra: "2", mmr: "1000" });
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(onSalvar).not.toHaveBeenCalled();
    expect(screen.getByRole("group", { name: "Placar" })).toHaveAccessibleDescription(
      "No Rocket League não existe empate: o placar precisa ter um vencedor.",
    );
  });

  it("não envia overtime com mais de um gol de diferença", async () => {
    const usuario = userEvent.setup();
    const onSalvar = vi.fn();
    render(<PartidaForm playlist="2v2" onSalvar={onSalvar} />);

    await preencher(usuario, { pro: "4", contra: "1", mmr: "1010" });
    await usuario.click(screen.getByLabelText("Foi para o overtime"));
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(onSalvar).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Foi para o overtime")).toHaveAccessibleDescription(
      "O overtime termina no primeiro gol, então a diferença precisa ser de 1.",
    );
  });

  it("mostra o erro de cada campo obrigatório", async () => {
    const usuario = userEvent.setup();
    render(<PartidaForm playlist="2v2" onSalvar={vi.fn()} />);

    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(screen.getByLabelText("Seu time")).toHaveAccessibleDescription(
      "Informe o placar do seu time.",
    );
    expect(screen.getByLabelText("Adversário")).toHaveAccessibleDescription(
      "Informe o placar do adversário.",
    );
    expect(screen.getByLabelText("MMR depois da partida")).toHaveAttribute("aria-invalid", "true");
  });

  it("volta a ficar vazio quando a página salvou", async () => {
    const usuario = userEvent.setup();
    render(<PartidaForm playlist="2v2" onSalvar={vi.fn().mockResolvedValue(true)} />);

    await preencher(usuario, { pro: "3", contra: "0", mmr: "1015" });
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(screen.getByLabelText("Seu time")).toHaveValue(null);
    expect(screen.getByLabelText("MMR depois da partida")).toHaveValue(null);
  });

  it("mantém o que foi digitado quando a página não conseguiu salvar", async () => {
    const usuario = userEvent.setup();
    render(<PartidaForm playlist="2v2" onSalvar={vi.fn().mockResolvedValue(false)} />);

    await preencher(usuario, { pro: "3", contra: "0", mmr: "1015" });
    await usuario.click(screen.getByRole("button", { name: "Registrar partida" }));

    expect(screen.getByLabelText("Seu time")).toHaveValue(3);
  });

  it("na edição começa preenchido e deixa cancelar", async () => {
    const usuario = userEvent.setup();
    const onCancelar = vi.fn();
    render(
      <PartidaForm playlist="2v2" partida={PARTIDA} onSalvar={vi.fn()} onCancelar={onCancelar} />,
    );

    expect(screen.getByRole("form", { name: "Editar partida" })).toBeInTheDocument();
    expect(screen.getByLabelText("Seu time")).toHaveValue(2);
    expect(screen.getByLabelText("Adversário")).toHaveValue(1);
    expect(screen.getByLabelText("Foi para o overtime")).toBeChecked();
    expect(screen.getByLabelText("MMR depois da partida")).toHaveValue(1009);
    expect(screen.getByLabelText("Companheiro (opcional)")).toHaveValue("Davi");
    expect(screen.getByLabelText("Notas (opcional)")).toHaveValue("Gol de aéreo no fim");

    await usuario.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalled();
  });

  it("na edição entrega os dados alterados", async () => {
    const usuario = userEvent.setup();
    const onSalvar = vi.fn();
    render(<PartidaForm playlist="2v2" partida={PARTIDA} onSalvar={onSalvar} />);

    await usuario.clear(screen.getByLabelText("MMR depois da partida"));
    await usuario.type(screen.getByLabelText("MMR depois da partida"), "1011");
    await usuario.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSalvar).toHaveBeenCalledWith({
      gols_pro: 2,
      gols_contra: 1,
      overtime: true,
      mmr_depois: 1011,
      companheiro: "Davi",
      notas: "Gol de aéreo no fim",
    });
  });

  it("trava os botões enquanto a página está ocupada", () => {
    render(<PartidaForm playlist="2v2" partida={PARTIDA} onSalvar={vi.fn()} ocupado />);

    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
  });
});
