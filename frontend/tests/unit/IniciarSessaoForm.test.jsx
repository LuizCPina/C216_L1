/**
 * Testes unitarios do formulario de nova sessao.
 *
 * O componente nao chama a API: so valida e entrega os dados por onIniciar.
 * Por isso basta um vi.fn() no lugar da pagina.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import IniciarSessaoForm from "../../src/components/IniciarSessaoForm.jsx";

describe("IniciarSessaoForm", () => {
  it("entrega os dados no formato da API", async () => {
    const usuario = userEvent.setup();
    const onIniciar = vi.fn();
    render(<IniciarSessaoForm onIniciar={onIniciar} />);

    await usuario.selectOptions(screen.getByLabelText("Playlist"), "3v3");
    await usuario.type(screen.getByLabelText("MMR inicial"), "985");
    await usuario.type(screen.getByLabelText("Observações (opcional)"), "  Trio com a galera  ");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(onIniciar).toHaveBeenCalledWith({
      playlist: "3v3",
      mmr_inicial: 985,
      observacoes: "Trio com a galera",
    });
  });

  it("manda observações vazias como null", async () => {
    const usuario = userEvent.setup();
    const onIniciar = vi.fn();
    render(<IniciarSessaoForm onIniciar={onIniciar} />);

    await usuario.type(screen.getByLabelText("MMR inicial"), "1000");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(onIniciar).toHaveBeenCalledWith({
      playlist: "2v2",
      mmr_inicial: 1000,
      observacoes: null,
    });
  });

  it("não envia sem o MMR e mostra o erro no campo", async () => {
    const usuario = userEvent.setup();
    const onIniciar = vi.fn();
    render(<IniciarSessaoForm onIniciar={onIniciar} />);

    await usuario.click(screen.getByRole("button", { name: "Iniciar sessão" }));

    expect(onIniciar).not.toHaveBeenCalled();
    expect(screen.getByText("Informe o MMR inicial.")).toBeInTheDocument();
    expect(screen.getByLabelText("MMR inicial")).toHaveAttribute("aria-invalid", "true");
  });

  it("trava o botão enquanto a página está ocupada", () => {
    render(<IniciarSessaoForm onIniciar={vi.fn()} ocupado />);

    expect(screen.getByRole("button", { name: "Iniciar sessão" })).toBeDisabled();
  });
});
