/**
 * Testes de integracao da pagina.
 *
 * Diferente dos unitarios, aqui varios componentes trabalham juntos:
 * formulario, validacao, estado da pagina, busca e lista. O que se verifica
 * e o fluxo do usuario, pelo que ele ve na tela, e nao a implementacao.
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import UsersPage from "../../src/pages/UsersPage.jsx";

/**
 * Preenche o formulario e envia.
 *
 * O `type` do user-event recusa string vazia, entao campos vazios so sao
 * limpos — e assim que se testa o envio sem preencher.
 */
async function preencher(usuario, rotulo, texto) {
  const campo = screen.getByLabelText(rotulo);
  await usuario.clear(campo);
  if (texto !== "") {
    await usuario.type(campo, texto);
  }
}

async function cadastrar(usuario, nome, email) {
  await preencher(usuario, "Nome", nome);
  await preencher(usuario, "Email", email);
  await usuario.click(screen.getByRole("button", { name: "Adicionar" }));
}

describe("UsersPage", () => {
  let usuario;

  beforeEach(() => {
    usuario = userEvent.setup();
    render(<UsersPage />);
  });

  it("começa vazia", () => {
    expect(screen.getByText("Nenhum usuário cadastrado ainda.")).toBeInTheDocument();
    expect(screen.getByText("0 usuário(s) cadastrado(s)")).toBeInTheDocument();
  });

  it("cadastra um usuário e mostra na lista", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("ana@teste.com")).toBeInTheDocument();
    expect(screen.getByText("1 usuário(s) cadastrado(s)")).toBeInTheDocument();
  });

  it("normaliza o email ao cadastrar", async () => {
    await cadastrar(usuario, "Ana", "  Ana@Teste.COM  ");

    expect(screen.getByText("ana@teste.com")).toBeInTheDocument();
  });

  it("limpa o formulário depois de cadastrar", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");

    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });

  it("recusa o formulário vazio e não cadastra nada", async () => {
    await usuario.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
    expect(screen.getByText("Informe o email.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum usuário cadastrado ainda.")).toBeInTheDocument();
  });

  it("recusa email sem arroba", async () => {
    await cadastrar(usuario, "Ana", "ana.teste.com");

    expect(screen.getByText("Email invalido: falta o @.")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
  });

  it("recusa email já cadastrado", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");
    await cadastrar(usuario, "Outra Ana", "ana@teste.com");

    expect(screen.getByText("Este email ja esta cadastrado.")).toBeInTheDocument();
    expect(screen.getByText("1 usuário(s) cadastrado(s)")).toBeInTheDocument();
  });

  it("remove um usuário da lista", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");
    await cadastrar(usuario, "Bruno", "bruno@teste.com");

    await usuario.click(screen.getByRole("button", { name: "Remover Ana" }));

    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByText("1 usuário(s) cadastrado(s)")).toBeInTheDocument();
  });

  it("filtra a lista pela busca", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");
    await cadastrar(usuario, "Bruno", "bruno@teste.com");

    await usuario.type(screen.getByLabelText("Buscar por nome"), "bru");

    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.getByText("1 de 2 usuário(s)")).toBeInTheDocument();
  });

  it("a busca ignora maiúsculas e minúsculas", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");

    await usuario.type(screen.getByLabelText("Buscar por nome"), "ANA");

    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("limpar a busca traz todos de volta", async () => {
    await cadastrar(usuario, "Ana", "ana@teste.com");
    await cadastrar(usuario, "Bruno", "bruno@teste.com");

    const busca = screen.getByLabelText("Buscar por nome");
    await usuario.type(busca, "ana");
    await usuario.clear(busca);

    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
  });

  it("o erro some depois de corrigir o campo", async () => {
    await cadastrar(usuario, "", "ana@teste.com");
    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();

    await cadastrar(usuario, "Ana", "ana@teste.com");

    expect(screen.queryByText("Informe o nome.")).not.toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });
});
