/**
 * Teste da raiz da aplicacao: ela monta com o cabecalho e a pagina.
 *
 * A API e simulada para o teste nao depender de nada no ar.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "../../src/App.jsx";

vi.mock("../../src/api.js", async (importOriginal) => ({
  ...(await importOriginal()),
  listarSessoes: vi.fn().mockResolvedValue([]),
}));

describe("App", () => {
  it("mostra o nome da aplicação e a página da sessão atual", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Diário de Ranked" })).toBeInTheDocument();
    expect(await screen.findByRole("form", { name: "Nova sessão" })).toBeInTheDocument();
  });
});
