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
def sessao_aberta(client):
    """Inicia uma sessao pela API e devolve o corpo da resposta."""
    resposta = client.post("/sessoes", json={"playlist": "2v2", "mmr_inicial": 1000})
    assert resposta.status_code == 201
    return resposta.json()


@pytest.fixture
def partida_registrada(client, sessao_aberta):
    """Registra uma vitoria por 3x1 na sessao aberta e devolve o corpo."""
    resposta = client.post(
        f"/sessoes/{sessao_aberta['id']}/partidas",
        json={"gols_pro": 3, "gols_contra": 1, "mmr_depois": 1010},
    )
    assert resposta.status_code == 201
    return resposta.json()
