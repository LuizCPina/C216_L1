"""Rota de verificacao de que a API esta no ar."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def raiz():
    """Confirma que a aplicacao respondeu."""
    return {"message": "API funcionando"}
