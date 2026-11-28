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
export const LIMITE_COMPANHEIRO = 50;
export const LIMITE_NOTAS = 500;

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

/**
 * MMR antes de uma partida: o da partida anterior na lista ou, para a
 * primeira, o MMR inicial da sessao. Sem `partidaId`, e o MMR antes da
 * proxima partida, a que vai ser registrada. E a mesma conta da API.
 */
export function mmrAntesDe(partidas, mmrInicial, partidaId) {
  const posicao =
    partidaId === undefined ? partidas.length : partidas.findIndex((p) => p.id === partidaId);
  return posicao > 0 ? partidas[posicao - 1].mmr_depois : mmrInicial;
}

/**
 * Valida o formulario de partida (registrar ou editar).
 *
 * Alem do formato dos campos, confere as regras do Rocket League que a API
 * tambem confere: nao existe empate, o overtime acaba no primeiro gol e, com
 * `mmrAntes` (o MMR antes da partida), vitoria sobe o MMR e derrota baixa. A
 * regra do 1v1 sem companheiro fica no formulario, que nem mostra o campo.
 */
export function validarPartida(
  { gols_pro, gols_contra, overtime, mmr_depois, companheiro = "", notas = "" },
  mmrAntes,
) {
  const erros = {};
  const erroPro = validarInteiroNaoNegativo(gols_pro, "o placar do seu time");
  const erroContra = validarInteiroNaoNegativo(gols_contra, "o placar do adversário");
  if (erroPro) {
    erros.gols_pro = erroPro;
  }
  if (erroContra) {
    erros.gols_contra = erroContra;
  }
  // As regras do placar so fazem sentido com os dois numeros validos.
  if (!erroPro && !erroContra) {
    const diferenca = Math.abs(Number(gols_pro) - Number(gols_contra));
    if (diferenca === 0) {
      erros.placar = "No Rocket League não existe empate: o placar precisa ter um vencedor.";
    } else if (overtime && diferenca !== 1) {
      erros.overtime = "O overtime termina no primeiro gol, então a diferença precisa ser de 1.";
    }
  }
  const erroMmr = validarInteiroNaoNegativo(mmr_depois, "o MMR depois da partida");
  if (erroMmr) {
    erros.mmr_depois = erroMmr;
  }
  // So da para saber se o MMR subiu ou caiu com o placar e o MMR validos.
  const temVencedor = !erroPro && !erroContra && !erros.placar;
  if (temVencedor && !erroMmr && mmrAntes !== undefined) {
    const venceu = Number(gols_pro) > Number(gols_contra);
    const mmr = Number(mmr_depois);
    if (venceu && mmr <= mmrAntes) {
      erros.mmr_depois = `Numa vitória o MMR sobe: precisa ser maior que ${mmrAntes}.`;
    } else if (!venceu && mmr >= mmrAntes) {
      erros.mmr_depois = `Numa derrota o MMR cai: precisa ser menor que ${mmrAntes}.`;
    }
  }
  if (companheiro.length > LIMITE_COMPANHEIRO) {
    erros.companheiro = `O companheiro pode ter no máximo ${LIMITE_COMPANHEIRO} caracteres.`;
  }
  if (notas.length > LIMITE_NOTAS) {
    erros.notas = `As notas podem ter no máximo ${LIMITE_NOTAS} caracteres.`;
  }
  return erros;
}
