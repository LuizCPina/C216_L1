"""Testes do repositorio de sessoes contra um banco de verdade.

Aqui nao ha HTTP, mas ha SQL: as funcoes falam com o SQLAlchemy e com um
banco criado a partir dos modelos ORM. E o que garante que as consultas e os
commits do repositorio funcionam de fato.

Nos testes que mudam dados, o rollback antes da conferencia desfaz tudo o que
nao foi confirmado. Se a mudanca continua la, e porque o repositorio fez commit.
"""

from sqlalchemy import text

from app.models.sessao import Playlist, StatusSessao
from app.repositories import sessao as repositorio


def criar(db, playlist=Playlist.DOIS_CONTRA_DOIS, mmr_inicial=1000):
    """Grava uma sessao com valores padrao."""
    return repositorio.criar(
        db, playlist=playlist, mmr_inicial=mmr_inicial, observacoes=None
    )


def test_criar_grava_e_devolve_o_id(db):
    sessao = criar(db)

    assert sessao.id is not None
    assert sessao.status == StatusSessao.ABERTA
    assert sessao.iniciada_em is not None
    assert repositorio.buscar_por_id(db, sessao.id) is sessao


def test_criar_confirma_com_commit(db):
    criar(db)

    db.rollback()

    assert db.scalar(text("SELECT COUNT(*) FROM sessoes")) == 1


def test_enums_sao_gravados_pelo_valor(db):
    criar(db, playlist=Playlist.TRES_CONTRA_TRES)

    linha = db.execute(text("SELECT playlist, status FROM sessoes")).one()

    assert tuple(linha) == ("3v3", "aberta")


def test_buscar_por_id_inexistente_devolve_none(db):
    assert repositorio.buscar_por_id(db, 999) is None


def test_listar_da_mais_recente_para_a_mais_antiga(db):
    primeira = criar(db)
    segunda = criar(db)

    assert [s.id for s in repositorio.listar(db)] == [segunda.id, primeira.id]


def test_listar_filtra_por_playlist_e_status(db):
    duplas = criar(db, playlist=Playlist.DOIS_CONTRA_DOIS)
    repositorio.atualizar(db, duplas, {"status": StatusSessao.ENCERRADA})
    trios = criar(db, playlist=Playlist.TRES_CONTRA_TRES)

    so_3v3 = repositorio.listar(db, playlist=Playlist.TRES_CONTRA_TRES)
    encerradas = repositorio.listar(db, status=StatusSessao.ENCERRADA)

    assert [s.id for s in so_3v3] == [trios.id]
    assert [s.id for s in encerradas] == [duplas.id]


def test_buscar_aberta_ignora_as_encerradas(db):
    antiga = criar(db)
    repositorio.atualizar(db, antiga, {"status": StatusSessao.ENCERRADA})

    assert repositorio.buscar_aberta(db) is None

    atual = criar(db)

    assert repositorio.buscar_aberta(db) is atual


def test_atualizar_grava_na_tabela(db):
    sessao = criar(db)
    sessao_id = sessao.id

    repositorio.atualizar(db, sessao, {"observacoes": "Duo com o Pedro"})
    db.rollback()

    gravado = db.scalar(
        text("SELECT observacoes FROM sessoes WHERE id = :id"), {"id": sessao_id}
    )
    assert gravado == "Duo com o Pedro"


def test_remover_apaga_da_tabela(db):
    sessao = criar(db)

    repositorio.remover(db, sessao)
    db.rollback()

    assert db.scalar(text("SELECT COUNT(*) FROM sessoes")) == 0
