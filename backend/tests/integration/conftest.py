"""Fixtures dos testes de integracao."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Cliente HTTP que executa a aplicacao real, sem subir servidor."""
    with TestClient(app) as cliente:
        yield cliente


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
