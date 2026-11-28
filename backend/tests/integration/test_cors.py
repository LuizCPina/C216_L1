"""Testes do CORS.

O navegador manda o cabecalho Origin e, antes de POST, PUT, PATCH e DELETE
com JSON, faz uma pergunta previa (preflight) com o metodo OPTIONS. A API
so responde liberando quando a origem e o metodo estao na lista.
"""

ORIGEM_DO_FRONT = "http://localhost:5173"


def preflight(client, metodo, origem=ORIGEM_DO_FRONT):
    """Faz a pergunta previa que o navegador faria antes da requisicao."""
    return client.options(
        "/sessoes",
        headers={
            "Origin": origem,
            "Access-Control-Request-Method": metodo,
            "Access-Control-Request-Headers": "content-type",
        },
    )


def test_preflight_libera_a_origem_do_frontend(client):
    resposta = preflight(client, "POST")

    assert resposta.status_code == 200
    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONT


def test_preflight_libera_so_os_metodos_usados_pelas_rotas(client):
    cabecalho = preflight(client, "DELETE").headers["access-control-allow-methods"]

    assert set(cabecalho.split(", ")) == {"GET", "POST", "PUT", "PATCH", "DELETE"}


def test_preflight_recusa_origem_desconhecida(client):
    resposta = preflight(client, "POST", origem="http://site-estranho.com")

    assert resposta.status_code == 400
    assert "access-control-allow-origin" not in resposta.headers


def test_resposta_comum_libera_a_origem_do_frontend(client):
    resposta = client.get("/", headers={"Origin": ORIGEM_DO_FRONT})

    assert resposta.headers["access-control-allow-origin"] == ORIGEM_DO_FRONT


def test_resposta_comum_nao_libera_origem_desconhecida(client):
    resposta = client.get("/", headers={"Origin": "http://site-estranho.com"})

    assert "access-control-allow-origin" not in resposta.headers
