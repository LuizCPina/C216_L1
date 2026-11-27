import { useState } from "react";
import { URL_DA_DOCUMENTACAO } from "./api.js";
import HistoricoPage from "./pages/HistoricoPage.jsx";
import SessaoAtualPage from "./pages/SessaoAtualPage.jsx";

const ABAS = [
  { id: "atual", rotulo: "Sessão atual" },
  { id: "historico", rotulo: "Histórico" },
];

/**
 * Raiz da aplicacao: o cabecalho com as abas e, abaixo dele, a pagina da aba.
 *
 * Trocar de aba monta a pagina de novo, entao ela sempre busca dados frescos
 * na API. O cabecalho tambem tem o link para a documentacao da API, que abre
 * em outra aba para nao tirar ninguem da aplicacao.
 */
export default function App() {
  const [aba, setAba] = useState("atual");

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Degrade com as cores dos dois times do Rocket League: azul e laranja. */}
      <header className="bg-linear-to-r from-blue-800 via-slate-900 to-orange-700 text-white">
        <div className="mx-auto max-w-[96rem] space-y-4 px-4 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/favicon.svg" alt="" className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold">Diário de Ranked</h1>
                <p className="text-sm text-slate-300">
                  Suas sessões ranqueadas de Rocket League, partida a partida.
                </p>
              </div>
            </div>
            <a
              href={URL_DA_DOCUMENTACAO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/30 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Documentação da API
              {/* Seta de "abre em outra aba". Em SVG porque o caractere da seta
                  vira emoji no Windows. */}
              <svg
                aria-hidden="true"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
              >
                <path d="M5 11l6-6M6 5h5v5" />
              </svg>
              <span className="sr-only"> (abre em outra aba)</span>
            </a>
          </div>
          <nav aria-label="Seções" className="flex gap-1">
            {ABAS.map(({ id, rotulo }) => (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                aria-current={aba === id ? "page" : undefined}
                className={`rounded-t-md px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                  aba === id ? "bg-slate-100 text-slate-900" : "text-slate-300 hover:text-white"
                }`}
              >
                {rotulo}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Largura maxima de 96rem (1536 px), igual a do cabecalho: usa a tela
          grande sem esticar demais num monitor ultra-wide. */}
      <main className="mx-auto max-w-[96rem] px-4 py-8">
        {aba === "atual" ? <SessaoAtualPage /> : <HistoricoPage />}
      </main>
    </div>
  );
}
