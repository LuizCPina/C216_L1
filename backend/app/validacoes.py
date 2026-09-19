"""Funcoes de apoio da API: validacao de dados e montagem da conexao."""


def normalizar_email(email):
    """Remove espacos em branco e padroniza o email em minusculas."""
    if email is None:
        raise ValueError("email nao informado")
    limpo = email.strip().lower()
    if "@" not in limpo:
        raise ValueError(f"email invalido: {email}")
    return limpo


def validar_preco(valor):
    """Garante que o preco nao seja negativo e arredonda para duas casas."""
    if valor < 0:
        raise ValueError("preco nao pode ser negativo")
    return round(float(valor), 2)


def tem_estoque(disponivel, quantidade):
    """Indica se o estoque disponivel atende a quantidade pedida."""
    return disponivel >= quantidade


def montar_url_banco(usuario, senha, host, porta, banco):
    """Monta a URL de conexao do PostgreSQL no formato usado pelo compose."""
    return f"postgresql+psycopg://{usuario}:{senha}@{host}:{porta}/{banco}"
