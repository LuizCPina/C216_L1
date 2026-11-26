"""Modelo ORM da tabela sessoes.

Continua sendo uma dataclass, agora mapeada para uma tabela do banco. Os
enums sao gravados pelo valor ("2v2", "aberta"), e nao pelo nome.
"""

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Playlist(StrEnum):
    """Modos ranqueados que podem ser registrados."""

    UM_CONTRA_UM = "1v1"
    DOIS_CONTRA_DOIS = "2v2"
    TRES_CONTRA_TRES = "3v3"


class StatusSessao(StrEnum):
    """Uma sessao comeca aberta e e encerrada pelo jogador."""

    ABERTA = "aberta"
    ENCERRADA = "encerrada"


def agora() -> datetime:
    """Data e hora atual em UTC."""
    return datetime.now(UTC)


def _valores(enum):
    """Faz o SQLAlchemy gravar o valor do enum em vez do nome."""
    return [membro.value for membro in enum]


class Sessao(Base):
    """Um periodo jogando uma playlist."""

    __tablename__ = "sessoes"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    playlist: Mapped[Playlist] = mapped_column(
        Enum(Playlist, native_enum=False, values_callable=_valores)
    )
    mmr_inicial: Mapped[int]
    observacoes: Mapped[str | None] = mapped_column(String(500), default=None)
    status: Mapped[StatusSessao] = mapped_column(
        Enum(StatusSessao, native_enum=False, values_callable=_valores),
        default=StatusSessao.ABERTA,
    )
    iniciada_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default_factory=agora
    )
    encerrada_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
