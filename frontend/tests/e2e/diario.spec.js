/**
 * Testes end-to-end: o Chromium usa a aplicacao como uma pessoa usaria, com
 * frontend, API e PostgreSQL de verdade (a stack do `make up`).
 *
 * Os testes nao mexem em dados que ja estavam no banco: cada um apaga, pela
 * API, so as sessoes que ele mesmo criou. Como a API so permite uma sessao
 * aberta por vez, eles se recusam a rodar se ja existir uma.
 */

import { expect, test } from "@playwright/test";

const API = process.env.E2E_API_URL ?? "http://localhost:8000";

/** Ids das sessoes criadas no teste atual, apagadas no afterEach. */
let criadas = [];

test.beforeAll(async () => {
  const abertas = await (await fetch(`${API}/sessoes?status=aberta`)).json();
  if (abertas.length > 0) {
    throw new Error(
      "Já existe uma sessão aberta no banco. Encerre-a antes de rodar os testes E2E.",
    );
  }
});

test.afterEach(async () => {
  for (const id of criadas) {
    await fetch(`${API}/sessoes/${id}`, { method: "DELETE" });
  }
  criadas = [];
});

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

/** Inicia uma sessao pela tela e guarda o id dela para a limpeza. */
async function iniciarSessao(page, { playlist, mmr, observacoes }) {
  await page.getByLabel("Playlist", { exact: true }).selectOption(playlist);
  await page.getByLabel("MMR inicial", { exact: true }).fill(mmr);
  if (observacoes) {
    await page.getByLabel("Observações (opcional)", { exact: true }).fill(observacoes);
  }
  const resposta = page.waitForResponse(
    (r) => r.url().endsWith("/sessoes") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Iniciar sessão" }).click();
  criadas.push((await (await resposta).json()).id);
  await expect(page.getByText(`Sessão ${playlist} iniciada.`)).toBeVisible();
}

/** Preenche o formulario de registrar partida e envia. */
async function registrarPartida(page, { pro, contra, mmr }) {
  const formulario = page.getByRole("form", { name: "Registrar partida" });
  await formulario.getByLabel("Seu time", { exact: true }).fill(pro);
  await formulario.getByLabel("Adversário", { exact: true }).fill(contra);
  await formulario.getByLabel("MMR depois da partida", { exact: true }).fill(mmr);
  await formulario.getByRole("button", { name: "Registrar partida" }).click();
}

function listaDePartidas(page) {
  return page.getByRole("region", { name: "Partidas da sessão" });
}

test("inicia uma sessão, registra uma partida e ela continua lá depois de recarregar", async ({
  page,
}) => {
  await iniciarSessao(page, { playlist: "2v2", mmr: "1000" });

  await registrarPartida(page, { pro: "3", contra: "1", mmr: "1009" });
  await expect(page.getByText("Partida registrada: 3 × 1.")).toBeVisible();

  await page.reload();

  const partidas = listaDePartidas(page).getByRole("listitem");
  await expect(partidas).toHaveCount(1);
  await expect(partidas.first()).toContainText("Vitória");
  await expect(partidas.first()).toContainText("3 × 1");
  await expect(partidas.first()).toContainText("MMR 1009 (+9)");
  await expect(page.getByRole("region", { name: "Estatísticas da sessão" })).toContainText("100%");
});

test("placar empatado mostra o erro na tela e não registra nada", async ({ page }) => {
  await iniciarSessao(page, { playlist: "2v2", mmr: "1000" });

  await registrarPartida(page, { pro: "2", contra: "2", mmr: "1000" });

  await expect(
    page.getByText("No Rocket League não existe empate: o placar precisa ter um vencedor."),
  ).toBeVisible();
  await expect(listaDePartidas(page)).toContainText("Nenhuma partida registrada ainda");
});

test("edita e exclui uma partida", async ({ page }) => {
  await iniciarSessao(page, { playlist: "2v2", mmr: "1000" });
  await registrarPartida(page, { pro: "1", contra: "2", mmr: "992" });
  await expect(page.getByText("Partida registrada: 1 × 2.")).toBeVisible();

  const lista = listaDePartidas(page);
  await lista.getByRole("button", { name: "Editar partida 1" }).click();
  const edicao = lista.getByRole("form", { name: "Editar partida" });
  await edicao.getByLabel("MMR depois da partida", { exact: true }).fill("994");
  await edicao.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(page.getByText("Partida atualizada.")).toBeVisible();
  await expect(lista.getByRole("listitem")).toContainText("MMR 994 (-6)");

  page.once("dialog", (dialogo) => dialogo.accept());
  await lista.getByRole("button", { name: "Excluir partida 1" }).click();
  await expect(page.getByText("Partida 1 excluída.")).toBeVisible();

  await page.reload();
  await expect(listaDePartidas(page)).toContainText("Nenhuma partida registrada ainda");
});

test("o link do cabeçalho abre a documentação da API em outra aba", async ({ page }) => {
  const novaAba = page.waitForEvent("popup");
  await page.getByRole("link", { name: /Documentação da API/ }).click();

  await expect(await novaAba).toHaveTitle(/Swagger UI/);
});

test("a sessão encerrada aparece no histórico com o resumo dela", async ({ page }) => {
  // Texto unico para achar esta sessao mesmo se o banco ja tiver outras.
  const observacoes = `Teste E2E ${Date.now()}`;
  await iniciarSessao(page, { playlist: "3v3", mmr: "900", observacoes });
  await registrarPartida(page, { pro: "4", contra: "2", mmr: "912" });
  await expect(page.getByText("Partida registrada: 4 × 2.")).toBeVisible();

  await page.getByRole("button", { name: "Encerrar sessão" }).click();
  await expect(page.getByRole("form", { name: "Nova sessão" })).toBeVisible();

  await page.getByRole("button", { name: "Histórico" }).click();
  await page.getByLabel("Playlist", { exact: true }).selectOption("3v3");

  const sessao = page
    .getByRole("region", { name: "Sessões encerradas" })
    .getByRole("listitem")
    .filter({ hasText: observacoes });
  await expect(sessao).toContainText("3v3");
  await expect(sessao).toContainText("1 vitória e 0 derrotas · MMR 900 → 912 (+12)");
});
