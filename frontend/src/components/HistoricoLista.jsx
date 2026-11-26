import { contar, corDoSinal, formatarDataHora, formatarVariacao } from "../formatacao.js";

/**
 * Sessoes encerradas, cada uma com o resumo dos numeros dela.
 *
 * Componente de apresentacao: `itens` chega pronto da pagina, como uma lista
 * de { sessao, estatisticas }. `playlist` e o filtro escolhido, usado so para
 * a mensagem de lista vazia.
 */
export default function HistoricoLista({ itens, playlist }) {
  return (
    <section
      aria-labelledby="titulo-historico"
      className="space-y-2 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h2 id="titulo-historico" className="text-lg font-semibold text-slate-900">
        Sessões encerradas
      </h2>

      {itens.length === 0 ? (
        <p className="text-sm text-slate-500">
          {playlist
            ? `Nenhuma sessão ${playlist} encerrada.`
            : "Nenhuma sessão encerrada ainda. Elas aparecem aqui depois de encerrar."}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {itens.map(({ sessao, estatisticas }) => (
            <li key={sessao.id} className="space-y-1 py-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="rounded-full bg-sky-100 px-3 py-0.5 text-sm font-semibold text-sky-800">
                  {sessao.playlist}
                </span>
                <span className="text-sm text-slate-500">
                  {formatarDataHora(sessao.iniciada_em)} até {formatarDataHora(sessao.encerrada_em)}
                </span>
              </div>

              {estatisticas.partidas === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma partida registrada.</p>
              ) : (
                <p className="text-sm text-slate-700">
                  {contar(estatisticas.vitorias, "vitória")} e{" "}
                  {contar(estatisticas.derrotas, "derrota")} · MMR {sessao.mmr_inicial} →{" "}
                  {estatisticas.mmr_atual}{" "}
                  <span className={`font-medium ${corDoSinal(estatisticas.variacao_mmr)}`}>
                    ({formatarVariacao(estatisticas.variacao_mmr)})
                  </span>
                </p>
              )}

              {sessao.observacoes && <p className="text-sm text-slate-500">{sessao.observacoes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
