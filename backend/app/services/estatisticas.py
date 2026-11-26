"""Calculo das estatisticas.

Nada aqui e gravado: os numeros saem das partidas toda vez que alguem pede.
Assim, editar ou apagar uma partida nunca deixa as estatisticas erradas.
"""

from app.models.partida import Partida, Resultado
from app.models.sessao import Playlist
from app.schemas.estatisticas import (
    EstatisticasGeraisOut,
    EstatisticasSessaoOut,
    PontoMmrOut,
    ResumoOut,
    SequenciaOut,
)
from app.services import partida as servico_partida
from app.services import sessao as servico_sessao


def da_sessao(sessao_id: int) -> EstatisticasSessaoOut:
    """Estatisticas de uma sessao, incluindo a evolucao do MMR."""
    sessao = servico_sessao.buscar(sessao_id)
    partidas = servico_partida.listar_da_sessao(sessao_id)
    mmr_atual = partidas[-1].mmr_depois if partidas else sessao.mmr_inicial

    return EstatisticasSessaoOut(
        **_resumir(partidas).model_dump(),
        sessao_id=sessao.id,
        mmr_inicial=sessao.mmr_inicial,
        mmr_atual=mmr_atual,
        variacao_mmr=mmr_atual - sessao.mmr_inicial,
        evolucao=_evolucao_mmr(sessao.mmr_inicial, partidas),
    )


def gerais(playlist: Playlist | None = None) -> EstatisticasGeraisOut:
    """Estatisticas de todas as sessoes, da mais antiga para a mais nova."""
    sessoes = sorted(servico_sessao.listar(playlist=playlist), key=lambda s: s.id)
    partidas = []
    variacao_mmr = 0
    for sessao in sessoes:
        da_sessao_atual = servico_partida.listar_da_sessao(sessao.id)
        partidas.extend(da_sessao_atual)
        if da_sessao_atual:
            variacao_mmr += da_sessao_atual[-1].mmr_depois - sessao.mmr_inicial

    return EstatisticasGeraisOut(
        **_resumir(partidas).model_dump(),
        playlist=playlist,
        sessoes=len(sessoes),
        variacao_mmr=variacao_mmr,
    )


def _resumir(partidas: list[Partida]) -> ResumoOut:
    """Contagens, taxa de vitoria, gols e sequencia atual."""
    total = len(partidas)
    vitorias = sum(1 for p in partidas if p.resultado == Resultado.VITORIA)
    gols_pro = sum(p.gols_pro for p in partidas)
    gols_contra = sum(p.gols_contra for p in partidas)

    return ResumoOut(
        partidas=total,
        vitorias=vitorias,
        derrotas=total - vitorias,
        taxa_vitoria=round(vitorias / total * 100, 1) if total else 0.0,
        gols_pro=gols_pro,
        gols_contra=gols_contra,
        saldo_gols=gols_pro - gols_contra,
        sequencia=_sequencia_atual(partidas),
    )


def _sequencia_atual(partidas: list[Partida]) -> SequenciaOut | None:
    """Conta, de tras para frente, quantas partidas repetem o ultimo resultado."""
    if not partidas:
        return None
    ultimo = partidas[-1].resultado
    quantidade = 0
    for partida in reversed(partidas):
        if partida.resultado != ultimo:
            break
        quantidade += 1
    return SequenciaOut(resultado=ultimo, quantidade=quantidade)


def _evolucao_mmr(mmr_inicial: int, partidas: list[Partida]) -> list[PontoMmrOut]:
    """MMR depois de cada partida e a variacao em relacao a anterior."""
    pontos = []
    anterior = mmr_inicial
    for partida in partidas:
        pontos.append(
            PontoMmrOut(
                partida_id=partida.id,
                mmr_depois=partida.mmr_depois,
                variacao=partida.mmr_depois - anterior,
            )
        )
        anterior = partida.mmr_depois
    return pontos
