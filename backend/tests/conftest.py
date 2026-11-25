"""Fixtures compartilhadas por todos os testes."""

import pytest

from app.repositories import sessao as repositorio_sessao


@pytest.fixture(autouse=True)
def limpar_armazenamento():
    """Cada teste comeca com o armazenamento vazio."""
    repositorio_sessao.limpar()
    yield
    repositorio_sessao.limpar()
