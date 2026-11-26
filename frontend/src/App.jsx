import { useState } from "react";
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
 * na API.
 */
export default function App() {
  const [aba, setAba] = useState("atual");

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl space-y-4 px-4 pt-5">
          <div>
            <h1 className="text-2xl font-bold">Diário de Ranked</h1>
            <p className="text-sm text-slate-300">
              Suas sessões ranqueadas de Rocket League, partida a partida.
            </p>
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

      <main className="mx-auto max-w-4xl px-4 py-8">
        {aba === "atual" ? <SessaoAtualPage /> : <HistoricoPage />}
      </main>
    </div>
  );
}
