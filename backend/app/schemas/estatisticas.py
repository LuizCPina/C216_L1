"""Schemas das estatisticas.

Tudo aqui e calculado na hora a partir das partidas: nada disso e gravado.
"""

from pydantic import BaseModel

from app.models.partida import Resultado
from app.models.sessao import Playlist


class SequenciaOut(BaseModel):
    """Quantas partidas seguidas, contando da ultima, tiveram o mesmo resultado."""

    resultado: Resultado
    quantidade: int


class PontoMmrOut(BaseModel):
    """MMR depois de uma partida e quanto ele mudou em relacao a anterior."""

    partida_id: int
    mmr_depois: int
    variacao: int


class ResumoOut(BaseModel):
    """Numeros comuns a qualquer conjunto de partidas."""

    partidas: int
    vitorias: int
    derrotas: int
    taxa_vitoria: float
    gols_pro: int
    gols_contra: int
    saldo_gols: int
    sequencia: SequenciaOut | None


class EstatisticasSessaoOut(ResumoOut):
    """Estatisticas de uma sessao, com a evolucao do MMR partida a partida."""

    sessao_id: int
    mmr_inicial: int
    mmr_atual: int
    variacao_mmr: int
    evolucao: list[PontoMmrOut]


class EstatisticasGeraisOut(ResumoOut):
    """Estatisticas somando todas as sessoes, opcionalmente de uma playlist."""

    playlist: Playlist | None
    sessoes: int
    variacao_mmr: int
