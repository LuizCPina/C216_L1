"""Modelo ORM do recurso de usuarios.

Este e o modelo de persistencia: descreve a tabela. Os modelos de entrada e
saida da API sao outros, ficam em app/schemas/user.py e usam Pydantic.
"""

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class User(Base):
    """Linha da tabela users."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(80), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )

    def __repr__(self):
        return f"<User id={self.id} email={self.email!r}>"
