"""Schemas Pydantic do recurso de partidas.

Validam o formato dos campos. Regras que dependem do placar ou da sessao
(como nao aceitar empate) ficam no servico.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.partida import Resultado


class PartidaBase(BaseModel):
    """Campos comuns a criacao e a edicao de uma partida."""

    gols_pro: int = Field(ge=0)
    gols_contra: int = Field(ge=0)
    overtime: bool = False
    mmr_depois: int = Field(ge=0)
    companheiro: str | None = Field(default=None, max_length=50)
    notas: str | None = Field(default=None, max_length=500)


class PartidaCreate(PartidaBase):
    """Corpo do POST /sessoes/{sessao_id}/partidas."""


class PartidaReplace(PartidaBase):
    """Corpo do PUT /partidas/{partida_id}: substitui a partida inteira."""


class PartidaOut(PartidaBase):
    """Partida como ela sai da API, com o resultado ja calculado."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    sessao_id: int
    resultado: Resultado
    jogada_em: datetime
