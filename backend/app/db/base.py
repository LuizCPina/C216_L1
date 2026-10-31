"""Base declarativa compartilhada por todos os modelos ORM.

O Alembic importa esta classe para descobrir o schema esperado quando gera e
aplica as migracoes.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Classe base de todos os modelos ORM do projeto."""
