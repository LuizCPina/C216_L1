"""Ponto de entrada da API."""

from fastapi import FastAPI

from app.api.routes.health import router as health_router

app = FastAPI(
    title="Diário de Ranked API",
    description="Registro de sessões e partidas ranqueadas de Rocket League.",
    version="0.1.0",
)

app.include_router(health_router)
