import {
  contar,
  corDoSinal,
  faixaDoSinal,
  formatarDataHora,
  formatarPercentual,
  formatarVariacao,
} from "../formatacao.js";

/**
 * Sessoes encerradas, cada uma com o resumo dos numeros dela.
 *
 * Componente de apresentacao: `itens` chega pronto da pagina, como uma lista
 * de { sessao, estatisticas }. `playlist` e o filtro escolhido, usado so para
 * a mensagem de lista vazia.
 *
 * Cada sessao tem uma faixa na lateral (verde ganhou MMR, vermelha perdeu) e
 * uma barra da taxa de vitoria: uma div cinza com outra verde dentro, cuja
 * largura e a propria taxa em porcentagem.
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
        <ul className="grid gap-3 lg:grid-cols-2">
          {itens.map(({ sessao, estatisticas }) => (
            <li
              key={sessao.id}
              className={`space-y-2 rounded-md border-l-4 bg-slate-50 p-3 ring-1 ring-slate-100 ${faixaDoSinal(estatisticas.variacao_mmr)}`}
            >
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
                <>
                  <p className="text-sm text-slate-700">
                    {contar(estatisticas.vitorias, "vitória")} e{" "}
                    {contar(estatisticas.derrotas, "derrota")} · MMR {sessao.mmr_inicial} →{" "}
                    {estatisticas.mmr_atual}{" "}
                    <span className={`font-medium ${corDoSinal(estatisticas.variacao_mmr)}`}>
                      ({formatarVariacao(estatisticas.variacao_mmr)})
                    </span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="h-2 w-40 overflow-hidden rounded-full bg-slate-200"
                    >
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${estatisticas.taxa_vitoria}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600">
                      {formatarPercentual(estatisticas.taxa_vitoria)} de vitórias
                    </span>
                  </div>
                </>
              )}

              {sessao.observacoes && <p className="text-sm text-slate-500">{sessao.observacoes}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
