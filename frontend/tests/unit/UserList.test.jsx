/**
 * Testes unitarios do UserList.
 *
 * O componente e de apresentacao: recebe props e devolve eventos. Por isso
 * da para testa-lo sozinho, sem a pagina em volta.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import UserList from "../../src/components/UserList.jsx";

const USUARIOS = [
  { id: 1, nome: "Ana", email: "ana@teste.com" },
  { id: 2, nome: "Bruno", email: "bruno@teste.com" },
];

describe("UserList", () => {
  it("mostra aviso quando não há usuários", () => {
    render(<UserList usuarios={[]} onRemover={vi.fn()} />);

    expect(screen.getByText("Nenhum usuário cadastrado ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lista um item por usuário", () => {
    render(<UserList usuarios={USUARIOS} onRemover={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("bruno@teste.com")).toBeInTheDocument();
  });

  it("chama onRemover com o id do usuário clicado", async () => {
    const onRemover = vi.fn();
    render(<UserList usuarios={USUARIOS} onRemover={onRemover} />);

    await userEvent.click(screen.getByRole("button", { name: "Remover Bruno" }));

    expect(onRemover).toHaveBeenCalledTimes(1);
    expect(onRemover).toHaveBeenCalledWith(2);
  });
});
