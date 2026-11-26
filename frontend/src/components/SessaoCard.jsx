import { formatarDataHora } from "../formatacao.js";

/**
 * Resumo da sessao aberta, com o botao de encerrar.
 *
 * Componente de apresentacao: recebe a sessao por props e devolve o clique
 * em `onEncerrar`. Nao guarda estado.
 */
export default function SessaoCard({ sessao, onEncerrar, ocupado = false }) {
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

      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-sm text-slate-500">MMR inicial</dt>
          <dd className="text-xl font-semibold text-slate-900">{sessao.mmr_inicial}</dd>
        </div>
        {sessao.observacoes && (
          <div>
            <dt className="text-sm text-slate-500">Observações</dt>
            <dd className="text-slate-900">{sessao.observacoes}</dd>
          </div>
        )}
      </dl>

      <button
        type="button"
        onClick={onEncerrar}
        disabled={ocupado}
        className="rounded-md bg-slate-800 px-4 py-2 font-medium text-white transition hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
      >
        {ocupado ? "Encerrando..." : "Encerrar sessão"}
      </button>
    </section>
  );
}
