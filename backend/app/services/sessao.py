"""Regras de negocio das sessoes.

O servico nao sabe onde os dados ficam guardados: ele pede tudo ao
repositorio e cuida apenas das regras.
"""

from app.models.sessao import Playlist, Sessao, StatusSessao, agora
from app.repositories import sessao as repositorio
from app.schemas.sessao import SessaoCreate, SessaoPatch


class SessaoNaoEncontrada(Exception):
    """Levantada quando o id pedido nao existe."""


class SessaoJaAberta(Exception):
    """Levantada ao tentar iniciar uma sessao com outra ainda aberta."""


class SessaoJaEncerrada(Exception):
    """Levantada ao tentar encerrar uma sessao que ja foi encerrada."""


def listar(
    playlist: Playlist | None = None, status: StatusSessao | None = None
) -> list[Sessao]:
    """Lista as sessoes, opcionalmente filtrando por playlist e status."""
    return repositorio.listar(playlist=playlist, status=status)


def buscar(sessao_id: int) -> Sessao:
    """Retorna uma sessao pelo id."""
    sessao = repositorio.buscar_por_id(sessao_id)
    if sessao is None:
        raise SessaoNaoEncontrada(f"Sessão {sessao_id} não encontrada.")
    return sessao


def iniciar(dados: SessaoCreate) -> Sessao:
    """Abre uma sessao nova. So pode existir uma sessao aberta por vez."""
    aberta = repositorio.buscar_aberta()
    if aberta is not None:
        raise SessaoJaAberta(
            f"Já existe uma sessão aberta (sessão {aberta.id}). "
            "Encerre-a antes de iniciar outra."
        )
    return repositorio.criar(
        playlist=dados.playlist,
        mmr_inicial=dados.mmr_inicial,
        observacoes=dados.observacoes,
    )


def atualizar(sessao_id: int, dados: SessaoPatch) -> Sessao:
    """Atualiza so os campos enviados. Vale tambem para sessao encerrada."""
    sessao = buscar(sessao_id)
    alteracoes = dados.model_dump(exclude_unset=True)
    if not alteracoes:
        return sessao
    return repositorio.atualizar(sessao, alteracoes)


def encerrar(sessao_id: int) -> Sessao:
    """Fecha a sessao e registra o horario do encerramento."""
    sessao = buscar(sessao_id)
    if sessao.status == StatusSessao.ENCERRADA:
        raise SessaoJaEncerrada(f"A sessão {sessao_id} já está encerrada.")
    return repositorio.atualizar(
        sessao, {"status": StatusSessao.ENCERRADA, "encerrada_em": agora()}
    )


def remover(sessao_id: int) -> None:
    """Apaga a sessao."""
    sessao = buscar(sessao_id)
    repositorio.remover(sessao)
