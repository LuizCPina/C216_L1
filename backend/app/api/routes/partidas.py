"""Rotas HTTP do recurso de partidas.

Listar e registrar ficam dentro da sessao (/sessoes/{id}/partidas). Buscar,
editar e remover usam o id da propria partida (/partidas/{id}).
"""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DbSession
from app.schemas.partida import PartidaCreate, PartidaOut, PartidaReplace
from app.services import partida as servico
from app.services import sessao as servico_sessao

router = APIRouter(tags=["partidas"])


@router.get("/sessoes/{sessao_id}/partidas", response_model=list[PartidaOut])
def listar_partidas(sessao_id: int, db: DbSession):
    """Lista as partidas da sessao, na ordem em que foram jogadas."""
    try:
        return servico.listar_da_sessao(db, sessao_id)
    except servico_sessao.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.post(
    "/sessoes/{sessao_id}/partidas",
    response_model=PartidaOut,
    status_code=status.HTTP_201_CREATED,
)
def registrar_partida(sessao_id: int, dados: PartidaCreate, db: DbSession):
    """Registra uma partida na sessao aberta."""
    try:
        return servico.registrar(db, sessao_id, dados)
    except servico_sessao.SessaoNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.SessaoEncerrada as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))
    except servico.PartidaInvalida as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(erro)
        )


@router.get("/partidas/{partida_id}", response_model=PartidaOut)
def buscar_partida(partida_id: int, db: DbSession):
    """Busca uma partida pelo id."""
    try:
        return servico.buscar(db, partida_id)
    except servico.PartidaNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.put("/partidas/{partida_id}", response_model=PartidaOut)
def substituir_partida(partida_id: int, dados: PartidaReplace, db: DbSession):
    """Substitui todos os campos da partida."""
    try:
        return servico.substituir(db, partida_id, dados)
    except servico.PartidaNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.SessaoEncerrada as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))
    except servico.PartidaInvalida as erro:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(erro)
        )


@router.delete("/partidas/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_partida(partida_id: int, db: DbSession):
    """Remove a partida."""
    try:
        servico.remover(db, partida_id)
    except servico.PartidaNaoEncontrada as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.SessaoEncerrada as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))
