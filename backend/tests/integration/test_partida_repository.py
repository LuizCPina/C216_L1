"""Testes do repositorio de partidas contra um banco de verdade.

Alem das consultas, conferem o que a chave estrangeira garante: nao existe
partida sem sessao, e apagar a sessao apaga as partidas dela. O rollback antes
de conferir tem o mesmo papel do teste de sessoes: provar que houve commit.
"""

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.models.partida import Resultado
from app.models.sessao import Playlist
from app.repositories import partida as repositorio
from app.repositories import sessao as repositorio_sessao


def abrir_sessao(db):
    """Grava uma sessao 2v2 para receber as partidas."""
    return repositorio_sessao.criar(
        db, playlist=Playlist.DOIS_CONTRA_DOIS, mmr_inicial=1000, observacoes=None
    )


def jogar(db, sessao_id, gols_pro=3, gols_contra=1, mmr_depois=1010):
    """Grava uma partida na sessao."""
    campos = {
        "gols_pro": gols_pro,
        "gols_contra": gols_contra,
        "mmr_depois": mmr_depois,
    }
    return repositorio.criar(db, sessao_id, campos)


def test_criar_grava_na_sessao(db):
    sessao = abrir_sessao(db)

    partida = jogar(db, sessao.id)

    assert partida.id is not None
    assert partida.sessao_id == sessao.id
    assert partida.overtime is False
    assert partida.resultado == Resultado.VITORIA


def test_criar_confirma_com_commit(db):
    jogar(db, abrir_sessao(db).id)

    db.rollback()

    assert db.scalar(text("SELECT COUNT(*) FROM partidas")) == 1


def test_listar_por_sessao_em_ordem_e_so_da_sessao(db):
    anterior = abrir_sessao(db)
    primeira = jogar(db, anterior.id)
    segunda = jogar(db, anterior.id, gols_pro=0, gols_contra=2)
    atual = abrir_sessao(db)
    jogar(db, atual.id)

    partidas = repositorio.listar_por_sessao(db, anterior.id)

    assert [p.id for p in partidas] == [primeira.id, segunda.id]


def test_buscar_por_id_inexistente_devolve_none(db):
    assert repositorio.buscar_por_id(db, 999) is None


def test_atualizar_grava_na_tabela(db):
    partida = jogar(db, abrir_sessao(db).id)
    partida_id = partida.id

    repositorio.atualizar(db, partida, {"gols_pro": 0, "notas": "Tiltei"})
    db.rollback()

    linha = db.execute(
        text("SELECT gols_pro, notas FROM partidas WHERE id = :id"),
        {"id": partida_id},
    ).one()
    assert tuple(linha) == (0, "Tiltei")


def test_remover_apaga_da_tabela(db):
    partida = jogar(db, abrir_sessao(db).id)

    repositorio.remover(db, partida)
    db.rollback()

    assert db.scalar(text("SELECT COUNT(*) FROM partidas")) == 0


def test_partida_sem_sessao_viola_a_chave_estrangeira(db):
    with pytest.raises(IntegrityError):
        jogar(db, sessao_id=999)


def test_apagar_a_sessao_apaga_as_partidas_dela(db):
    sessao = abrir_sessao(db)
    jogar(db, sessao.id)
    jogar(db, sessao.id, gols_pro=1, gols_contra=2)
    outra = abrir_sessao(db)
    jogar(db, outra.id)

    repositorio_sessao.remover(db, sessao)

    restantes = db.scalars(text("SELECT sessao_id FROM partidas")).all()
    assert restantes == [outra.id]
