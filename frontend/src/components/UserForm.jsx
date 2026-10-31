import { useState } from "react";
import { normalizarEmail, validarUsuario } from "../validation.js";

const FORMULARIO_VAZIO = { nome: "", email: "" };

/**
 * Formulario de cadastro de usuario.
 *
 * Mantem apenas o estado dos proprios campos. A lista de usuarios fica na
 * pagina, que recebe o novo registro por `onAdicionar` — o componente nao
 * sabe o que acontece depois.
 */
export default function UserForm({ onAdicionar, usuarios = [] }) {
  const [campos, setCampos] = useState(FORMULARIO_VAZIO);
  const [erros, setErros] = useState({});

  function alterar(evento) {
    const { name, value } = evento.target;
    setCampos((anterior) => ({ ...anterior, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();

    const encontrados = validarUsuario(campos, usuarios);
    setErros(encontrados);

    if (Object.keys(encontrados).length > 0) {
      return;
    }

    onAdicionar({
      nome: campos.nome.trim(),
      email: normalizarEmail(campos.email),
    });
    setCampos(FORMULARIO_VAZIO);
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label="Cadastrar usuário"
      className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h2 className="text-lg font-semibold text-slate-900">Cadastrar usuário</h2>

      <div className="space-y-1">
        <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          value={campos.nome}
          onChange={alterar}
          aria-invalid={Boolean(erros.nome)}
          aria-describedby={erros.nome ? "erro-nome" : undefined}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        {erros.nome && (
          <p id="erro-nome" role="alert" className="text-sm text-red-600">
            {erros.nome}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="text"
          value={campos.email}
          onChange={alterar}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "erro-email" : undefined}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        {erros.email && (
          <p id="erro-email" role="alert" className="text-sm text-red-600">
            {erros.email}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
      >
        Adicionar
      </button>
    </form>
  );
}
