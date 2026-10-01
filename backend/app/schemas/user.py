"""Modelos Pydantic do recurso de usuarios."""

from pydantic import BaseModel, Field, field_validator

from app.validacoes import normalizar_email


class UserBase(BaseModel):
    """Campos comuns a criacao e substituicao de usuario."""

    nome: str = Field(min_length=1, max_length=80)
    email: str

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        """Reaproveita a normalizacao usada no resto da aplicacao."""
        return normalizar_email(valor)


class UserCreate(UserBase):
    """Corpo do POST /users."""


class UserReplace(UserBase):
    """Corpo do PUT /users/{user_id}: substitui o recurso inteiro."""


class UserPatch(BaseModel):
    """Corpo do PATCH /users/{user_id}: todos os campos sao opcionais."""

    nome: str | None = Field(default=None, min_length=1, max_length=80)
    email: str | None = None

    @field_validator("email")
    @classmethod
    def validar_email(cls, valor):
        if valor is None:
            return None
        return normalizar_email(valor)


class UserOut(UserBase):
    """Usuario como ele sai da API."""

    id: int
