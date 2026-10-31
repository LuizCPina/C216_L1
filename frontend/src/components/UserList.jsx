/**
 * Lista de usuarios cadastrados.
 *
 * Componente de apresentacao: recebe tudo por props e devolve a acao de
 * remover para quem o usa. Nao guarda estado.
 */
export default function UserList({ usuarios = [], onRemover }) {
  if (usuarios.length === 0) {
    return (
      <p className="rounded-lg bg-slate-50 p-6 text-center text-slate-500 ring-1 ring-slate-200">
        Nenhum usuário cadastrado ainda.
      </p>
    );
  }

  return (
    <ul
      aria-label="Usuários cadastrados"
      className="divide-y divide-slate-200 rounded-lg bg-white ring-1 ring-slate-200"
    >
      {usuarios.map((usuario) => (
        <li key={usuario.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{usuario.nome}</p>
            <p className="truncate text-sm text-slate-500">{usuario.email}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemover(usuario.id)}
            aria-label={`Remover ${usuario.nome}`}
            className="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
          >
            Remover
          </button>
        </li>
      ))}
    </ul>
  );
}
