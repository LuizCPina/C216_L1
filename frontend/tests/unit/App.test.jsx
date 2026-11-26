/**
 * Primeiro teste do frontend: a aplicacao monta e mostra o cabecalho.
 *
 * Serve para provar que Vitest, jsdom e Testing Library estao ligados.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../../src/App.jsx";

describe("App", () => {
  it("mostra o nome da aplicação", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Diário de Ranked" })).toBeInTheDocument();
  });
});
