import { useCallback, useEffect, useState } from "react";
import { encerrarSessao, iniciarSessao, listarSessoes } from "../api.js";
import Aviso from "../components/Aviso.jsx";
import IniciarSessaoForm from "../components/IniciarSessaoForm.jsx";
import SessaoCard from "../components/SessaoCard.jsx";

/**
 * Pagina da sessao atual.
 *
 * E aqui que mora o estado e que a API e chamada. Os componentes so recebem
 * dados e devolvem eventos. Cada chamada passa por tres estados visiveis:
 * carregando (ou botao ocupado), sucesso e erro.
 */
export default function SessaoAtualPage() {
  const [sessao, setSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [falhaAoCarregar, setFalhaAoCarregar] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState(null);
  const [sucesso, setSucesso] = useState(null);

  // A sessao atual e a unica aberta: a API nao deixa existir duas.
  const carregar = useCallback(async () => {
    setCarregando(true);
    setFalhaAoCarregar(null);
    try {
      const abertas = await listarSessoes({ status: "aberta" });
      setSessao(abertas[0] ?? null);
    } catch (falha) {
      setFalhaAoCarregar(falha.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  /** Roda uma acao na API e mostra o resultado: sucesso ou a mensagem de erro. */
  async function executar(acao, mensagemDeSucesso) {
    setOcupado(true);
    setErro(null);
    setSucesso(null);
    try {
      await acao();
      setSucesso(mensagemDeSucesso);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setOcupado(false);
    }
  }

  function iniciar(dados) {
    return executar(async () => {
      setSessao(await iniciarSessao(dados));
    }, `Sessão ${dados.playlist} iniciada. Boa sorte nas ranqueadas!`);
  }

  function encerrar() {
    return executar(async () => {
      await encerrarSessao(sessao.id);
      setSessao(null);
    }, "Sessão encerrada. Ela continua guardada no histórico.");
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
      {sucesso && <Aviso tipo="sucesso">{sucesso}</Aviso>}
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      {sessao ? (
        <SessaoCard sessao={sessao} onEncerrar={encerrar} ocupado={ocupado} />
      ) : (
        <IniciarSessaoForm onIniciar={iniciar} ocupado={ocupado} />
      )}
    </div>
  );
}
