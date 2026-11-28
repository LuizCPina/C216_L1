import { useId } from "react";
import { contar, formatarVariacao } from "../formatacao.js";
import { posicoesNoGrafico } from "../grafico.js";

// Tamanho do desenho (viewBox) e a area onde a linha fica. A sobra de 8 em
// volta e para os pontos das pontas nao serem cortados. O SVG estica para a
// largura do card, e tudo dentro dele cresce ou encolhe junto.
const LARGURA = 600;
const ALTURA = 200;
const AREA = { x: 8, y: 8, largura: 584, altura: 184 };

/** Cor de cada ponto: verde subiu, vermelho caiu, cinza no inicio ou se ficou igual. */
function corDoPonto(variacao) {
  if (variacao > 0) {
    return "fill-emerald-600";
  }
  if (variacao < 0) {
    return "fill-red-600";
  }
  return "fill-slate-400";
}

/**
 * Grafico de linha do MMR da sessao, partida a partida, feito em SVG sem
 * biblioteca.
 *
 * Componente de apresentacao: recebe o MMR inicial e a `evolucao` que a API
 * manda nas estatisticas da sessao. Sem partidas nao ha linha para desenhar,
 * entao nao mostra nada. Passar o mouse num ponto mostra o MMR daquela partida.
 */
export default function GraficoMmr({ mmrInicial, evolucao }) {
  const idTitulo = useId();

  if (evolucao.length === 0) {
    return null;
  }

  // O primeiro ponto e o MMR do inicio da sessao; depois, um por partida.
  const pontos = [
    { rotulo: "Início", mmr: mmrInicial, variacao: 0 },
    ...evolucao.map((ponto, indice) => ({
      rotulo: `Partida ${indice + 1}`,
      mmr: ponto.mmr_depois,
      variacao: ponto.variacao,
    })),
  ];
  const valores = pontos.map((ponto) => ponto.mmr);
  const posicoes = posicoesNoGrafico(valores, AREA);
  const maior = Math.max(...valores);
  const menor = Math.min(...valores);
  // O mesmo texto aparece embaixo do titulo e descreve o desenho para leitores de tela.
  const resumo = `Começou em ${mmrInicial} e está em ${valores.at(-1)} depois de ${contar(evolucao.length, "partida")}.`;

  return (
    <section
      aria-labelledby={idTitulo}
      className="space-y-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div>
        <h2 id={idTitulo} className="text-lg font-semibold text-slate-900">
          Evolução do MMR
        </h2>
        <p className="text-sm text-slate-500">{resumo}</p>
      </div>

      <div className="flex gap-3">
        {/* Numeros do eixo, o maior MMR no topo e o menor embaixo. Ficam fora
            do SVG para nao encolherem junto com o desenho em telas pequenas. */}
        <div
          aria-hidden="true"
          className={`flex flex-col text-xs tabular-nums text-slate-500 ${
            maior === menor ? "justify-center" : "justify-between"
          }`}
        >
          <span>{maior}</span>
          {maior !== menor && <span>{menor}</span>}
        </div>

        <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" className="h-auto min-w-0 flex-1">
          <title>{resumo}</title>

          {/* Linha tracejada na altura do MMR inicial, para ver se esta acima ou abaixo. */}
          <line
            x1={AREA.x}
            x2={AREA.x + AREA.largura}
            y1={posicoes[0].y}
            y2={posicoes[0].y}
            strokeDasharray="6 6"
            className="stroke-slate-300"
          />

          <polyline
            points={posicoes.map(({ x, y }) => `${x},${y}`).join(" ")}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="fill-none stroke-sky-600"
          />

          {pontos.map((ponto, indice) => (
            <circle
              key={ponto.rotulo}
              cx={posicoes[indice].x}
              cy={posicoes[indice].y}
              r="6"
              strokeWidth="2"
              className={`stroke-white ${corDoPonto(ponto.variacao)}`}
            >
              <title>
                {indice === 0
                  ? `${ponto.rotulo}: MMR ${ponto.mmr}`
                  : `${ponto.rotulo}: MMR ${ponto.mmr} (${formatarVariacao(ponto.variacao)})`}
              </title>
            </circle>
          ))}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Subiu
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-red-600" />
          Caiu
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="w-4 border-t-2 border-dashed border-slate-300" />
          MMR inicial
        </li>
      </ul>
    </section>
  );
}
