"""Configuracao lida das variaveis de ambiente.

O valor padrao aponta para o Postgres do compose acessado pela maquina
local. Dentro do Docker, o compose passa a DATABASE_URL com o host db.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Valores que mudam de um ambiente para outro."""

    database_url: str = "postgresql+psycopg://app:app@localhost:5432/app"

    # Enderecos do frontend que podem chamar a API pelo navegador, separados
    # por virgula. O padrao cobre o Vite rodando na maquina local.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def origens_cors(self) -> list[str]:
        """As origens do CORS como lista, sem espacos nem itens vazios."""
        origens = (origem.strip() for origem in self.cors_origins.split(","))
        return [origem for origem in origens if origem]


settings = Settings()
