"""Rotas HTTP das estatisticas.

Sao so de leitura: os numeros sao calculados pelo servico a cada pedido.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.models.sessao import Playlist
from app.schemas.estatisticas import EstatisticasGeraisOut, EstatisticasSessaoOut
from app.services import estatisticas as servico
from app.services import sessao as servico_sessao

router = APIRouter(tags=["estatisticas"])


@router.get("/estatisticas", response_model=EstatisticasGeraisOut)
def estatisticas_gerais(
    db: DbSession,
    playlist: Annotated[
        Playlist | None, Query(description="Filtra pela playlist")
    ] = None,
):
    """Resumo de todas as sessoes, opcionalmente de uma playlist."""
    return servico.gerais(db, playlist=playlist)


@router.get("/sessoes/{sessao_id}/estatisticas", response_model=EstatisticasSessaoOut)
def estatisticas_da_sessao(sessao_id: int, db: DbSession):
    """Resumo de uma sessao, com a evolucao do MMR partida a partida."""
    try:
        return servico.da_sessao(db, sessao_id)
    except servico_sessao.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
