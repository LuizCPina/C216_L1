"""Acesso aos dados do recurso de usuarios.

Esta e a unica camada que conhece SQLAlchemy. O servico pede os dados por
estas funcoes e nunca monta consulta nem chama commit por conta propria.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


def listar(db: Session, nome: str | None = None, limite: int = 10) -> list[User]:
    """Lista usuarios ordenados por id, filtrando por trecho do nome."""
    consulta = select(User).order_by(User.id)
    if nome:
        consulta = consulta.where(User.nome.ilike(f"%{nome}%"))
    return list(db.scalars(consulta.limit(limite)))


def buscar_por_id(db: Session, user_id: int) -> User | None:
    """Retorna o usuario com esse id, ou None."""
    return db.get(User, user_id)


def buscar_por_email(db: Session, email: str) -> User | None:
    """Retorna o usuario com esse email, ou None."""
    return db.scalars(select(User).where(User.email == email)).first()


def criar(db: Session, nome: str, email: str) -> User:
    """Insere um usuario e devolve a linha gravada, ja com o id."""
    usuario = User(nome=nome, email=email)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


def atualizar(db: Session, usuario: User, campos: dict) -> User:
    """Grava os campos informados no usuario recebido."""
    for campo, valor in campos.items():
        setattr(usuario, campo, valor)
    db.commit()
    db.refresh(usuario)
    return usuario


def remover(db: Session, usuario: User) -> None:
    """Apaga o usuario recebido."""
    db.delete(usuario)
    db.commit()
