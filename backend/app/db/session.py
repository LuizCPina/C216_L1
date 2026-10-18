"""Engine e sessoes do SQLAlchemy."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings

# pool_pre_ping descarta conexoes que o banco derrubou enquanto estavam ociosas,
# situacao comum quando o contêiner do Postgres reinicia.
engine = create_engine(settings.database_url, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db():
    """Dependencia do FastAPI: uma sessao por requisicao, fechada no final."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
