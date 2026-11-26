import { corDoSinal, formatarVariacao } from "../formatacao.js";

const CLASSE_BOTAO =
  "rounded-md bg-white px-3 py-1.5 text-sm font-medium ring-1 transition focus:outline-none focus:ring-2 disabled:opacity-60";

/**
 * Lista das partidas da sessao, na ordem em que foram jogadas.
 *
 * Componente de apresentacao: os cliques saem por `onEditar` e `onExcluir`.
 * Na linha da partida que esta sendo editada (`editandoId`), mostra o
 * `formularioDeEdicao` que a pagina mandou no lugar dos dados.
 *
 * `variacoes` diz quanto o MMR mudou em cada partida ({ id da partida: variacao }).
 * Quem calcula e a API; uma partida que ainda nao esta ali so fica sem o numero.
 */
export default function PartidaLista({
  partidas,
  variacoes = {},
  editandoId,
  formularioDeEdicao,
  onEditar,
  onExcluir,
  ocupado = false,
}) {
  return (
    <section
      aria-labelledby="titulo-partidas"
      className="space-y-2 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h2 id="titulo-partidas" className="text-lg font-semibold text-slate-900">
        Partidas da sessão
      </h2>

      {partidas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhuma partida registrada ainda. Jogue a primeira e registre aqui.
        </p>
      ) : (
        <ol className="divide-y divide-slate-100">
          {partidas.map((partida, indice) => {
            const numero = indice + 1;
            if (partida.id === editandoId) {
              return (
                <li key={partida.id} className="py-3">
                  {formularioDeEdicao}
                </li>
              );
            }
            const venceu = partida.resultado === "vitoria";
            return (
              <li key={partida.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <span className="w-6 text-sm text-slate-400">{numero}</span>
                <span
                  className={`w-20 rounded-full px-2 py-0.5 text-center text-sm font-semibold ${
                    venceu ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                  }`}
                >
                  {venceu ? "Vitória" : "Derrota"}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {partida.gols_pro} × {partida.gols_contra}
                  {partida.overtime && (
                    <span className="ml-1 text-xs font-normal text-slate-500">overtime</span>
                  )}
                </span>
                <span className="text-sm text-slate-600">
                  MMR {partida.mmr_depois}
                  {partida.id in variacoes && (
                    <span className={`ml-1 font-medium ${corDoSinal(variacoes[partida.id])}`}>
                      ({formatarVariacao(variacoes[partida.id])})
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1 text-sm text-slate-500">
                  {partida.companheiro && <p>Com {partida.companheiro}</p>}
                  {partida.notas && <p className="truncate">{partida.notas}</p>}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEditar(partida)}
                    disabled={ocupado}
                    aria-label={`Editar partida ${numero}`}
                    className={`${CLASSE_BOTAO} text-slate-700 ring-slate-300 hover:bg-slate-50 focus:ring-slate-400`}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => onExcluir(partida, numero)}
                    disabled={ocupado}
                    aria-label={`Excluir partida ${numero}`}
                    className={`${CLASSE_BOTAO} text-red-700 ring-red-200 hover:bg-red-50 focus:ring-red-300`}
                  >
                    Excluir
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
