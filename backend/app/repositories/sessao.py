"""Acesso aos dados de sessoes.

Nesta etapa as sessoes ficam em um dicionario na memoria. Quando entrar o
banco, so este arquivo muda: o servico continua chamando as mesmas funcoes.
"""

from app.models.sessao import Playlist, Sessao, StatusSessao

_sessoes: dict[int, Sessao] = {}
_proximo_id = 1


def limpar() -> None:
    """Apaga todas as sessoes. Usado pelos testes."""
    global _proximo_id

    _sessoes.clear()
    _proximo_id = 1


def listar(
    playlist: Playlist | None = None, status: StatusSessao | None = None
) -> list[Sessao]:
    """Lista as sessoes da mais recente para a mais antiga, com filtros."""
    sessoes = sorted(_sessoes.values(), key=lambda sessao: sessao.id, reverse=True)
    if playlist is not None:
        sessoes = [sessao for sessao in sessoes if sessao.playlist == playlist]
    if status is not None:
        sessoes = [sessao for sessao in sessoes if sessao.status == status]
    return sessoes


def buscar_por_id(sessao_id: int) -> Sessao | None:
    """Retorna a sessao com esse id, ou None."""
    return _sessoes.get(sessao_id)


def buscar_aberta() -> Sessao | None:
    """Retorna a sessao que esta aberta, ou None."""
    for sessao in _sessoes.values():
        if sessao.status == StatusSessao.ABERTA:
            return sessao
    return None


def criar(playlist: Playlist, mmr_inicial: int, observacoes: str | None) -> Sessao:
    """Guarda uma sessao nova e devolve ela ja com o id."""
    global _proximo_id

    sessao = Sessao(
        id=_proximo_id,
        playlist=playlist,
        mmr_inicial=mmr_inicial,
        observacoes=observacoes,
    )
    _sessoes[sessao.id] = sessao
    _proximo_id += 1
    return sessao


def atualizar(sessao: Sessao, campos: dict) -> Sessao:
    """Grava os campos informados na sessao recebida."""
    for campo, valor in campos.items():
        setattr(sessao, campo, valor)
    return sessao


def remover(sessao: Sessao) -> None:
    """Apaga a sessao recebida."""
    del _sessoes[sessao.id]
