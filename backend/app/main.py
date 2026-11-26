"""Ponto de entrada da API."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.estatisticas import router as estatisticas_router
from app.api.routes.health import router as health_router
from app.api.routes.partidas import router as partidas_router
from app.api.routes.sessoes import router as sessoes_router
from app.core.config import settings

app = FastAPI(
    title="Diário de Ranked API",
    description="Registro de sessões e partidas ranqueadas de Rocket League.",
    version="0.1.0",
)

# O navegador so entrega ao frontend as respostas de uma API em outra origem
# se ela autorizar. Liberamos apenas as origens configuradas e os metodos que
# as rotas realmente usam.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origens_cors,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(health_router)
app.include_router(sessoes_router)
app.include_router(partidas_router)
app.include_router(estatisticas_router)
