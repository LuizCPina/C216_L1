/** Classes comuns a todos os campos de formulario. */
export const CLASSE_ENTRADA =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 aria-invalid:border-red-400";

/**
 * Rotulo, campo e mensagem de erro, sempre no mesmo formato.
 *
 * O campo em si vem como filho, porque pode ser input, select ou textarea.
 * Ele deve apontar `aria-describedby` para `erro-<id>` quando houver erro.
 */
export default function Campo({ id, rotulo, erro, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {rotulo}
      </label>
      {children}
      {erro && (
        <p id={`erro-${id}`} className="text-sm text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
