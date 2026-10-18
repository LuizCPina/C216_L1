"""Rotas HTTP do recurso de usuarios."""

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.user import UserCreate, UserOut, UserPatch, UserReplace
from app.services import user as servico

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def listar_usuarios(
    nome: str | None = Query(default=None, description="Filtra por trecho do nome"),
    limite: int = Query(default=10, ge=1, le=100, description="Maximo de registros"),
):
    """Lista os usuarios cadastrados (query parameters)."""
    return servico.listar(nome=nome, limite=limite)


@router.get("/{user_id}", response_model=UserOut)
def buscar_usuario(user_id: int):
    """Busca um usuario pelo id (path parameter)."""
    try:
        return servico.buscar(user_id)
    except servico.UsuarioNaoEncontrado as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(dados: UserCreate):
    """Cria um novo usuario."""
    try:
        return servico.criar(dados)
    except servico.EmailJaCadastrado as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.put("/{user_id}", response_model=UserOut)
def substituir_usuario(user_id: int, dados: UserReplace):
    """Substitui todos os campos de um usuario."""
    try:
        return servico.substituir(user_id, dados)
    except servico.UsuarioNaoEncontrado as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.EmailJaCadastrado as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.patch("/{user_id}", response_model=UserOut)
def atualizar_usuario(user_id: int, dados: UserPatch):
    """Atualiza apenas os campos enviados."""
    try:
        return servico.atualizar_parcial(user_id, dados)
    except servico.UsuarioNaoEncontrado as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
    except servico.EmailJaCadastrado as erro:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(erro))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_usuario(user_id: int):
    """Remove um usuario."""
    try:
        servico.remover(user_id)
    except servico.UsuarioNaoEncontrado as erro:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(erro))
