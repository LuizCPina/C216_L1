"""Fixtures compartilhadas por todos os testes.

Os testes nao usam o PostgreSQL: sobem um SQLite em memoria com o mesmo schema
declarado nos modelos ORM. Assim `make test` funciona sem Docker ligado e sem
depender de um banco externo, e a suite continua rapida.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models import user  # noqa: F401  (registra a tabela em Base.metadata)


@pytest.fixture
def engine_de_teste():
    """Banco SQLite em memoria, criado e descartado a cada teste.

    StaticPool mantem a mesma conexao viva durante o teste. Sem ele cada nova
    sessao abriria um banco em memoria diferente, vazio.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine_de_teste):
    """Sessao do SQLAlchemy ligada ao banco de teste."""
    Sessao = sessionmaker(bind=engine_de_teste, autoflush=False, autocommit=False)
    sessao = Sessao()
    try:
        yield sessao
    finally:
        sessao.close()
