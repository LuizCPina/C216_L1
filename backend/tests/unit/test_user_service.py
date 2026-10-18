"""Testes unitarios da camada de servico.

O repositorio real e trocado por um dublê em memoria, entao estes testes nao
tocam banco nenhum: o que se verifica e a regra de negocio isolada. Como o
dublê ignora a sessao, ela e passada como None.

Que o servico funcione com um repositorio falso e, por si so, a prova de que
ele nao depende de SQLAlchemy.
"""

import pytest

from app.schemas.user import UserCreate, UserPatch, UserReplace
from app.services import user as servico


class UsuarioFalso:
    """Registro simples, no lugar do modelo ORM."""

    def __init__(self, id, nome, email):
        self.id = id
        self.nome = nome
        self.email = email


class RepositorioFalso:
    """Mesma interface de app/repositories/user.py, guardando em um dicionario."""

    def __init__(self):
        self.registros = {}
        self.proximo_id = 1

    def listar(self, db, nome=None, limite=10):
        encontrados = list(self.registros.values())
        if nome:
            termo = nome.lower()
            encontrados = [u for u in encontrados if termo in u.nome.lower()]
        return encontrados[:limite]

    def buscar_por_id(self, db, user_id):
        return self.registros.get(user_id)

    def buscar_por_email(self, db, email):
        for usuario in self.registros.values():
            if usuario.email == email:
                return usuario
        return None

    def criar(self, db, nome, email):
        usuario = UsuarioFalso(self.proximo_id, nome, email)
        self.registros[usuario.id] = usuario
        self.proximo_id += 1
        return usuario

    def atualizar(self, db, usuario, campos):
        for campo, valor in campos.items():
            setattr(usuario, campo, valor)
        return usuario

    def remover(self, db, usuario):
        del self.registros[usuario.id]


@pytest.fixture
def repositorio(monkeypatch):
    """Troca o repositorio real pelo dublê dentro do modulo de servico."""
    falso = RepositorioFalso()
    monkeypatch.setattr(servico, "repositorio", falso)
    return falso


@pytest.fixture
def ana(repositorio):
    """Usuario ja cadastrado, ponto de partida da maioria dos testes."""
    return servico.criar(None, UserCreate(nome="Ana", email="ana@teste.com"))


def test_criar_atribui_id_sequencial(repositorio):
    primeiro = servico.criar(None, UserCreate(nome="Ana", email="ana@teste.com"))
    segundo = servico.criar(None, UserCreate(nome="Bruno", email="bruno@teste.com"))

    assert primeiro.id == 1
    assert segundo.id == 2


def test_criar_com_email_repetido_levanta_erro(ana):
    with pytest.raises(servico.EmailJaCadastrado):
        servico.criar(None, UserCreate(nome="Outra Ana", email=ana.email))


def test_buscar_id_inexistente_levanta_erro(repositorio):
    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.buscar(None, 999)


def test_listar_devolve_lista_vazia_sem_cadastros(repositorio):
    assert servico.listar(None) == []


def test_listar_filtra_por_trecho_do_nome(ana):
    servico.criar(None, UserCreate(nome="Bruno", email="bruno@teste.com"))

    assert servico.listar(None, nome="an") == [ana]


def test_listar_corta_no_limite(ana):
    servico.criar(None, UserCreate(nome="Bruno", email="bruno@teste.com"))

    assert len(servico.listar(None, limite=1)) == 1


def test_substituir_troca_todos_os_campos(ana):
    atualizado = servico.substituir(
        None, ana.id, UserReplace(nome="Ana Maria", email="anamaria@teste.com")
    )

    assert atualizado.id == ana.id
    assert atualizado.nome == "Ana Maria"
    assert atualizado.email == "anamaria@teste.com"


def test_substituir_id_inexistente_levanta_erro(repositorio):
    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.substituir(None, 999, UserReplace(nome="Ana", email="ana@teste.com"))


def test_atualizar_parcial_preserva_os_campos_nao_enviados(ana):
    atualizado = servico.atualizar_parcial(None, ana.id, UserPatch(nome="Ana Clara"))

    assert atualizado.nome == "Ana Clara"
    assert atualizado.email == "ana@teste.com"


def test_atualizar_parcial_sem_campos_nao_altera_nada(ana):
    assert servico.atualizar_parcial(None, ana.id, UserPatch()) is ana


def test_remover_apaga_o_usuario(ana):
    servico.remover(None, ana.id)

    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.buscar(None, ana.id)


def test_remover_id_inexistente_levanta_erro(repositorio):
    with pytest.raises(servico.UsuarioNaoEncontrado):
        servico.remover(None, 999)


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
    servico.criar(None, UserCreate(nome="Bruno", email="bruno@teste.com"))

    nomes = [usuario.nome for usuario in servico.listar(None, nome=termo)]

    assert nomes == esperados
