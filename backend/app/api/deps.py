"""Dependencias compartilhadas pelas rotas."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

# Cada rota que receber um parametro DbSession ganha uma sessao do banco,
# aberta e fechada pelo get_db.
DbSession = Annotated[Session, Depends(get_db)]
