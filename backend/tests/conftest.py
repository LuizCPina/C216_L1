"""Fixtures compartilhadas por todos os testes."""

import pytest

from app.services import user as servico


@pytest.fixture(autouse=True)
def armazenamento_limpo():
    """Zera o armazenamento em memoria antes e depois de cada teste.

    Sem isso um teste enxergaria os usuarios criados pelo anterior, e a ordem
    de execucao passaria a influenciar o resultado.
    """
    servico.resetar()
    yield
    servico.resetar()
