"""Regras de negocio do recurso de usuarios.

O servico nao conhece SQLAlchemy: ele pede os dados ao repositorio e cuida
apenas das regras (o usuario existe? o email ja esta em uso?). Trocar o
repositorio por outra forma de armazenamento nao muda nada aqui.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories import user as repositorio
from app.schemas.user import UserCreate, UserPatch, UserReplace


class UsuarioNaoEncontrado(Exception):
    """Levantada quando o id pedido nao existe."""


class EmailJaCadastrado(Exception):
    """Levantada quando outro usuario ja usa o email informado."""


def listar(db: Session, nome: str | None = None, limite: int = 10) -> list[User]:
    """Lista usuarios, opcionalmente filtrando por um trecho do nome."""
    return repositorio.listar(db, nome=nome, limite=limite)


def buscar(db: Session, user_id: int) -> User:
    """Retorna um usuario pelo id."""
    usuario = repositorio.buscar_por_id(db, user_id)
    if usuario is None:
        raise UsuarioNaoEncontrado(f"usuario {user_id} nao encontrado")
    return usuario


def criar(db: Session, dados: UserCreate) -> User:
    """Cria um usuario e devolve o registro gravado."""
    _garantir_email_livre(db, dados.email)
    return repositorio.criar(db, nome=dados.nome, email=dados.email)


def substituir(db: Session, user_id: int, dados: UserReplace) -> User:
    """Troca todos os campos do usuario (PUT)."""
    usuario = buscar(db, user_id)
    _garantir_email_livre(db, dados.email, ignorar=user_id)
    campos = {"nome": dados.nome, "email": dados.email}
    return repositorio.atualizar(db, usuario, campos)


def atualizar_parcial(db: Session, user_id: int, dados: UserPatch) -> User:
    """Atualiza somente os campos enviados na requisicao (PATCH)."""
    usuario = buscar(db, user_id)
    enviados = dados.model_dump(exclude_unset=True)
    alteracoes = {
        campo: valor for campo, valor in enviados.items() if valor is not None
    }
    if not alteracoes:
        return usuario
    if "email" in alteracoes:
        _garantir_email_livre(db, alteracoes["email"], ignorar=user_id)
    return repositorio.atualizar(db, usuario, alteracoes)


def remover(db: Session, user_id: int) -> None:
    """Remove um usuario pelo id."""
    usuario = buscar(db, user_id)
    repositorio.remover(db, usuario)


def _garantir_email_livre(db: Session, email: str, ignorar: int | None = None) -> None:
    """Impede que dois usuarios compartilhem o mesmo email."""
    existente = repositorio.buscar_por_email(db, email)
    if existente is not None and existente.id != ignorar:
        raise EmailJaCadastrado(f"email ja cadastrado: {email}")
