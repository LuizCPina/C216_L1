/**
 * Formatacao de valores para a tela.
 *
 * Funcoes puras, como as de validacao: entra o dado da API, sai o texto.
 */

const DATA_E_HORA = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Data e hora no formato brasileiro, no fuso de quem esta usando. */
export function formatarDataHora(iso) {
  if (!iso) {
    return "—";
  }
  return DATA_E_HORA.format(new Date(iso));
}

const PERCENTUAL = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

/** Taxa que a API ja manda de 0 a 100: 66.7 vira "66,7%". */
export function formatarPercentual(valor) {
  return `${PERCENTUAL.format(valor)}%`;
}

/** Variacao com sinal, para MMR e saldo de gols: 9 vira "+9", -8 fica "-8". */
export function formatarVariacao(valor) {
  return valor > 0 ? `+${valor}` : String(valor);
}

/** Quantidade com a palavra no plural certo: "1 vitória", "3 vitórias". */
export function contar(quantidade, palavra) {
  return quantidade === 1 ? `1 ${palavra}` : `${quantidade} ${palavra}s`;
}

/** Classe de cor para um numero com sinal: verde subiu, vermelho caiu. */
export function corDoSinal(valor) {
  if (valor > 0) {
    return "text-emerald-700";
  }
  if (valor < 0) {
    return "text-red-700";
  }
  return "text-slate-900";
}

/** Classe da faixa na lateral de um card: verde subiu, vermelho caiu, cinza ficou igual. */
export function faixaDoSinal(valor) {
  if (valor > 0) {
    return "border-l-emerald-500";
  }
  if (valor < 0) {
    return "border-l-red-500";
  }
  return "border-l-slate-300";
}

/** Sequencia atual da API em texto: "1 vitória", "3 derrotas seguidas". */
export function formatarSequencia(sequencia) {
  if (!sequencia) {
    return "—";
  }
  const palavra = sequencia.resultado === "vitoria" ? "vitória" : "derrota";
  const texto = contar(sequencia.quantidade, palavra);
  return sequencia.quantidade > 1 ? `${texto} seguidas` : texto;
}
