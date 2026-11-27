/**
 * Contas do grafico de evolucao do MMR.
 *
 * Funcao pura, como as de validacao e formatacao: entram os valores de MMR,
 * saem as posicoes (x, y) de cada ponto no desenho. O componente so desenha.
 */

/**
 * Posicao de cada valor dentro da `area` do desenho, da esquerda para a direita.
 *
 * O x divide a largura em partes iguais, um passo por ponto. O y segue a
 * escala do MMR: o maior valor fica no topo da area e o menor embaixo (no
 * SVG o y cresce para baixo). Se todos forem iguais, a linha fica no meio.
 */
export function posicoesNoGrafico(valores, area) {
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  const passo = valores.length > 1 ? area.largura / (valores.length - 1) : 0;

  return valores.map((valor, indice) => ({
    x: area.x + indice * passo,
    y:
      maior === menor
        ? area.y + area.altura / 2
        : area.y + ((maior - valor) / (maior - menor)) * area.altura,
  }));
}
