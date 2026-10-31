import { useState } from "react";
import SearchField from "../components/SearchField.jsx";
import UserForm from "../components/UserForm.jsx";
import UserList from "../components/UserList.jsx";
import { filtrarPorNome } from "../validation.js";

/**
 * Pagina de gerenciamento de usuarios.
 *
 * E aqui que mora o estado: a lista de usuarios e o termo de busca. Os
 * componentes abaixo so recebem dados e devolvem eventos.
 *
 * Os dados vivem apenas em memoria. Nao ha API nem persistencia nesta
 * pratica: recarregar a pagina zera a lista. A integracao com o backend
 * entra na Pratica 7.
 */
export default function UsersPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState("");

  function adicionar(novo) {
    setUsuarios((anteriores) => {
      // O id sai da propria lista, dentro do updater. Um contador em estado
      // separado seria lido aqui com o valor da renderizacao anterior, e dois
      // cadastros no mesmo ciclo receberiam o mesmo id.
      const proximoId = Math.max(0, ...anteriores.map((usuario) => usuario.id)) + 1;
      return [...anteriores, { id: proximoId, ...novo }];
    });
  }

  function remover(id) {
    setUsuarios((anteriores) => anteriores.filter((usuario) => usuario.id !== id));
  }

  const visiveis = filtrarPorNome(usuarios, busca);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Gerenciador de usuários</h1>
        <p className="text-sm text-slate-500">
          Os dados ficam apenas na memória do navegador. Sem API nesta prática.
        </p>
      </header>

      <UserForm onAdicionar={adicionar} usuarios={usuarios} />

      <section className="space-y-4">
        <SearchField valor={busca} onAlterar={setBusca} />

        <p className="text-sm text-slate-500">
          {visiveis.length === usuarios.length
            ? `${usuarios.length} usuário(s) cadastrado(s)`
            : `${visiveis.length} de ${usuarios.length} usuário(s)`}
        </p>

        <UserList usuarios={visiveis} onRemover={remover} />
      </section>
    </main>
  );
}
