import { useState } from "react";
import { LIMITE_OBSERVACOES, PLAYLISTS, validarSessao } from "../validacao.js";
import Campo, { CLASSE_ENTRADA } from "./Campo.jsx";

const FORMULARIO_VAZIO = { playlist: "2v2", mmr_inicial: "", observacoes: "" };

/**
 * Formulario para iniciar uma sessao.
 *
 * Guarda so o estado dos proprios campos. Quando os dados passam na
 * validacao, entrega para `onIniciar` ja no formato da API: quem chama a API
 * e a pagina.
 */
export default function IniciarSessaoForm({ onIniciar, ocupado = false }) {
  const [campos, setCampos] = useState(FORMULARIO_VAZIO);
  const [erros, setErros] = useState({});

  function alterar(evento) {
    const { name, value } = evento.target;
    setCampos((anterior) => ({ ...anterior, [name]: value }));
  }

  function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarSessao(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    onIniciar({
      playlist: campos.playlist,
      mmr_inicial: Number(campos.mmr_inicial),
      observacoes: campos.observacoes.trim() || null,
    });
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label="Nova sessão"
      className="space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Nova sessão</h2>
        <p className="text-sm text-slate-500">
          Nenhuma sessão aberta. Escolha a playlist e informe o seu MMR antes da primeira partida.
        </p>
      </div>

      {/* Celular: um campo por linha. Tela media: playlist e MMR lado a lado.
          Tela grande (lg): tudo numa linha so, com o botao no fim. */}
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[10rem_12rem_1fr_auto]">
        <Campo id="playlist" rotulo="Playlist" erro={erros.playlist}>
          <select
            id="playlist"
            name="playlist"
            value={campos.playlist}
            onChange={alterar}
            aria-invalid={Boolean(erros.playlist)}
            aria-describedby={erros.playlist ? "erro-playlist" : undefined}
            className={CLASSE_ENTRADA}
          >
            {PLAYLISTS.map((playlist) => (
              <option key={playlist} value={playlist}>
                {playlist}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="mmr_inicial" rotulo="MMR inicial" erro={erros.mmr_inicial}>
          <input
            id="mmr_inicial"
            name="mmr_inicial"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={campos.mmr_inicial}
            onChange={alterar}
            aria-invalid={Boolean(erros.mmr_inicial)}
            aria-describedby={erros.mmr_inicial ? "erro-mmr_inicial" : undefined}
            className={CLASSE_ENTRADA}
          />
        </Campo>

        <div className="sm:col-span-2 lg:col-span-1">
          <Campo id="observacoes" rotulo="Observações (opcional)" erro={erros.observacoes}>
            {/* Na linha da tela grande, a caixa tem a altura dos outros campos
                (h-10.5 = 42px); ainda da para puxar o canto para aumentar. */}
            <textarea
              id="observacoes"
              name="observacoes"
              rows="2"
              maxLength={LIMITE_OBSERVACOES}
              value={campos.observacoes}
              onChange={alterar}
              aria-invalid={Boolean(erros.observacoes)}
              aria-describedby={erros.observacoes ? "erro-observacoes" : undefined}
              className={`${CLASSE_ENTRADA} lg:h-10.5`}
            />
          </Campo>
        </div>

        {/* lg:mt-6 desce o botao a altura de um rotulo, alinhando com os campos. */}
        <button
          type="submit"
          disabled={ocupado}
          className="justify-self-start rounded-md bg-sky-600 px-4 py-2 font-medium whitespace-nowrap text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60 lg:mt-6"
        >
          Iniciar sessão
        </button>
      </div>
    </form>
  );
}
