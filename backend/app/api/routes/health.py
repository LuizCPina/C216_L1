"""Rota que confirma que a API esta no ar."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
def health_check():
    """Responde ok quando a aplicacao esta funcionando."""
    return {"status": "ok"}
