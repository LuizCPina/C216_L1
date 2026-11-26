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
