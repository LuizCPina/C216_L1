"""Ambiente de execucao das migracoes do Alembic.

A URL do banco nao fica no alembic.ini: ela vem da mesma configuracao que a
aplicacao usa (variavel de ambiente DATABASE_URL), para que migracao e API
nunca apontem para bancos diferentes.
"""

from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context
from app.core.config import settings
from app.db.base import Base

# Importar os modelos registra as tabelas em Base.metadata, que e o que o
# autogenerate compara com o banco. Sem este import o Alembic acha que o
# schema esperado esta vazio.
from app.models import user  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera o SQL sem abrir conexao (alembic upgrade --sql)."""
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Aplica as migracoes conectando no banco."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
