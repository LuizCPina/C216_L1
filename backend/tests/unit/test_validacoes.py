"""Testes das funcoes de apoio da API (app/validacoes.py)."""

import pytest

from app.validacoes import (
    montar_url_banco,
    normalizar_email,
    tem_estoque,
    validar_preco,
)


@pytest.fixture
def produto():
    """Produto de exemplo reaproveitado pelos testes de preco e estoque."""
    return {"nome": "Teclado", "preco": 149.9, "estoque": 10}


def test_normalizar_email_remove_espacos_e_maiusculas():
    assert normalizar_email("  Maria@Example.COM  ") == "maria@example.com"


def test_normalizar_email_sem_arroba_levanta_erro():
    with pytest.raises(ValueError, match="email invalido"):
        normalizar_email("maria.example.com")


def test_validar_preco_negativo_levanta_erro():
    with pytest.raises(ValueError, match="negativo"):
        validar_preco(-1)


def test_validar_preco_aceita_o_preco_do_produto(produto):
    assert validar_preco(produto["preco"]) == 149.9


@pytest.mark.parametrize(
    "entrada, esperado",
    [
        ("ana@teste.com", "ana@teste.com"),
        ("ANA@TESTE.COM", "ana@teste.com"),
        ("  ana@teste.com  ", "ana@teste.com"),
        ("Ana@Teste.Com", "ana@teste.com"),
    ],
)
def test_normalizar_email_parametrizado(entrada, esperado):
    assert normalizar_email(entrada) == esperado


@pytest.mark.parametrize(
    "quantidade, esperado",
    [
        (0, True),
        (1, True),
        (10, True),
        (11, False),
    ],
)
def test_tem_estoque_parametrizado(produto, quantidade, esperado):
    assert tem_estoque(produto["estoque"], quantidade) is esperado


def test_montar_url_banco_usa_o_formato_do_compose():
    url = montar_url_banco("app", "app", "db", 5432, "app")
    assert url == "postgresql+psycopg://app:app@db:5432/app"
