import { corDoSinal, formatarDataHora, formatarVariacao } from "../formatacao.js";

/**
 * Resumo da sessao aberta, com o botao de encerrar.
 *
 * Componente de apresentacao: recebe a sessao por props e devolve o clique
 * em `onEncerrar`. Nao guarda estado. Enquanto a pagina esta `ocupado`, o
 * botao fica travado. O `mmrAtual` e a `variacaoMmr` vem das estatisticas e
 * so aparecem quando ja chegaram da API.
 */
export default function SessaoCard({ sessao, mmrAtual, variacaoMmr, onEncerrar, ocupado = false }) {
  return (
    <section
      aria-labelledby="titulo-sessao-atual"
      className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="titulo-sessao-atual" className="text-lg font-semibold text-slate-900">
            Sessão atual
          </h2>
          <p className="text-sm text-slate-500">
            Iniciada em {formatarDataHora(sessao.iniciada_em)}
          </p>
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-800">
          {sessao.playlist}
        </span>
      </div>

      {/* MMR em destaque: inicial -> atual, com quanto mudou na cor do sinal. */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div>
          <p className="text-sm text-slate-500">MMR inicial</p>
          <p className="text-3xl font-bold tabular-nums text-slate-900">{sessao.mmr_inicial}</p>
        </div>
        {mmrAtual !== undefined && (
          <>
            <span aria-hidden="true" className="pb-1 text-2xl text-slate-400">
              →
            </span>
            <div>
              <p className="text-sm text-slate-500">MMR atual</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900">
                {mmrAtual}{" "}
                <span className={`text-lg font-semibold ${corDoSinal(variacaoMmr)}`}>
                  ({formatarVariacao(variacaoMmr)})
                </span>
              </p>
            </div>
          </>
        )}
      </div>

      {sessao.observacoes && (
        <div>
          <p className="text-sm text-slate-500">Observações</p>
          <p className="text-slate-900">{sessao.observacoes}</p>
        </div>
      )}

      <button
        type="button"
        onClick={onEncerrar}
        disabled={ocupado}
        className="rounded-md bg-slate-800 px-4 py-2 font-medium text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
      >
        Encerrar sessão
      </button>
    </section>
  );
}
