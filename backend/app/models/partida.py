"""Modelo ORM da tabela partidas.

Cada partida aponta para a sessao dela. Se a sessao for apagada no banco,
as partidas vao junto (ondelete CASCADE).
"""

from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.sessao import agora


class Resultado(StrEnum):
    """Toda partida termina em vitoria ou derrota."""

    VITORIA = "vitoria"
    DERROTA = "derrota"


class Partida(Base):
    """Uma partida ranqueada dentro de uma sessao."""

    __tablename__ = "partidas"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    sessao_id: Mapped[int] = mapped_column(
        ForeignKey("sessoes.id", ondelete="CASCADE"), index=True
    )
    gols_pro: Mapped[int]
    gols_contra: Mapped[int]
    mmr_depois: Mapped[int]
    overtime: Mapped[bool] = mapped_column(default=False)
    companheiro: Mapped[str | None] = mapped_column(String(50), default=None)
    notas: Mapped[str | None] = mapped_column(String(500), default=None)
    jogada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default_factory=agora
    )

    @property
    def resultado(self) -> Resultado:
        """Calculado pelo placar, nunca gravado: quem fez mais gols venceu."""
        if self.gols_pro > self.gols_contra:
            return Resultado.VITORIA
        return Resultado.DERROTA
