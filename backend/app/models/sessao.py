"""Entidade Sessao.

Por enquanto e uma classe simples, guardada em memoria. Na etapa do banco
ela vira um modelo do SQLAlchemy com os mesmos campos.
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum


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


@dataclass
class Sessao:
    """Um periodo jogando uma playlist."""

    id: int
    playlist: Playlist
    mmr_inicial: int
    observacoes: str | None = None
    status: StatusSessao = StatusSessao.ABERTA
    iniciada_em: datetime = field(default_factory=agora)
    encerrada_em: datetime | None = None
