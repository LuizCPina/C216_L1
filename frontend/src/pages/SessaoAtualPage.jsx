import { useCallback, useEffect, useState } from "react";
import {
  editarPartida,
  encerrarSessao,
  iniciarSessao,
  listarPartidas,
  listarSessoes,
  registrarPartida,
  removerPartida,
} from "../api.js";
import Aviso from "../components/Aviso.jsx";
import IniciarSessaoForm from "../components/IniciarSessaoForm.jsx";
import PartidaForm from "../components/PartidaForm.jsx";
import PartidaLista from "../components/PartidaLista.jsx";
import SessaoCard from "../components/SessaoCard.jsx";

/**
 * Pagina da sessao atual e das partidas dela.
 *
 * E aqui que mora o estado e que a API e chamada. Os componentes so recebem
 * dados e devolvem eventos. Cada chamada passa por tres estados visiveis:
 * carregando, sucesso e erro.
 */
export default function SessaoAtualPage() {
  const [sessao, setSessao] = useState(null);
  const [partidas, setPartidas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(null);
  const [emAndamento, setEmAndamento] = useState(null);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // Enquanto uma acao roda, todos os botoes ficam travados.
  const ocupado = emAndamento !== null;

  // A sessao atual e a unica aberta: a API nao deixa existir duas.
  const carregar = useCallback(async () => {
    setCarregando(true);
    setFalhaAoCarregar(null);
    try {
      const abertas = await listarSessoes({ status: "aberta" });
      const atual = abertas[0] ?? null;
      setPartidas(atual ? await listarPartidas(atual.id) : []);
      setSessao(atual);
    } catch (falha) {
      setFalhaAoCarregar(falha.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /**
   * Roda uma acao na API mostrando o carregando e depois o resultado.
   *
   * Devolve true quando deu certo, para o formulario saber se pode se limpar.
   */
  async function executar(acao, mensagens) {
    setEmAndamento(mensagens.carregando);
    setErro(null);
    setSucesso(null);
    try {
      await acao();
      setSucesso(mensagens.sucesso);
      return true;
    } catch (falha) {
      setErro(falha.message);
      return false;
    } finally {
      setEmAndamento(null);
    }
  }

  function iniciar(dados) {
    return executar(
      async () => {
        // A sessao nova comeca sem partidas, mesmo que a anterior tivesse.
        setSessao(await iniciarSessao(dados));
        setPartidas([]);
      },
      {
        carregando: "Iniciando a sessão...",
        sucesso: `Sessão ${dados.playlist} iniciada. Boa sorte nas ranqueadas!`,
      },
    );
  }

  function encerrar() {
    return executar(
      async () => {
        await encerrarSessao(sessao.id);
        setSessao(null);
      },
      {
        carregando: "Encerrando a sessão...",
        sucesso: "Sessão encerrada. Ela continua guardada no histórico.",
      },
    );
  }

  function registrar(dados) {
    return executar(
      async () => {
        const nova = await registrarPartida(sessao.id, dados);
        setPartidas((atuais) => [...atuais, nova]);
      },
      {
        carregando: "Registrando a partida...",
        sucesso: `Partida registrada: ${dados.gols_pro} × ${dados.gols_contra}.`,
      },
    );
  }

  function salvarEdicao(dados) {
    return executar(
      async () => {
        const atualizada = await editarPartida(editando.id, dados);
        setPartidas((atuais) =>
          atuais.map((partida) => (partida.id === atualizada.id ? atualizada : partida)),
        );
        setEditando(null);
      },
      { carregando: "Salvando a partida...", sucesso: "Partida atualizada." },
    );
  }

  function excluir(partida, numero) {
    if (!window.confirm(`Excluir a partida ${numero}? Isso não pode ser desfeito.`)) {
      return;
    }
    executar(
      async () => {
        await removerPartida(partida.id);
        setPartidas((atuais) => atuais.filter((outra) => outra.id !== partida.id));
      },
      { carregando: "Excluindo a partida...", sucesso: `Partida ${numero} excluída.` },
    );
  }

  if (carregando) {
    return <Aviso tipo="carregando">Carregando a sessão atual...</Aviso>;
  }

  if (falhaAoCarregar) {
    return (
      <Aviso
        tipo="erro"
        acao={
          <button
            type="button"
            onClick={carregar}
            className="shrink-0 rounded-md bg-white px-3 py-1.5 font-medium text-red-700 ring-1 ring-red-200 hover:bg-red-100"
          >
            Tentar de novo
          </button>
        }
      >
        {falhaAoCarregar}
      </Aviso>
    );
  }

  return (
    <div className="space-y-4">
      {emAndamento && <Aviso tipo="carregando">{emAndamento}</Aviso>}
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {sessao ? (
        <>
          <SessaoCard sessao={sessao} onEncerrar={encerrar} ocupado={ocupado} />
          <PartidaForm playlist={sessao.playlist} onSalvar={registrar} ocupado={ocupado} />
          <PartidaLista
            partidas={partidas}
            editandoId={editando?.id}
            formularioDeEdicao={
              editando && (
                <PartidaForm
                  playlist={sessao.playlist}
                  partida={editando}
                  onSalvar={salvarEdicao}
                  onCancelar={() => setEditando(null)}
                  ocupado={ocupado}
                />
              )
            }
            onEditar={setEditando}
            onExcluir={excluir}
            ocupado={ocupado}
          />
        </>
      ) : (
        <IniciarSessaoForm onIniciar={iniciar} ocupado={ocupado} />
      )}
    </div>
  );
}
