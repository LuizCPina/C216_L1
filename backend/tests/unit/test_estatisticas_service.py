"""Testes unitarios das estatisticas.

Montam sessoes e partidas pelos servicos e conferem cada numero calculado.
"""

import pytest

from app.models.partida import Resultado
from app.models.sessao import Playlist
from app.schemas.partida import PartidaCreate, PartidaReplace
from app.schemas.sessao import SessaoCreate
from app.services import estatisticas as servico
from app.services import partida as servico_partida
from app.services import sessao as servico_sessao


def abrir_sessao(playlist="2v2", mmr_inicial=1000):
    """Inicia uma sessao e devolve ela."""
    return servico_sessao.iniciar(
        None, SessaoCreate(playlist=playlist, mmr_inicial=mmr_inicial)
    )


def jogar(sessao, gols_pro, gols_contra, mmr_depois):
    """Registra uma partida na sessao."""
    return servico_partida.registrar(
        None,
        sessao.id,
        PartidaCreate(
            gols_pro=gols_pro, gols_contra=gols_contra, mmr_depois=mmr_depois
        ),
    )


# Estatisticas de uma sessao


def test_sessao_sem_partidas():
    sessao = abrir_sessao(mmr_inicial=950)

    estatisticas = servico.da_sessao(None, sessao.id)

    assert estatisticas.partidas == 0
    assert estatisticas.taxa_vitoria == 0.0
    assert estatisticas.sequencia is None
    assert estatisticas.mmr_atual == 950
    assert estatisticas.variacao_mmr == 0
    assert estatisticas.evolucao == []


def test_contagens_e_taxa_de_vitoria():
    sessao = abrir_sessao()
    jogar(sessao, 3, 1, 1010)
    jogar(sessao, 2, 0, 1020)
    jogar(sessao, 1, 2, 1011)

    estatisticas = servico.da_sessao(None, sessao.id)

    assert estatisticas.partidas == 3
    assert estatisticas.vitorias == 2
    assert estatisticas.derrotas == 1
    assert estatisticas.taxa_vitoria == 66.7


def test_gols_e_saldo():
    sessao = abrir_sessao()
    jogar(sessao, 3, 1, 1010)
    jogar(sessao, 0, 2, 1001)
    jogar(sessao, 4, 3, 1010)

    estatisticas = servico.da_sessao(None, sessao.id)

    assert estatisticas.gols_pro == 7
    assert estatisticas.gols_contra == 6
    assert estatisticas.saldo_gols == 1


def test_sequencia_atual_conta_so_as_partidas_seguidas():
    sessao = abrir_sessao()
    jogar(sessao, 3, 1, 1009)
    jogar(sessao, 0, 1, 1000)
    jogar(sessao, 2, 1, 1009)
    jogar(sessao, 3, 0, 1018)

    sequencia = servico.da_sessao(None, sessao.id).sequencia

    assert sequencia.resultado == Resultado.VITORIA
    assert sequencia.quantidade == 2


def test_sequencia_atual_de_derrotas():
    sessao = abrir_sessao()
    jogar(sessao, 2, 1, 1009)
    jogar(sessao, 0, 1, 1000)
    jogar(sessao, 1, 4, 991)
    jogar(sessao, 2, 3, 982)

    sequencia = servico.da_sessao(None, sessao.id).sequencia

    assert sequencia.resultado == Resultado.DERROTA
    assert sequencia.quantidade == 3


def test_evolucao_compara_cada_partida_com_a_anterior():
    sessao = abrir_sessao(mmr_inicial=1000)
    jogar(sessao, 3, 1, 1010)
    jogar(sessao, 0, 2, 1001)
    jogar(sessao, 2, 1, 1012)

    estatisticas = servico.da_sessao(None, sessao.id)

    assert [p.variacao for p in estatisticas.evolucao] == [10, -9, 11]
    assert estatisticas.mmr_atual == 1012
    assert estatisticas.variacao_mmr == 12


def test_editar_partida_recalcula_as_estatisticas():
    sessao = abrir_sessao(mmr_inicial=1000)
    jogar(sessao, 3, 1, 1010)
    segunda = jogar(sessao, 2, 1, 1020)

    servico_partida.substituir(
        None,
        segunda.id,
        PartidaReplace(gols_pro=1, gols_contra=2, mmr_depois=1001),
    )
    estatisticas = servico.da_sessao(None, sessao.id)

    assert [p.variacao for p in estatisticas.evolucao] == [10, -9]
    assert estatisticas.derrotas == 1


def test_estatisticas_de_sessao_inexistente():
    with pytest.raises(servico_sessao.SessaoNaoEncontrada):
        servico.da_sessao(None, 99)


# Estatisticas gerais


def test_gerais_sem_nada_registrado():
    estatisticas = servico.gerais(None)

    assert estatisticas.sessoes == 0
    assert estatisticas.partidas == 0
    assert estatisticas.sequencia is None
    assert estatisticas.variacao_mmr == 0


def test_gerais_somam_todas_as_sessoes():
    ontem = abrir_sessao(mmr_inicial=1000)
    jogar(ontem, 3, 1, 1010)
    jogar(ontem, 0, 2, 1001)
    servico_sessao.encerrar(None, ontem.id)
    hoje = abrir_sessao(mmr_inicial=1001)
    jogar(hoje, 2, 1, 1012)

    estatisticas = servico.gerais(None)

    assert estatisticas.sessoes == 2
    assert estatisticas.partidas == 3
    assert estatisticas.variacao_mmr == 12


def test_gerais_filtram_por_playlist():
    duplas = abrir_sessao(playlist="2v2")
    jogar(duplas, 3, 1, 1010)
    servico_sessao.encerrar(None, duplas.id)
    trios = abrir_sessao(playlist="3v3", mmr_inicial=900)
    jogar(trios, 0, 1, 891)
    jogar(trios, 1, 3, 882)

    so_trios = servico.gerais(None, playlist=Playlist("3v3"))

    assert so_trios.playlist == Playlist("3v3")
    assert so_trios.sessoes == 1
    assert so_trios.partidas == 2
    assert so_trios.derrotas == 2
    assert servico.gerais(None).partidas == 3


def test_sequencia_geral_atravessa_as_sessoes():
    ontem = abrir_sessao()
    jogar(ontem, 3, 1, 1010)
    jogar(ontem, 2, 0, 1020)
    servico_sessao.encerrar(None, ontem.id)
    hoje = abrir_sessao(mmr_inicial=1020)
    jogar(hoje, 4, 2, 1030)

    sequencia = servico.gerais(None).sequencia

    assert sequencia.resultado == Resultado.VITORIA
    assert sequencia.quantidade == 3
