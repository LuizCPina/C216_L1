"""Acesso aos dados de partidas.

Mesmo esquema do repositorio de sessoes: um dicionario em memoria que sera
trocado pelo banco sem mudar a interface.
"""

from app.models.partida import Partida

_partidas: dict[int, Partida] = {}
_proximo_id = 1


def limpar() -> None:
    """Apaga todas as partidas. Usado pelos testes."""
    global _proximo_id

    _partidas.clear()
    _proximo_id = 1


def listar_por_sessao(sessao_id: int) -> list[Partida]:
    """Partidas de uma sessao, na ordem em que foram jogadas."""
    partidas = [p for p in _partidas.values() if p.sessao_id == sessao_id]
    return sorted(partidas, key=lambda partida: partida.id)


def buscar_por_id(partida_id: int) -> Partida | None:
    """Retorna a partida com esse id, ou None."""
    return _partidas.get(partida_id)


def criar(sessao_id: int, campos: dict) -> Partida:
    """Guarda uma partida nova na sessao e devolve ela ja com o id."""
    global _proximo_id

    partida = Partida(id=_proximo_id, sessao_id=sessao_id, **campos)
    _partidas[partida.id] = partida
    _proximo_id += 1
    return partida


def atualizar(partida: Partida, campos: dict) -> Partida:
    """Grava os campos informados na partida recebida."""
    for campo, valor in campos.items():
        setattr(partida, campo, valor)
    return partida


def remover(partida: Partida) -> None:
    """Apaga a partida recebida."""
    del _partidas[partida.id]


def remover_por_sessao(sessao_id: int) -> None:
    """Apaga todas as partidas de uma sessao."""
    for partida in listar_por_sessao(sessao_id):
        del _partidas[partida.id]
