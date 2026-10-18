"""Dependencias compartilhadas pelas rotas."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

# Forma recomendada pelo FastAPI para declarar dependencias: o Depends fica
# dentro do Annotated, e nao no valor padrao do parametro. Alem de ser a
# escrita atual, evita o aviso B008 do linter.
DbSession = Annotated[Session, Depends(get_db)]
