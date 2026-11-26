"""Acesso aos dados de sessoes.

Esta e a unica camada que conhece SQLAlchemy. O servico pede os dados por
estas funcoes e nunca monta consulta nem chama commit por conta propria.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sessao import Playlist, Sessao, StatusSessao


def listar(
    db: Session,
    playlist: Playlist | None = None,
    status: StatusSessao | None = None,
) -> list[Sessao]:
    """Lista as sessoes da mais recente para a mais antiga, com filtros."""
    consulta = select(Sessao).order_by(Sessao.id.desc())
    if playlist is not None:
        consulta = consulta.where(Sessao.playlist == playlist)
    if status is not None:
        consulta = consulta.where(Sessao.status == status)
    return list(db.scalars(consulta))


def buscar_por_id(db: Session, sessao_id: int) -> Sessao | None:
    """Retorna a sessao com esse id, ou None."""
    return db.get(Sessao, sessao_id)


def buscar_aberta(db: Session) -> Sessao | None:
    """Retorna a sessao que esta aberta, ou None."""
    consulta = select(Sessao).where(Sessao.status == StatusSessao.ABERTA)
    return db.scalars(consulta).first()


def criar(
    db: Session, playlist: Playlist, mmr_inicial: int, observacoes: str | None
) -> Sessao:
    """Insere uma sessao e devolve a linha gravada, ja com o id."""
    sessao = Sessao(
        playlist=playlist,
        mmr_inicial=mmr_inicial,
        observacoes=observacoes,
    )
    db.add(sessao)
    db.commit()
    db.refresh(sessao)
    return sessao


def atualizar(db: Session, sessao: Sessao, campos: dict) -> Sessao:
    """Grava os campos informados na sessao recebida."""
    for campo, valor in campos.items():
        setattr(sessao, campo, valor)
    db.commit()
    db.refresh(sessao)
    return sessao


def remover(db: Session, sessao: Sessao) -> None:
    """Apaga a sessao recebida."""
    db.delete(sessao)
    db.commit()
