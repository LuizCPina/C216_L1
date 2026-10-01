"""Regras de negocio do recurso de usuarios.

O armazenamento e em memoria: a persistencia em PostgreSQL entra na proxima
pratica. Manter a logica aqui deixa as rotas responsaveis apenas por traduzir
HTTP, e permite testar as regras sem subir a aplicacao.
"""


class UsuarioNaoEncontrado(Exception):
    """Levantada quando o id pedido nao existe."""


class EmailJaCadastrado(Exception):
    """Levantada quando outro usuario ja usa o email informado."""


_usuarios = {}
_proximo_id = 1


def resetar():
    """Limpa o armazenamento. Usado pelas fixtures dos testes."""
    global _proximo_id

    _usuarios.clear()
    _proximo_id = 1


def listar(nome=None, limite=10):
    """Lista usuarios, opcionalmente filtrando por um trecho do nome."""
    encontrados = list(_usuarios.values())
    if nome:
        termo = nome.lower()
        encontrados = [u for u in encontrados if termo in u["nome"].lower()]
    return encontrados[:limite]


def buscar(user_id):
    """Retorna um usuario pelo id."""
    if user_id not in _usuarios:
        raise UsuarioNaoEncontrado(f"usuario {user_id} nao encontrado")
    return _usuarios[user_id]


def criar(dados):
    """Cria um usuario e devolve o registro criado."""
    global _proximo_id

    _garantir_email_livre(dados.email)
    usuario = {"id": _proximo_id, "nome": dados.nome, "email": dados.email}
    _usuarios[_proximo_id] = usuario
    _proximo_id += 1
    return usuario


def substituir(user_id, dados):
    """Troca todos os campos do usuario (PUT)."""
    buscar(user_id)
    _garantir_email_livre(dados.email, ignorar=user_id)
    usuario = {"id": user_id, "nome": dados.nome, "email": dados.email}
    _usuarios[user_id] = usuario
    return usuario


def atualizar_parcial(user_id, dados):
    """Atualiza somente os campos enviados na requisicao (PATCH)."""
    usuario = buscar(user_id)
    enviados = dados.model_dump(exclude_unset=True)
    alteracoes = {
        campo: valor for campo, valor in enviados.items() if valor is not None
    }
    if "email" in alteracoes:
        _garantir_email_livre(alteracoes["email"], ignorar=user_id)
    usuario.update(alteracoes)
    return usuario


def remover(user_id):
    """Remove um usuario pelo id."""
    buscar(user_id)
    del _usuarios[user_id]


def _garantir_email_livre(email, ignorar=None):
    """Impede que dois usuarios compartilhem o mesmo email."""
    for usuario in _usuarios.values():
        if usuario["email"] == email and usuario["id"] != ignorar:
            raise EmailJaCadastrado(f"email ja cadastrado: {email}")
