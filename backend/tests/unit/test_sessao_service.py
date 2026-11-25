"""Testes unitarios das regras de sessao.

Chamam o servico direto, sem HTTP. O armazenamento comeca vazio em cada
teste (fixture em tests/conftest.py).
"""

import pytest

from app.models.sessao import Playlist, StatusSessao
from app.schemas.sessao import SessaoCreate, SessaoPatch
from app.services import sessao as servico


def nova_sessao(playlist="2v2", mmr_inicial=1000, observacoes=None):
    """Monta o corpo de criacao com valores padrao."""
    return SessaoCreate(
        playlist=playlist, mmr_inicial=mmr_inicial, observacoes=observacoes
    )


def test_iniciar_cria_sessao_aberta():
    sessao = servico.iniciar(nova_sessao())

    assert sessao.id == 1
    assert sessao.status == StatusSessao.ABERTA
    assert sessao.encerrada_em is None


def test_nao_permite_duas_sessoes_abertas():
    servico.iniciar(nova_sessao())

    with pytest.raises(servico.SessaoJaAberta):
        servico.iniciar(nova_sessao(playlist="3v3"))


def test_permite_nova_sessao_depois_de_encerrar_a_anterior():
    primeira = servico.iniciar(nova_sessao())
    servico.encerrar(primeira.id)

    segunda = servico.iniciar(nova_sessao())

    assert segunda.status == StatusSessao.ABERTA


def test_permite_nova_sessao_depois_de_remover_a_aberta():
    primeira = servico.iniciar(nova_sessao())
    servico.remover(primeira.id)

    segunda = servico.iniciar(nova_sessao())

    assert segunda.status == StatusSessao.ABERTA


def test_encerrar_marca_status_e_horario():
    sessao = servico.iniciar(nova_sessao())

    encerrada = servico.encerrar(sessao.id)

    assert encerrada.status == StatusSessao.ENCERRADA
    assert encerrada.encerrada_em is not None
    assert encerrada.encerrada_em >= encerrada.iniciada_em


def test_nao_encerra_sessao_ja_encerrada():
    sessao = servico.iniciar(nova_sessao())
    servico.encerrar(sessao.id)

    with pytest.raises(servico.SessaoJaEncerrada):
        servico.encerrar(sessao.id)


def test_buscar_sessao_inexistente():
    with pytest.raises(servico.SessaoNaoEncontrada):
        servico.buscar(99)


def test_encerrar_sessao_inexistente():
    with pytest.raises(servico.SessaoNaoEncontrada):
        servico.encerrar(99)


def test_listar_filtra_por_playlist_e_status():
    antiga = servico.iniciar(nova_sessao(playlist="2v2"))
    servico.encerrar(antiga.id)
    atual = servico.iniciar(nova_sessao(playlist="3v3"))

    assert [s.id for s in servico.listar()] == [atual.id, antiga.id]
    assert [s.id for s in servico.listar(playlist=Playlist("3v3"))] == [atual.id]
    assert [s.id for s in servico.listar(status=StatusSessao.ENCERRADA)] == [antiga.id]


def test_atualizar_muda_so_as_observacoes():
    sessao = servico.iniciar(nova_sessao())

    atualizada = servico.atualizar(
        sessao.id, SessaoPatch(observacoes="Duo com o Pedro")
    )

    assert atualizada.observacoes == "Duo com o Pedro"
    assert atualizada.mmr_inicial == 1000


def test_atualizar_sem_campos_nao_muda_nada():
    sessao = servico.iniciar(nova_sessao(observacoes="Aquecimento"))

    servico.atualizar(sessao.id, SessaoPatch())

    assert sessao.observacoes == "Aquecimento"


def test_atualizar_funciona_em_sessao_encerrada():
    sessao = servico.iniciar(nova_sessao())
    servico.encerrar(sessao.id)

    atualizada = servico.atualizar(sessao.id, SessaoPatch(observacoes="Tiltei"))

    assert atualizada.observacoes == "Tiltei"


def test_remover_apaga_a_sessao():
    sessao = servico.iniciar(nova_sessao())

    servico.remover(sessao.id)

    with pytest.raises(servico.SessaoNaoEncontrada):
        servico.buscar(sessao.id)
