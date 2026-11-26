/**
 * Cliente HTTP da API do Diario de Ranked.
 *
 * E o unico arquivo do frontend que conhece URLs, metodos e fetch. As telas
 * chamam funcoes com nome de acao (iniciarSessao, registrarPartida...) e
 * recebem os dados prontos, ou um ErroDaApi com a mensagem para mostrar.
 */

// O endereco da API vem da variavel VITE_API_URL (veja .env.example). O Vite
// troca esse valor no build; sem ela, vale a API rodando na maquina local.
const URL_DA_API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

/** Erro de uma chamada a API, com a mensagem pronta para a tela. */
export class ErroDaApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.name = "ErroDaApi";
    // 0 quando nem houve resposta (API fora do ar ou bloqueada).
    this.status = status;
  }
}

/**
 * Transforma o corpo de erro do FastAPI em uma frase.
 *
 * As rotas mandam `detail` como texto ("Sessão 9 não encontrada."). Ja a
 * validacao do Pydantic manda uma lista, com o campo e o problema de cada erro.
 */
export function mensagemDeErro(corpo, status) {
  const detalhe = corpo?.detail;
  if (typeof detalhe === "string") {
    return detalhe;
  }
  if (Array.isArray(detalhe) && detalhe.length > 0) {
    const problemas = detalhe.map((erro) => `${erro.loc?.at(-1)}: ${erro.msg}`);
    return `Dados inválidos (${problemas.join("; ")}).`;
  }
  return `A API respondeu com erro ${status}.`;
}

/** Faz a requisicao e devolve o JSON da resposta, ou null quando nao ha corpo. */
async function requisitar(caminho, { metodo = "GET", corpo } = {}) {
  const opcoes = { method: metodo };
  if (corpo !== undefined) {
    opcoes.headers = { "Content-Type": "application/json" };
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;
  try {
    resposta = await fetch(`${URL_DA_API}${caminho}`, opcoes);
  } catch {
    // O fetch so falha assim quando nao chega resposta nenhuma.
    throw new ErroDaApi("Não foi possível falar com a API. Ela está no ar?", 0);
  }

  if (resposta.status === 204) {
    return null;
  }
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    throw new ErroDaApi(mensagemDeErro(dados, resposta.status), resposta.status);
  }
  return dados;
}

/** Monta a query string so com os filtros preenchidos. */
function comFiltros(caminho, filtros) {
  const preenchidos = Object.entries(filtros).filter(([, valor]) => valor);
  if (preenchidos.length === 0) {
    return caminho;
  }
  return `${caminho}?${new URLSearchParams(preenchidos)}`;
}

// Sessoes

export function listarSessoes({ playlist, status } = {}) {
  return requisitar(comFiltros("/sessoes", { playlist, status }));
}

export function iniciarSessao(dados) {
  return requisitar("/sessoes", { metodo: "POST", corpo: dados });
}

export function atualizarSessao(sessaoId, dados) {
  return requisitar(`/sessoes/${sessaoId}`, { metodo: "PATCH", corpo: dados });
}

export function encerrarSessao(sessaoId) {
  return requisitar(`/sessoes/${sessaoId}/encerrar`, { metodo: "POST" });
}

export function removerSessao(sessaoId) {
  return requisitar(`/sessoes/${sessaoId}`, { metodo: "DELETE" });
}

// Partidas

export function listarPartidas(sessaoId) {
  return requisitar(`/sessoes/${sessaoId}/partidas`);
}

export function registrarPartida(sessaoId, dados) {
  return requisitar(`/sessoes/${sessaoId}/partidas`, { metodo: "POST", corpo: dados });
}

export function editarPartida(partidaId, dados) {
  return requisitar(`/partidas/${partidaId}`, { metodo: "PUT", corpo: dados });
}

export function removerPartida(partidaId) {
  return requisitar(`/partidas/${partidaId}`, { metodo: "DELETE" });
}

// Estatisticas

export function estatisticasDaSessao(sessaoId) {
  return requisitar(`/sessoes/${sessaoId}/estatisticas`);
}

export function estatisticasGerais({ playlist } = {}) {
  return requisitar(comFiltros("/estatisticas", { playlist }));
}
