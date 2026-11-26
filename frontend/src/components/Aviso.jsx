const ESTILOS = {
  carregando: "bg-slate-50 text-slate-600 ring-slate-200",
  sucesso: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  erro: "bg-red-50 text-red-700 ring-red-200",
};

/**
 * Faixa de aviso para os estados de uma chamada a API.
 *
 * Erro usa role="alert", que leitores de tela anunciam na hora. Carregando e
 * sucesso usam role="status", que e anunciado sem interromper. `acao` e um
 * botao opcional, como o "Tentar de novo".
 */
export default function Aviso({ tipo, children, acao }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`flex items-center justify-between gap-4 rounded-md px-4 py-3 text-sm ring-1 ${ESTILOS[tipo]}`}
    >
      <p>{children}</p>
      {acao}
    </div>
  );
}
