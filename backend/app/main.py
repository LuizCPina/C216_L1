"""Inicializacao da aplicacao FastAPI.

Este arquivo apenas cria a aplicacao e registra os roteadores. As rotas ficam
em app/api/routes, os modelos em app/schemas e as regras em app/services.
"""

from fastapi import FastAPI

from app.api.routes.health import router as health_router
from app.api.routes.users import router as users_router

app = FastAPI(
    title="C216_L1 API",
    description="API da disciplina de Sistemas Distribuidos.",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(users_router)
