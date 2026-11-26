/** Raiz da aplicacao: o cabecalho fixo e, abaixo dele, o conteudo. */
export default function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-5">
          <h1 className="text-2xl font-bold">Diário de Ranked</h1>
          <p className="text-sm text-slate-300">
            Suas sessões ranqueadas de Rocket League, partida a partida.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8" />
    </div>
  );
}
