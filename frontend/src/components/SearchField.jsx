/**
 * Campo de busca por nome.
 *
 * Componente controlado: o valor e o estado vivem na pagina, aqui so entram
 * como props.
 */
export default function SearchField({ valor, onAlterar }) {
  return (
    <div className="space-y-1">
      <label htmlFor="busca" className="block text-sm font-medium text-slate-700">
        Buscar por nome
      </label>
      <input
        id="busca"
        type="search"
        value={valor}
        onChange={(evento) => onAlterar(evento.target.value)}
        placeholder="Digite parte do nome"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
      />
    </div>
  );
}
