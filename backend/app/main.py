"""Ponto de entrada da API."""

from fastapi import FastAPI

from app.api.routes.estatisticas import router as estatisticas_router
from app.api.routes.health import router as health_router
from app.api.routes.partidas import router as partidas_router
from app.api.routes.sessoes import router as sessoes_router

app = FastAPI(
    title="Diário de Ranked API",
    description="Registro de sessões e partidas ranqueadas de Rocket League.",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(sessoes_router)
app.include_router(partidas_router)
app.include_router(estatisticas_router)
