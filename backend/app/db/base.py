"""Base dos modelos ORM.

O MappedAsDataclass faz cada modelo continuar sendo uma dataclass, como as
entidades ja eram: o construtor e os valores padrao ficam iguais.
"""

from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass


class Base(MappedAsDataclass, DeclarativeBase):
    """Classe base de todos os modelos do banco."""
