"""Schemas Pydantic do recurso de sessoes.

Eles definem o formato do que entra e sai da API. As regras de negocio (por
exemplo, so uma sessao aberta por vez) ficam no servico, nao aqui.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.sessao import Playlist, StatusSessao


class SessaoCreate(BaseModel):
    """Corpo do POST /sessoes."""

    playlist: Playlist
    mmr_inicial: int = Field(ge=0)
    observacoes: str | None = Field(default=None, max_length=500)


class SessaoPatch(BaseModel):
    """Corpo do PATCH /sessoes/{sessao_id}. So as observacoes podem mudar."""

    observacoes: str | None = Field(default=None, max_length=500)


class SessaoOut(BaseModel):
    """Sessao como ela sai da API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    playlist: Playlist
    mmr_inicial: int
    status: StatusSessao
    iniciada_em: datetime
    encerrada_em: datetime | None
    observacoes: str | None
