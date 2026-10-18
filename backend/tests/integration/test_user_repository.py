"""Testes de integracao do repositorio contra um banco de verdade.

Aqui nao ha HTTP, mas ha SQL: as funcoes falam com o SQLAlchemy e com um banco
real, criado a partir dos modelos ORM. E o que garante que as consultas e os
commits do repositorio funcionam de fato.
"""

import pytest
from sqlalchemy.exc import IntegrityError

from app.repositories import user as repositorio


def test_criar_grava_e_devolve_o_id(db):
    usuario = repositorio.criar(db, nome="Ana", email="ana@teste.com")

    assert usuario.id is not None
    assert repositorio.buscar_por_id(db, usuario.id) is usuario


def test_buscar_por_id_inexistente_devolve_none(db):
    assert repositorio.buscar_por_id(db, 999) is None


def test_buscar_por_email_encontra_o_registro(db):
    criado = repositorio.criar(db, nome="Ana", email="ana@teste.com")

    assert repositorio.buscar_por_email(db, "ana@teste.com") is criado


def test_email_duplicado_viola_a_restricao_do_banco(db):
    repositorio.criar(db, nome="Ana", email="ana@teste.com")

    with pytest.raises(IntegrityError):
        repositorio.criar(db, nome="Outra Ana", email="ana@teste.com")


def test_listar_devolve_em_ordem_de_id(db):
    repositorio.criar(db, nome="Ana", email="ana@teste.com")
    repositorio.criar(db, nome="Bruno", email="bruno@teste.com")

    nomes = [usuario.nome for usuario in repositorio.listar(db)]

    assert nomes == ["Ana", "Bruno"]


def test_listar_filtra_por_nome_sem_diferenciar_maiusculas(db):
    repositorio.criar(db, nome="Ana", email="ana@teste.com")
    repositorio.criar(db, nome="Bruno", email="bruno@teste.com")

    encontrados = repositorio.listar(db, nome="BRU")

    assert [usuario.nome for usuario in encontrados] == ["Bruno"]


def test_atualizar_persiste_os_campos(db):
    usuario = repositorio.criar(db, nome="Ana", email="ana@teste.com")

    repositorio.atualizar(db, usuario, {"nome": "Ana Maria"})

    assert repositorio.buscar_por_id(db, usuario.id).nome == "Ana Maria"


def test_remover_apaga_do_banco(db):
    usuario = repositorio.criar(db, nome="Ana", email="ana@teste.com")

    repositorio.remover(db, usuario)

    assert repositorio.buscar_por_id(db, usuario.id) is None
