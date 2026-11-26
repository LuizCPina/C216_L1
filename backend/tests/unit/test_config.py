"""Testes unitarios da configuracao."""

from app.core.config import Settings


def test_origens_cors_viram_lista_sem_espacos_nem_vazios():
    config = Settings(cors_origins=" http://a.com , http://b.com,")

    assert config.origens_cors == ["http://a.com", "http://b.com"]


def test_origens_cors_padrao_cobrem_o_vite_local():
    assert "http://localhost:5173" in Settings().origens_cors
