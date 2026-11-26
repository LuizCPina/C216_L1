"""Regras de negocio das partidas.

Toda partida pertence a uma sessao, entao varias regras dependem dela: a
sessao precisa existir, estar aberta e combinar com os dados da partida.
"""

from sqlalchemy.orm import Session

from app.models.partida import Partida
from app.models.sessao import Playlist, Sessao, StatusSessao
from app.repositories import partida as repositorio
from app.schemas.partida import PartidaBase, PartidaCreate, PartidaReplace
from app.services import sessao as servico_sessao


class PartidaNaoEncontrada(Exception):
    """Levantada quando o id pedido nao existe."""


class SessaoEncerrada(Exception):
    """Levantada ao mexer nas partidas de uma sessao ja encerrada."""


class PartidaInvalida(Exception):
    """Levantada quando os dados da partida sao impossiveis no jogo."""


def listar_da_sessao(db: Session, sessao_id: int) -> list[Partida]:
    """Partidas de uma sessao, na ordem em que foram jogadas."""
    servico_sessao.buscar(db, sessao_id)
    return repositorio.listar_por_sessao(db, sessao_id)


def buscar(db: Session, partida_id: int) -> Partida:
    """Retorna uma partida pelo id."""
    partida = repositorio.buscar_por_id(db, partida_id)
    if partida is None:
        raise PartidaNaoEncontrada(f"Partida {partida_id} não encontrada.")
    return partida


def registrar(db: Session, sessao_id: int, dados: PartidaCreate) -> Partida:
    """Registra uma partida na sessao, que precisa estar aberta."""
    sessao = servico_sessao.buscar(db, sessao_id)
    _garantir_sessao_aberta(sessao)
    _validar_partida(sessao, dados)
    return repositorio.criar(db, sessao_id, dados.model_dump())


def substituir(db: Session, partida_id: int, dados: PartidaReplace) -> Partida:
    """Troca todos os campos da partida, com as mesmas regras do registro."""
    partida = buscar(db, partida_id)
    sessao = servico_sessao.buscar(db, partida.sessao_id)
    _garantir_sessao_aberta(sessao)
    _validar_partida(sessao, dados)
    return repositorio.atualizar(db, partida, dados.model_dump())


def remover(db: Session, partida_id: int) -> None:
    """Apaga a partida, desde que a sessao dela ainda esteja aberta."""
    partida = buscar(db, partida_id)
    sessao = servico_sessao.buscar(db, partida.sessao_id)
    _garantir_sessao_aberta(sessao)
    repositorio.remover(db, partida)


def _garantir_sessao_aberta(sessao: Sessao) -> None:
    """Sessao encerrada fica congelada: suas partidas nao mudam mais."""
    if sessao.status == StatusSessao.ENCERRADA:
        raise SessaoEncerrada(
            f"A sessão {sessao.id} está encerrada. "
            "Não é possível alterar as partidas dela."
        )


def _validar_partida(sessao: Sessao, dados: PartidaBase) -> None:
    """Regras que vem do proprio Rocket League."""
    if dados.gols_pro == dados.gols_contra:
        raise PartidaInvalida(
            "No Rocket League não existe empate: o placar precisa ter um vencedor."
        )
    if dados.overtime and abs(dados.gols_pro - dados.gols_contra) != 1:
        raise PartidaInvalida(
            "O overtime termina no primeiro gol, então a diferença precisa ser de 1."
        )
    if sessao.playlist == Playlist.UM_CONTRA_UM and dados.companheiro:
        raise PartidaInvalida("Em sessões 1v1 não há companheiro de equipe.")
