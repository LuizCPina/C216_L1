"""Fixtures dos testes de integracao."""

import pytest
from fastapi.testclient import TestClient

from app.db.session import get_db
from app.main import app


@pytest.fixture
def client(db):
    """Cliente HTTP da aplicacao real, com o banco de teste no lugar do Postgres.

    dependency_overrides troca a dependencia get_db por uma que devolve a
    sessao de teste. A aplicacao em si nao muda: continua recebendo a sessao
    por injecao, sem saber qual banco esta do outro lado.
    """
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as cliente:
        yield cliente
    app.dependency_overrides.clear()


@pytest.fixture
def usuario_criado(client):
    """Cria um usuario pela API e devolve o corpo da resposta."""
    resposta = client.post("/users", json={"nome": "Ana", "email": "ana@teste.com"})
    assert resposta.status_code == 201
    return resposta.json()
