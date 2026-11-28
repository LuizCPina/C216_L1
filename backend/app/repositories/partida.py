"""Acesso aos dados de partidas.

Mesmo esquema do repositorio de sessoes: so aqui existe SQL, e cada funcao
que muda dados confirma a mudanca com commit.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.partida import Partida


def listar_por_sessao(db: Session, sessao_id: int) -> list[Partida]:
    """Partidas de uma sessao, na ordem em que foram jogadas."""
    consulta = (
        select(Partida).where(Partida.sessao_id == sessao_id).order_by(Partida.id)
    )
    return list(db.scalars(consulta))


def buscar_por_id(db: Session, partida_id: int) -> Partida | None:
    """Retorna a partida com esse id, ou None."""
    return db.get(Partida, partida_id)


def criar(db: Session, sessao_id: int, campos: dict) -> Partida:
    """Insere uma partida na sessao e devolve a linha gravada, ja com o id."""
    partida = Partida(sessao_id=sessao_id, **campos)
    db.add(partida)
    db.commit()
    db.refresh(partida)
    return partida


def atualizar(db: Session, partida: Partida, campos: dict) -> Partida:
    """Grava os campos informados na partida recebida."""
    for campo, valor in campos.items():
        setattr(partida, campo, valor)
    db.commit()
    db.refresh(partida)
    return partida


def remover(db: Session, partida: Partida) -> None:
    """Apaga a partida recebida."""
    db.delete(partida)
    db.commit()
