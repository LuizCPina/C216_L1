import { useCallback, useEffect, useState } from "react";
import { estatisticasDaSessao, estatisticasGerais, listarSessoes } from "../api.js";
import Aviso from "../components/Aviso.jsx";
import { CLASSE_ENTRADA } from "../components/Campo.jsx";
import EstatisticasCards from "../components/EstatisticasCards.jsx";
import HistoricoLista from "../components/HistoricoLista.jsx";
import { PLAYLISTS } from "../validacao.js";

/**
 * Pagina do historico: resumo geral e sessoes encerradas, com filtro.
 *
 * Toda vez que o filtro muda, busca tudo de novo na API. Enquanto busca, o
 * filtro fica travado, para uma resposta antiga nao chegar depois da nova.
 */
export default function HistoricoPage() {
  const [playlist, setPlaylist] = useState("");
  const [gerais, setGerais] = useState(null);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [falha, setFalha] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setFalha(null);
    try {
      // Playlist vazia ("Todas") nem entra na URL: o api.js ignora filtro vazio.
      const [numeros, encerradas] = await Promise.all([
        estatisticasGerais({ playlist }),
        listarSessoes({ playlist, status: "encerrada" }),
      ]);
      // O resumo de cada sessao: uma chamada por sessao, todas ao mesmo tempo.
      const resumos = await Promise.all(
        encerradas.map((sessao) => estatisticasDaSessao(sessao.id)),
      );
      setGerais(numeros);
      setItens(encerradas.map((sessao, indice) => ({ sessao, estatisticas: resumos[indice] })));
    } catch (erro) {
      setFalha(erro.message);
    } finally {
      setCarregando(false);
    }
  }, [playlist]);

  // Roda na primeira vez e sempre que o filtro muda (carregar depende dele).
  useEffect(() => {
    carregar();
  }, [carregar]);

  const quantasSessoes = gerais?.sessoes === 1 ? "1 sessão" : `${gerais?.sessoes} sessões`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label htmlFor="filtro-playlist" className="text-sm font-medium text-slate-700">
          Playlist
        </label>
        <select
          id="filtro-playlist"
          value={playlist}
          onChange={(evento) => setPlaylist(evento.target.value)}
          disabled={carregando}
          className={`${CLASSE_ENTRADA} max-w-40`}
        >
          <option value="">Todas</option>
          {PLAYLISTS.map((opcao) => (
            <option key={opcao} value={opcao}>
              {opcao}
            </option>
          ))}
        </select>
      </div>

      {carregando && <Aviso tipo="carregando">Carregando o histórico...</Aviso>}

      {!carregando && falha && (
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
          {falha}
        </Aviso>
      )}

      {!carregando && !falha && gerais && (
        <>
          <EstatisticasCards
            titulo="Resumo geral"
            descricao={`${quantasSessoes} no total, contando a que estiver aberta.`}
            estatisticas={gerais}
          />
          <HistoricoLista itens={itens} playlist={playlist} />
        </>
      )}
    </div>
  );
}
