"""Entidade Partida.

Assim como a sessao, por enquanto e uma classe simples guardada em memoria.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum

from app.models.sessao import agora


class Resultado(StrEnum):
    """Toda partida termina em vitoria ou derrota."""

    VITORIA = "vitoria"
    DERROTA = "derrota"


@dataclass
class Partida:
    """Uma partida ranqueada dentro de uma sessao."""

    id: int
    sessao_id: int
    gols_pro: int
    gols_contra: int
    mmr_depois: int
    overtime: bool = False
    companheiro: str | None = None
    notas: str | None = None
    jogada_em: datetime = field(default_factory=agora)

    @property
    def resultado(self) -> Resultado:
        """Calculado pelo placar, nunca gravado: quem fez mais gols venceu."""
        if self.gols_pro > self.gols_contra:
            return Resultado.VITORIA
        return Resultado.DERROTA
