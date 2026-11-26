/**
 * Validacoes dos formularios.
 *
 * Sao funcoes puras: nao tocam no DOM nem dependem do React, por isso sao
 * testadas sozinhas em tests/unit/validacao.test.js.
 *
 * Os limites vem dos schemas da API (app/schemas). A API continua sendo a
 * autoridade: estas checagens so evitam uma viagem ate ela por um erro obvio
 * de digitacao.
 */

export const PLAYLISTS = ["1v1", "2v2", "3v3"];
export const LIMITE_OBSERVACOES = 500;

/**
 * Erro de um campo que precisa ser inteiro a partir de 0, ou null.
 *
 * O rotulo vem com artigo ("o MMR inicial") para a frase sair natural.
 */
export function validarInteiroNaoNegativo(valor, rotulo) {
  const texto = String(valor ?? "").trim();
  if (texto === "") {
    return `Informe ${rotulo}.`;
  }
  const numero = Number(texto);
  if (!Number.isInteger(numero) || numero < 0) {
    const inicio = rotulo.charAt(0).toUpperCase() + rotulo.slice(1);
    return `${inicio} precisa ser um número inteiro a partir de 0.`;
  }
  return null;
}

/**
 * Valida o formulario de nova sessao.
 *
 * Devolve um objeto com uma chave por campo com erro. Objeto vazio significa
 * formulario valido.
 */
export function validarSessao({ playlist, mmr_inicial, observacoes = "" }) {
  const erros = {};
  if (!PLAYLISTS.includes(playlist)) {
    erros.playlist = "Escolha a playlist.";
  }
  const erroMmr = validarInteiroNaoNegativo(mmr_inicial, "o MMR inicial");
  if (erroMmr) {
    erros.mmr_inicial = erroMmr;
  }
  if (observacoes.length > LIMITE_OBSERVACOES) {
    erros.observacoes = `As observações podem ter no máximo ${LIMITE_OBSERVACOES} caracteres.`;
  }
  return erros;
}
