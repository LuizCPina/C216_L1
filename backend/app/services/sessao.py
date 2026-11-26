"""Regras de negocio das sessoes.

O servico nao sabe onde os dados ficam guardados: ele pede tudo ao
repositorio e cuida apenas das regras. A sessao do banco (db) so passa por
aqui a caminho do repositorio.
"""

from sqlalchemy.orm import Session

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
    db: Session,
    playlist: Playlist | None = None,
    status: StatusSessao | None = None,
) -> list[Sessao]:
    """Lista as sessoes, opcionalmente filtrando por playlist e status."""
    return repositorio.listar(db, playlist=playlist, status=status)


def buscar(db: Session, sessao_id: int) -> Sessao:
    """Retorna uma sessao pelo id."""
    sessao = repositorio.buscar_por_id(db, sessao_id)
    if sessao is None:
        raise SessaoNaoEncontrada(f"Sessão {sessao_id} não encontrada.")
    return sessao


def iniciar(db: Session, dados: SessaoCreate) -> Sessao:
    """Abre uma sessao nova. So pode existir uma sessao aberta por vez."""
    aberta = repositorio.buscar_aberta(db)
    if aberta is not None:
        raise SessaoJaAberta(
            f"Já existe uma sessão aberta (sessão {aberta.id}). "
            "Encerre-a antes de iniciar outra."
        )
    return repositorio.criar(
        db,
        playlist=dados.playlist,
        mmr_inicial=dados.mmr_inicial,
        observacoes=dados.observacoes,
    )


def atualizar(db: Session, sessao_id: int, dados: SessaoPatch) -> Sessao:
    """Atualiza so os campos enviados. Vale tambem para sessao encerrada."""
    sessao = buscar(db, sessao_id)
    alteracoes = dados.model_dump(exclude_unset=True)
    if not alteracoes:
        return sessao
    return repositorio.atualizar(db, sessao, alteracoes)


def encerrar(db: Session, sessao_id: int) -> Sessao:
    """Fecha a sessao e registra o horario do encerramento."""
    sessao = buscar(db, sessao_id)
    if sessao.status == StatusSessao.ENCERRADA:
        raise SessaoJaEncerrada(f"A sessão {sessao_id} já está encerrada.")
    return repositorio.atualizar(
        db, sessao, {"status": StatusSessao.ENCERRADA, "encerrada_em": agora()}
    )


def remover(db: Session, sessao_id: int) -> None:
    """Apaga a sessao. O banco apaga as partidas dela junto (ON DELETE CASCADE)."""
    sessao = buscar(db, sessao_id)
    repositorio.remover(db, sessao)
