"""Configuracao lida das variaveis de ambiente.

O valor padrao aponta para o Postgres do compose acessado pela maquina
local. Dentro do Docker, o compose passa a DATABASE_URL com o host db.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Valores que mudam de um ambiente para outro."""

    database_url: str = "postgresql+psycopg://app:app@localhost:5432/app"


settings = Settings()
