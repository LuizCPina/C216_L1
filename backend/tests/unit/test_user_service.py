"""Testes unitarios da camada de servico.

Aqui nao ha HTTP: as funcoes sao chamadas diretamente, sem passar por
roteamento ou serializacao. O que se verifica e a regra de negocio isolada.
"""

import pytest

from app.schemas.user import UserCreate, UserPatch, UserReplace
from app.services import user as servico


@pytest.fixture
def ana():
    """Usuario ja cadastrado, ponto de partida da maioria dos testes."""
    return servico.criar(UserCreate(nome="Ana", email="ana@teste.com"))


def test_criar_atribui_id_sequencial():
    primeiro = servico.criar(UserCreate(nome="Ana", email="ana@teste.com"))
    segundo = servico.criar(UserCreate(nome="Bruno", email="bruno@teste.com"))

    assert primeiro["id"] == 1
    assert segundo["id"] == 2


def test_criar_com_email_repetido_levanta_erro(ana):
    with pytest.raises(servico.EmailJaCadastrado):
        servico.criar(UserCreate(nome="Outra Ana", email=ana["email"]))


def test_buscar_id_inexistente_levanta_erro():
    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.buscar(999)


def test_listar_devolve_lista_vazia_sem_cadastros():
    assert servico.listar() == []


def test_listar_filtra_por_trecho_do_nome(ana):
    servico.criar(UserCreate(nome="Bruno", email="bruno@teste.com"))

    encontrados = servico.listar(nome="an")

    assert encontrados == [ana]


def test_listar_corta_no_limite(ana):
    servico.criar(UserCreate(nome="Bruno", email="bruno@teste.com"))

    assert len(servico.listar(limite=1)) == 1


def test_substituir_troca_todos_os_campos(ana):
    atualizado = servico.substituir(
        ana["id"], UserReplace(nome="Ana Maria", email="anamaria@teste.com")
    )

    assert atualizado["id"] == ana["id"]
    assert atualizado["nome"] == "Ana Maria"
    assert atualizado["email"] == "anamaria@teste.com"


def test_atualizar_parcial_preserva_os_campos_nao_enviados(ana):
    atualizado = servico.atualizar_parcial(ana["id"], UserPatch(nome="Ana Clara"))

    assert atualizado["nome"] == "Ana Clara"
    assert atualizado["email"] == ana["email"]


def test_atualizar_parcial_sem_campos_nao_altera_nada(ana):
    assert servico.atualizar_parcial(ana["id"], UserPatch()) == ana


def test_remover_apaga_o_usuario(ana):
    servico.remover(ana["id"])

    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.buscar(ana["id"])


def test_resetar_limpa_o_armazenamento(ana):
    servico.resetar()

    assert servico.listar() == []


@pytest.mark.parametrize(
    "termo, esperados",
    [
        ("ana", ["Ana"]),
        ("BRU", ["Bruno"]),
        ("o", ["Bruno"]),
        ("zzz", []),
        (None, ["Ana", "Bruno"]),
    ],
)
def test_listar_parametrizado(ana, termo, esperados):
    servico.criar(UserCreate(nome="Bruno", email="bruno@teste.com"))

    nomes = [usuario["nome"] for usuario in servico.listar(nome=termo)]

    assert nomes == esperados
