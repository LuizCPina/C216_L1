import { useCallback, useEffect, useState } from "react";
import {
  editarPartida,
  encerrarSessao,
  estatisticasDaSessao,
  iniciarSessao,
  listarPartidas,
  listarSessoes,
  registrarPartida,
  removerPartida,
} from "../api.js";
import Aviso from "../components/Aviso.jsx";
import EstatisticasCards from "../components/EstatisticasCards.jsx";
import GraficoMmr from "../components/GraficoMmr.jsx";
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
  const [estatisticas, setEstatisticas] = useState(null);
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
      if (atual) {
        // As partidas e os numeros da sessao sao buscados ao mesmo tempo.
        const [daSessao, numeros] = await Promise.all([
          listarPartidas(atual.id),
          estatisticasDaSessao(atual.id),
        ]);
        setPartidas(daSessao);
        setEstatisticas(numeros);
      }
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

  /** Os numeros sao calculados pela API: depois de mexer nas partidas, pede de novo. */
  async function recalcularEstatisticas(sessaoId) {
    setEstatisticas(await estatisticasDaSessao(sessaoId));
  }

  function iniciar(dados) {
    return executar(
      async () => {
        const nova = await iniciarSessao(dados);
        // A sessao nova comeca sem partidas, mesmo que a anterior tivesse.
        setSessao(nova);
        setPartidas([]);
        await recalcularEstatisticas(nova.id);
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
        // Os numeros desta sessao nao podem aparecer na proxima.
        setEstatisticas(null);
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
        await recalcularEstatisticas(sessao.id);
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
        await recalcularEstatisticas(sessao.id);
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
        await recalcularEstatisticas(sessao.id);
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

  // Quanto o MMR mudou em cada partida, que a API manda na evolucao da sessao.
  const variacoes = Object.fromEntries(
    (estatisticas?.evolucao ?? []).map((ponto) => [ponto.partida_id, ponto.variacao]),
  );

  const avisos = (
    <>
      {emAndamento && <Aviso tipo="carregando">{emAndamento}</Aviso>}
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </>
  );

  if (!sessao) {
    return (
      <div className="space-y-4">
        {avisos}
        <IniciarSessaoForm onIniciar={iniciar} ocupado={ocupado} />
      </div>
    );
  }

  // Na tela grande (lg), duas colunas: a sessao e o formulario na esquerda,
  // os numeros e as partidas na direita. No celular, uma coluna so, nesta
  // mesma ordem.
  return (
    <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
      <div className="space-y-4 lg:col-span-2">
        <SessaoCard
          sessao={sessao}
          mmrAtual={estatisticas?.mmr_atual}
          variacaoMmr={estatisticas?.variacao_mmr}
          onEncerrar={encerrar}
          ocupado={ocupado}
        />
        {/* O formulario fica parado na tela (sticky) enquanto a lista rola. Os
            avisos vem junto, para o resultado aparecer do lado de quem clicou. */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {avisos}
          <PartidaForm playlist={sessao.playlist} onSalvar={registrar} ocupado={ocupado} />
        </div>
      </div>

      <div className="space-y-4 lg:col-span-3">
        {estatisticas && (
          <>
            <EstatisticasCards titulo="Estatísticas da sessão" estatisticas={estatisticas} />
            <GraficoMmr mmrInicial={estatisticas.mmr_inicial} evolucao={estatisticas.evolucao} />
          </>
        )}
        <PartidaLista
          partidas={partidas}
          variacoes={variacoes}
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
      </div>
    </div>
  );
}
