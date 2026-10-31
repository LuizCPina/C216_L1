"""Configuracao da aplicacao, lida de variaveis de ambiente."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Valores de configuracao do projeto.

    Cada campo e preenchido pela variavel de ambiente de mesmo nome, em
    maiusculas (database_url vem de DATABASE_URL). Se existir um arquivo .env
    na pasta do backend ou na raiz do repositorio, ele tambem e lido.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+psycopg://app:app@localhost:5432/app"


settings = Settings()
