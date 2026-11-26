"""Fixtures compartilhadas por todos os testes.

Os testes nao usam o PostgreSQL: sobem um SQLite em memoria com as mesmas
tabelas declaradas nos modelos ORM. Assim `make test` e o CI funcionam sem
Docker e sem depender de um banco externo, e a suite continua rapida.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models import partida, sessao  # noqa: F401 (registra as tabelas)


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

    @event.listens_for(engine, "connect")
    def ligar_chaves_estrangeiras(conexao, _registro):
        # O SQLite ignora chaves estrangeiras por padrao. Ligando, ele recusa
        # partida sem sessao e aplica o ON DELETE CASCADE, como o Postgres.
        conexao.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine_de_teste):
    """Sessao do SQLAlchemy ligada ao banco de teste."""
    fabrica = sessionmaker(bind=engine_de_teste)
    sessao_db = fabrica()
    try:
        yield sessao_db
    finally:
        sessao_db.close()
