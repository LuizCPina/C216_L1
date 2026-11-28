"""Rotas HTTP do recurso de sessoes.

As rotas so traduzem HTTP: chamam o servico e convertem as excecoes dele
em status code. Nenhuma regra de negocio mora aqui.
"""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DbSession
from app.models.sessao import Playlist, StatusSessao
from app.schemas.sessao import SessaoCreate, SessaoOut, SessaoPatch
from app.services import sessao as servico

router = APIRouter(prefix="/sessoes", tags=["sessoes"])


@router.get("", response_model=list[SessaoOut])
def listar_sessoes(
    db: DbSession,
    playlist: Annotated[
        Playlist | None, Query(description="Filtra pela playlist")
    ] = None,
    status_sessao: Annotated[
        StatusSessao | None,
        Query(alias="status", description="Filtra por aberta ou encerrada"),
    ] = None,
):
    """Lista as sessoes, da mais recente para a mais antiga."""
    return servico.listar(db, playlist=playlist, status=status_sessao)


@router.get("/{sessao_id}", response_model=SessaoOut)
def buscar_sessao(sessao_id: int, db: DbSession):
    """Busca uma sessao pelo id."""
    try:
        return servico.buscar(db, sessao_id)
    except servico.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.post("", response_model=SessaoOut, status_code=status.HTTP_201_CREATED)
def iniciar_sessao(dados: SessaoCreate, db: DbSession):
    """Inicia uma sessao. Responde 409 se ja houver uma aberta."""
    try:
        return servico.iniciar(db, dados)
    except servico.SessaoJaAberta as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.patch("/{sessao_id}", response_model=SessaoOut)
def atualizar_sessao(sessao_id: int, dados: SessaoPatch, db: DbSession):
    """Atualiza as observacoes da sessao."""
    try:
        return servico.atualizar(db, sessao_id, dados)
    except servico.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.post("/{sessao_id}/encerrar", response_model=SessaoOut)
def encerrar_sessao(sessao_id: int, db: DbSession):
    """Encerra a sessao. Responde 409 se ela ja estiver encerrada."""
    try:
        return servico.encerrar(db, sessao_id)
    except servico.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.SessaoJaEncerrada as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.delete("/{sessao_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_sessao(sessao_id: int, db: DbSession):
    """Remove a sessao."""
    try:
        servico.remover(db, sessao_id)
    except servico.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
