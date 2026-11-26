"""Conexao com o banco e sessao por requisicao."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine)


def get_db():
    """Abre uma sessao para a requisicao e fecha no final, mesmo com erro."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
