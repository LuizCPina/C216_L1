import { useId, useState } from "react";
import { LIMITE_COMPANHEIRO, LIMITE_NOTAS, validarPartida } from "../validacao.js";
import Campo, { CLASSE_ENTRADA } from "./Campo.jsx";

const FORMULARIO_VAZIO = {
  gols_pro: "",
  gols_contra: "",
  overtime: false,
  mmr_depois: "",
  companheiro: "",
  notas: "",
};

/**
 * Rotulo do placar com uma bolinha na cor do time: azul o seu, laranja o
 * adversario, como no jogo. A bolinha e so enfeite e nao tem texto, entao o
 * nome do campo continua "Seu time" ou "Adversário".
 */
function RotuloDoTime({ cor, children }) {
  return (
    <>
      <span aria-hidden="true" className={`mr-1.5 inline-block h-2.5 w-2.5 rounded-full ${cor}`} />
      {children}
    </>
  );
}

/** Os campos do formulario guardam texto: a partida da API vira texto aqui. */
function camposDaPartida(partida) {
  if (!partida) {
    return FORMULARIO_VAZIO;
  }
  return {
    gols_pro: String(partida.gols_pro),
    gols_contra: String(partida.gols_contra),
    overtime: partida.overtime,
    mmr_depois: String(partida.mmr_depois),
    companheiro: partida.companheiro ?? "",
    notas: partida.notas ?? "",
  };
}

/**
 * Formulario de partida, usado para registrar e para editar.
 *
 * Sem `partida`, registra uma nova. Com `partida`, comeca preenchido com ela
 * e mostra o botao de cancelar. Em sessao 1v1 o campo de companheiro nem
 * aparece. Quem chama a API e a pagina: `onSalvar` recebe os dados no formato
 * dela e devolve true quando deu certo, para o formulario voltar a ficar vazio.
 */
export default function PartidaForm({ playlist, partida, onSalvar, onCancelar, ocupado = false }) {
  const editando = Boolean(partida);
  const titulo = editando ? "Editar partida" : "Registrar partida";
  const [campos, setCampos] = useState(() => camposDaPartida(partida));
  const [erros, setErros] = useState({});

  // A pagina pode mostrar dois formularios ao mesmo tempo (registrar e
  // editar), entao os ids dos campos precisam ser unicos.
  const prefixo = useId();
  const id = (campo) => `${prefixo}-${campo}`;

  function alterar(evento) {
    const { name, type, value, checked } = evento.target;
    setCampos((anterior) => ({ ...anterior, [name]: type === "checkbox" ? checked : value }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarPartida(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length > 0) {
      return;
    }
    const salvou = await onSalvar({
      gols_pro: Number(campos.gols_pro),
      gols_contra: Number(campos.gols_contra),
      overtime: campos.overtime,
      mmr_depois: Number(campos.mmr_depois),
      companheiro: campos.companheiro.trim() || null,
      notas: campos.notas.trim() || null,
    });
    if (salvou) {
      setCampos(FORMULARIO_VAZIO);
    }
  }

  return (
    <form
      onSubmit={enviar}
      noValidate
      aria-label={titulo}
      className="@container space-y-4 rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200"
    >
      <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>

      <fieldset
        aria-describedby={erros.placar ? id("erro-placar") : undefined}
        className="space-y-2"
      >
        <legend className="text-sm font-medium text-slate-700">Placar</legend>
        {/* As colunas seguem a largura do proprio formulario (@container), que
            muda de lugar: na coluna estreita e no celular, o placar fica em 2
            colunas e o overtime embaixo; editando na lista, cabe tudo em 3. */}
        <div className="grid items-start gap-4 @2xs:grid-cols-2 @xl:grid-cols-3">
          <Campo
            id={id("gols_pro")}
            rotulo={<RotuloDoTime cor="bg-blue-600">Seu time</RotuloDoTime>}
            erro={erros.gols_pro}
          >
            <input
              id={id("gols_pro")}
              name="gols_pro"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={campos.gols_pro}
              onChange={alterar}
              aria-invalid={Boolean(erros.gols_pro)}
              aria-describedby={erros.gols_pro ? `erro-${id("gols_pro")}` : undefined}
              className={CLASSE_ENTRADA}
            />
          </Campo>

          <Campo
            id={id("gols_contra")}
            rotulo={<RotuloDoTime cor="bg-orange-500">Adversário</RotuloDoTime>}
            erro={erros.gols_contra}
          >
            <input
              id={id("gols_contra")}
              name="gols_contra"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={campos.gols_contra}
              onChange={alterar}
              aria-invalid={Boolean(erros.gols_contra)}
              aria-describedby={erros.gols_contra ? `erro-${id("gols_contra")}` : undefined}
              className={CLASSE_ENTRADA}
            />
          </Campo>

          <div className="space-y-1 @2xs:col-span-2 @xl:col-span-1 @xl:pt-7">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                name="overtime"
                type="checkbox"
                checked={campos.overtime}
                onChange={alterar}
                aria-invalid={Boolean(erros.overtime)}
                aria-describedby={erros.overtime ? id("erro-overtime") : undefined}
                className="h-4 w-4 accent-sky-600"
              />
              Foi para o overtime
            </label>
            {erros.overtime && (
              <p id={id("erro-overtime")} className="text-sm text-red-600">
                {erros.overtime}
              </p>
            )}
          </div>
        </div>
        {erros.placar && (
          <p id={id("erro-placar")} className="text-sm text-red-600">
            {erros.placar}
          </p>
        )}
      </fieldset>

      <div className="grid gap-4 @sm:grid-cols-2">
        <Campo id={id("mmr_depois")} rotulo="MMR depois da partida" erro={erros.mmr_depois}>
          <input
            id={id("mmr_depois")}
            name="mmr_depois"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={campos.mmr_depois}
            onChange={alterar}
            aria-invalid={Boolean(erros.mmr_depois)}
            aria-describedby={erros.mmr_depois ? `erro-${id("mmr_depois")}` : undefined}
            className={CLASSE_ENTRADA}
          />
        </Campo>

        {playlist !== "1v1" && (
          <Campo id={id("companheiro")} rotulo="Companheiro (opcional)" erro={erros.companheiro}>
            <input
              id={id("companheiro")}
              name="companheiro"
              type="text"
              maxLength={LIMITE_COMPANHEIRO}
              value={campos.companheiro}
              onChange={alterar}
              aria-invalid={Boolean(erros.companheiro)}
              aria-describedby={erros.companheiro ? `erro-${id("companheiro")}` : undefined}
              className={CLASSE_ENTRADA}
            />
          </Campo>
        )}
      </div>

      <Campo id={id("notas")} rotulo="Notas (opcional)" erro={erros.notas}>
        <textarea
          id={id("notas")}
          name="notas"
          rows="2"
          maxLength={LIMITE_NOTAS}
          value={campos.notas}
          onChange={alterar}
          aria-invalid={Boolean(erros.notas)}
          aria-describedby={erros.notas ? `erro-${id("notas")}` : undefined}
          className={CLASSE_ENTRADA}
        />
      </Campo>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={ocupado}
          className="rounded-md bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60"
        >
          {editando ? "Salvar alterações" : "Registrar partida"}
        </button>
        {editando && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="rounded-md bg-white px-4 py-2 font-medium text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
