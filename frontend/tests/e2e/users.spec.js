/**
 * Testes end-to-end com Playwright.
 *
 * Aqui a aplicacao roda de verdade: o Vite sobe, o Chromium abre a pagina e
 * os cliques sao cliques de navegador. E o nivel que pega problemas que o
 * jsdom nao ve, como um build quebrado ou um script que nao carrega.
 *
 * Os seletores usam `exact: true` de proposito. O getByLabel e o getByText do
 * Playwright casam por trecho e sem diferenciar maiusculas, entao "Nome"
 * encontraria tambem "Buscar por nome", e "Ana" encontraria "ana@teste.com".
 */

import { expect, test } from "@playwright/test";

/** O nome do usuario na lista, sem casar com o email. */
function nomeNaLista(page, nome) {
  return page.getByText(nome, { exact: true });
}

/** Preenche o formulario e envia. */
async function cadastrar(page, nome, email) {
  await page.getByLabel("Nome", { exact: true }).fill(nome);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Adicionar" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("a página carrega com o título e a lista vazia", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Gerenciador de usuários" })).toBeVisible();
  await expect(page.getByText("Nenhum usuário cadastrado ainda.")).toBeVisible();
});

test("cadastra um usuário e vê na lista", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");

  await expect(nomeNaLista(page, "Ana")).toBeVisible();
  await expect(page.getByText("ana@teste.com")).toBeVisible();
  await expect(page.getByText("1 usuário(s) cadastrado(s)")).toBeVisible();
});

test("normaliza o email digitado em maiúsculas", async ({ page }) => {
  await cadastrar(page, "Ana", "  Ana@Teste.COM  ");

  await expect(page.getByText("ana@teste.com")).toBeVisible();
});

test("limpa o formulário depois de cadastrar", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");

  await expect(page.getByLabel("Nome", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue("");
});

test("mostra erro ao enviar o formulário vazio", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByText("Informe o nome.")).toBeVisible();
  await expect(page.getByText("Informe o email.")).toBeVisible();
  await expect(page.getByText("Nenhum usuário cadastrado ainda.")).toBeVisible();
});

test("recusa email sem arroba", async ({ page }) => {
  await cadastrar(page, "Ana", "ana.teste.com");

  await expect(page.getByText("Email invalido: falta o @.")).toBeVisible();
  await expect(nomeNaLista(page, "Ana")).toBeHidden();
});

test("recusa email repetido", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");
  await cadastrar(page, "Outra Ana", "ana@teste.com");

  await expect(page.getByText("Este email ja esta cadastrado.")).toBeVisible();
  await expect(page.getByText("1 usuário(s) cadastrado(s)")).toBeVisible();
});

test("remove um usuário", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");
  await cadastrar(page, "Bruno", "bruno@teste.com");

  await page.getByRole("button", { name: "Remover Ana" }).click();

  await expect(nomeNaLista(page, "Ana")).toBeHidden();
  await expect(nomeNaLista(page, "Bruno")).toBeVisible();
  await expect(page.getByText("1 usuário(s) cadastrado(s)")).toBeVisible();
});

test("filtra a lista pela busca", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");
  await cadastrar(page, "Bruno", "bruno@teste.com");

  await page.getByLabel("Buscar por nome").fill("bru");

  await expect(nomeNaLista(page, "Bruno")).toBeVisible();
  await expect(nomeNaLista(page, "Ana")).toBeHidden();
  await expect(page.getByText("1 de 2 usuário(s)")).toBeVisible();
});

test("os dados não sobrevivem a um reload, por não haver persistência", async ({ page }) => {
  await cadastrar(page, "Ana", "ana@teste.com");
  await expect(nomeNaLista(page, "Ana")).toBeVisible();

  await page.reload();

  await expect(page.getByText("Nenhum usuário cadastrado ainda.")).toBeVisible();
});
