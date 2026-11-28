import { useId } from "react";
import {
  contar,
  corDoSinal,
  formatarPercentual,
  formatarSequencia,
  formatarVariacao,
} from "../formatacao.js";

/** Um numero com o rotulo em cima e, se houver, um detalhe embaixo. */
function Card({ rotulo, valor, detalhe, cor = "text-slate-900" }) {
  return (
    <div className="rounded-md bg-slate-50 p-3 ring-1 ring-slate-100">
      <dt className="text-sm text-slate-500">{rotulo}</dt>
      <dd className={`text-xl font-semibold ${cor}`}>{valor}</dd>
      {detalhe && <dd className="text-xs text-slate-500">{detalhe}</dd>}
    </div>
  );
}

/**
 * Cards com os numeros que a API calcula.
 *
 * Serve tanto para uma sessao quanto para o resumo geral, porque os dois tem
 * os mesmos campos. Componente de apresentacao: so mostra o que recebe.
 *
 * A quantidade de colunas segue a largura do proprio card (@container), e nao
 * a da tela: na coluna estreita da sessao atual cabem 3, no historico cabem 5.
 */
export default function EstatisticasCards({ titulo, descricao, estatisticas }) {
  const idTitulo = useId();
  const {
    partidas,
    vitorias,
    derrotas,
    taxa_vitoria,
    sequencia,
    variacao_mmr,
    gols_pro,
    gols_contra,
    saldo_gols,
  } = estatisticas;

  return (
    <section
      aria-labelledby={idTitulo}
      className="@container space-y-3 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div>
        <h2 id={idTitulo} className="text-lg font-semibold text-slate-900">
          {titulo}
        </h2>
        {descricao && <p className="text-sm text-slate-500">{descricao}</p>}
      </div>

      {partidas === 0 ? (
        <p className="text-sm text-slate-500">Os números aparecem depois da primeira partida.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 @lg:grid-cols-3 @3xl:grid-cols-5">
          <Card
            rotulo="Partidas"
            valor={partidas}
            detalhe={`${contar(vitorias, "vitória")} · ${contar(derrotas, "derrota")}`}
          />
          <Card rotulo="Taxa de vitória" valor={formatarPercentual(taxa_vitoria)} />
          <Card rotulo="Sequência atual" valor={formatarSequencia(sequencia)} />
          <Card
            rotulo="Variação de MMR"
            valor={formatarVariacao(variacao_mmr)}
            cor={corDoSinal(variacao_mmr)}
          />
          <Card
            rotulo="Saldo de gols"
            valor={formatarVariacao(saldo_gols)}
            detalhe={`${gols_pro} pró · ${gols_contra} contra`}
            cor={corDoSinal(saldo_gols)}
          />
        </dl>
      )}
    </section>
  );
}
