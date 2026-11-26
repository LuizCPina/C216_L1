"""Testes unitarios das regras de partida.

Chamam os servicos direto, sem HTTP. Cada regra tem pelo menos um teste do
caminho certo e um do caminho errado.
"""

import pytest

from app.models.partida import Resultado
from app.schemas.partida import PartidaCreate, PartidaReplace
from app.schemas.sessao import SessaoCreate
from app.services import partida as servico
from app.services import sessao as servico_sessao


def abrir_sessao(playlist="2v2"):
    """Inicia uma sessao e devolve ela."""
    return servico_sessao.iniciar(
        None, SessaoCreate(playlist=playlist, mmr_inicial=1000)
    )


def nova_partida(**campos):
    """Corpo de uma vitoria por 3x1, trocando o que vier em campos."""
    padrao = {"gols_pro": 3, "gols_contra": 1, "mmr_depois": 1010}
    return PartidaCreate(**(padrao | campos))


def edicao(**campos):
    """Corpo de PUT com os mesmos padroes de nova_partida."""
    return PartidaReplace(**nova_partida(**campos).model_dump())


# Registro e resultado


def test_registrar_vitoria():
    sessao = abrir_sessao()

    partida = servico.registrar(None, sessao.id, nova_partida())

    assert partida.sessao_id == sessao.id
    assert partida.resultado == Resultado.VITORIA


def test_registrar_derrota():
    sessao = abrir_sessao()

    partida = servico.registrar(
        None, sessao.id, nova_partida(gols_pro=0, gols_contra=2)
    )

    assert partida.resultado == Resultado.DERROTA


def test_registrar_em_sessao_inexistente():
    with pytest.raises(servico_sessao.SessaoNaoEncontrada):
        servico.registrar(None, 99, nova_partida())


# Regra: nao existe empate


def test_recusa_placar_empatado():
    sessao = abrir_sessao()

    with pytest.raises(servico.PartidaInvalida, match="não existe empate"):
        servico.registrar(None, sessao.id, nova_partida(gols_pro=2, gols_contra=2))


# Regra: overtime termina no primeiro gol


def test_aceita_overtime_com_diferenca_de_um_gol():
    sessao = abrir_sessao()

    partida = servico.registrar(
        None, sessao.id, nova_partida(gols_pro=2, gols_contra=3, overtime=True)
    )

    assert partida.overtime is True
    assert partida.resultado == Resultado.DERROTA


def test_recusa_overtime_com_diferenca_maior_que_um():
    sessao = abrir_sessao()

    with pytest.raises(servico.PartidaInvalida, match="overtime"):
        servico.registrar(
            None, sessao.id, nova_partida(gols_pro=4, gols_contra=1, overtime=True)
        )


# Regra: 1v1 nao tem companheiro


def test_recusa_companheiro_em_sessao_1v1():
    sessao = abrir_sessao(playlist="1v1")

    with pytest.raises(servico.PartidaInvalida, match="1v1"):
        servico.registrar(None, sessao.id, nova_partida(companheiro="Pedro"))


def test_aceita_1v1_sem_companheiro():
    sessao = abrir_sessao(playlist="1v1")

    partida = servico.registrar(None, sessao.id, nova_partida())

    assert partida.companheiro is None


def test_aceita_companheiro_em_sessao_2v2():
    sessao = abrir_sessao(playlist="2v2")

    partida = servico.registrar(None, sessao.id, nova_partida(companheiro="Pedro"))

    assert partida.companheiro == "Pedro"


# Regra: sessao encerrada fica congelada


def test_nao_registra_em_sessao_encerrada():
    sessao = abrir_sessao()
    servico_sessao.encerrar(None, sessao.id)

    with pytest.raises(servico.SessaoEncerrada):
        servico.registrar(None, sessao.id, nova_partida())


def test_nao_edita_partida_de_sessao_encerrada():
    sessao = abrir_sessao()
    partida = servico.registrar(None, sessao.id, nova_partida())
    servico_sessao.encerrar(None, sessao.id)

    with pytest.raises(servico.SessaoEncerrada):
        servico.substituir(None, partida.id, edicao(gols_pro=5))


def test_nao_remove_partida_de_sessao_encerrada():
    sessao = abrir_sessao()
    partida = servico.registrar(None, sessao.id, nova_partida())
    servico_sessao.encerrar(None, sessao.id)

    with pytest.raises(servico.SessaoEncerrada):
        servico.remover(None, partida.id)


# Listagem


def test_listar_partidas_em_ordem_e_separadas_por_sessao():
    anterior = abrir_sessao()
    primeira = servico.registrar(None, anterior.id, nova_partida())
    segunda = servico.registrar(
        None, anterior.id, nova_partida(gols_pro=0, gols_contra=1)
    )
    servico_sessao.encerrar(None, anterior.id)
    atual = abrir_sessao()
    servico.registrar(None, atual.id, nova_partida())

    partidas = servico.listar_da_sessao(None, anterior.id)

    assert [p.id for p in partidas] == [primeira.id, segunda.id]


def test_listar_de_sessao_inexistente():
    with pytest.raises(servico_sessao.SessaoNaoEncontrada):
        servico.listar_da_sessao(None, 99)


# Edicao e remocao


def test_substituir_atualiza_placar_e_resultado():
    sessao = abrir_sessao()
    partida = servico.registrar(None, sessao.id, nova_partida())

    editada = servico.substituir(None, partida.id, edicao(gols_pro=1, gols_contra=4))

    assert editada.gols_pro == 1
    assert editada.resultado == Resultado.DERROTA


def test_substituir_aplica_as_mesmas_regras_do_registro():
    sessao = abrir_sessao()
    partida = servico.registrar(None, sessao.id, nova_partida())

    with pytest.raises(servico.PartidaInvalida):
        servico.substituir(None, partida.id, edicao(gols_pro=1, gols_contra=1))


def test_buscar_partida_inexistente():
    with pytest.raises(servico.PartidaNaoEncontrada):
        servico.buscar(None, 99)


def test_remover_partida():
    sessao = abrir_sessao()
    partida = servico.registrar(None, sessao.id, nova_partida())

    servico.remover(None, partida.id)

    with pytest.raises(servico.PartidaNaoEncontrada):
        servico.buscar(None, partida.id)
