"""Fixtures dos testes de integracao."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Cliente HTTP que executa a aplicacao real, sem subir um servidor."""
    with TestClient(app) as cliente:
        yield cliente


@pytest.fixture
def usuario_criado(client):
    """Cria um usuario pela API e devolve o corpo da resposta."""
    resposta = client.post("/users", json={"nome": "Ana", "email": "ana@teste.com"})
    assert resposta.status_code == 201
    return resposta.json()
