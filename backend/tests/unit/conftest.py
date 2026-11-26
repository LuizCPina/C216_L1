"""Fixtures dos testes unitarios.

Os repositorios reais sao trocados por dubles em memoria, entao estes testes
nao tocam banco nenhum: o que se verifica e a regra de negocio isolada. Como
os dubles ignoram a sessao do banco, os testes passam None no lugar dela.

Que os servicos funcionem com repositorios falsos e, por si so, a prova de
que eles nao dependem de SQLAlchemy.
"""

import pytest

from app.models.partida import Partida
from app.models.sessao import Sessao, StatusSessao
from app.services import partida as servico_partida
from app.services import sessao as servico_sessao


class RepositorioSessaoFalso:
    """Mesma interface de app/repositories/sessao.py, guardando em um dicionario."""

    def __init__(self):
        self.registros = {}
        self.proximo_id = 1

    def listar(self, db, playlist=None, status=None):
        sessoes = sorted(self.registros.values(), key=lambda s: s.id, reverse=True)
        if playlist is not None:
            sessoes = [s for s in sessoes if s.playlist == playlist]
        if status is not None:
            sessoes = [s for s in sessoes if s.status == status]
        return sessoes

    def buscar_por_id(self, db, sessao_id):
        return self.registros.get(sessao_id)

    def buscar_aberta(self, db):
        for sessao in self.registros.values():
            if sessao.status == StatusSessao.ABERTA:
                return sessao
        return None

    def criar(self, db, playlist, mmr_inicial, observacoes):
        sessao = Sessao(
            playlist=playlist, mmr_inicial=mmr_inicial, observacoes=observacoes
        )
        sessao.id = self.proximo_id
        self.registros[sessao.id] = sessao
        self.proximo_id += 1
        return sessao

    def atualizar(self, db, sessao, campos):
        for campo, valor in campos.items():
            setattr(sessao, campo, valor)
        return sessao

    def remover(self, db, sessao):
        del self.registros[sessao.id]


class RepositorioPartidaFalso:
    """Mesma interface de app/repositories/partida.py, guardando em um dicionario."""

    def __init__(self):
        self.registros = {}
        self.proximo_id = 1

    def listar_por_sessao(self, db, sessao_id):
        partidas = [p for p in self.registros.values() if p.sessao_id == sessao_id]
        return sorted(partidas, key=lambda p: p.id)

    def buscar_por_id(self, db, partida_id):
        return self.registros.get(partida_id)

    def criar(self, db, sessao_id, campos):
        partida = Partida(sessao_id=sessao_id, **campos)
        partida.id = self.proximo_id
        self.registros[partida.id] = partida
        self.proximo_id += 1
        return partida

    def atualizar(self, db, partida, campos):
        for campo, valor in campos.items():
            setattr(partida, campo, valor)
        return partida

    def remover(self, db, partida):
        del self.registros[partida.id]


@pytest.fixture(autouse=True)
def repositorios(monkeypatch):
    """Troca os repositorios reais pelos dubles dentro dos modulos de servico."""
    monkeypatch.setattr(servico_sessao, "repositorio", RepositorioSessaoFalso())
    monkeypatch.setattr(servico_partida, "repositorio", RepositorioPartidaFalso())
