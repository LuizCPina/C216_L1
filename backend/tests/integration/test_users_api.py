"""Testes de integracao: exercitam os endpoints via TestClient.

Diferente dos testes unitarios, aqui a requisicao passa por toda a aplicacao:
roteamento, validacao do Pydantic, camada de servico e serializacao da
resposta. O que se verifica e o contrato HTTP (status e corpo).
"""

import pytest


def test_raiz_responde_que_a_api_esta_no_ar(client):
    resposta = client.get("/")

    assert resposta.status_code == 200
    assert resposta.json() == {"message": "API funcionando"}


# --------------------------------------------------------------------------
# POST /users
# --------------------------------------------------------------------------


def test_post_cria_usuario_e_devolve_201(client):
    resposta = client.post("/users", json={"nome": "Ana", "email": "Ana@Teste.com"})

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["id"] == 1
    assert corpo["nome"] == "Ana"
    assert corpo["email"] == "ana@teste.com"


def test_post_com_email_invalido_devolve_422(client):
    resposta = client.post("/users", json={"nome": "Ana", "email": "ana.teste.com"})

    assert resposta.status_code == 422


def test_post_com_nome_vazio_devolve_422(client):
    resposta = client.post("/users", json={"nome": "", "email": "ana@teste.com"})

    assert resposta.status_code == 422


def test_post_com_email_repetido_devolve_409(client, usuario_criado):
    resposta = client.post(
        "/users", json={"nome": "Outra Ana", "email": usuario_criado["email"]}
    )

    assert resposta.status_code == 409


# --------------------------------------------------------------------------
# GET /users e GET /users/{id}
# --------------------------------------------------------------------------


def test_get_lista_vazia_quando_nao_ha_usuarios(client):
    resposta = client.get("/users")

    assert resposta.status_code == 200
    assert resposta.json() == []


def test_get_lista_os_usuarios_cadastrados(client, usuario_criado):
    resposta = client.get("/users")

    assert resposta.status_code == 200
    assert resposta.json() == [usuario_criado]


def test_get_filtra_pelo_query_parameter_nome(client):
    client.post("/users", json={"nome": "Ana", "email": "ana@teste.com"})
    client.post("/users", json={"nome": "Bruno", "email": "bruno@teste.com"})

    resposta = client.get("/users", params={"nome": "bru"})

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert len(corpo) == 1
    assert corpo[0]["nome"] == "Bruno"


def test_get_respeita_o_query_parameter_limite(client):
    client.post("/users", json={"nome": "Ana", "email": "ana@teste.com"})
    client.post("/users", json={"nome": "Bruno", "email": "bruno@teste.com"})

    resposta = client.get("/users", params={"limite": 1})

    assert resposta.status_code == 200
    assert len(resposta.json()) == 1


def test_get_com_limite_invalido_devolve_422(client):
    resposta = client.get("/users", params={"limite": 0})

    assert resposta.status_code == 422


def test_get_por_id_devolve_o_usuario(client, usuario_criado):
    resposta = client.get(f"/users/{usuario_criado['id']}")

    assert resposta.status_code == 200
    assert resposta.json() == usuario_criado


def test_get_por_id_inexistente_devolve_404(client):
    resposta = client.get("/users/999")

    assert resposta.status_code == 404
    assert "nao encontrado" in resposta.json()["detail"]


# --------------------------------------------------------------------------
# PUT /users/{id}
# --------------------------------------------------------------------------


def test_put_substitui_todos_os_campos(client, usuario_criado):
    resposta = client.put(
        f"/users/{usuario_criado['id']}",
        json={"nome": "Ana Maria", "email": "anamaria@teste.com"},
    )

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["id"] == usuario_criado["id"]
    assert corpo["nome"] == "Ana Maria"
    assert corpo["email"] == "anamaria@teste.com"


def test_put_exige_todos_os_campos(client, usuario_criado):
    resposta = client.put(f"/users/{usuario_criado['id']}", json={"nome": "So o nome"})

    assert resposta.status_code == 422


def test_put_em_id_inexistente_devolve_404(client):
    resposta = client.put("/users/999", json={"nome": "Ana", "email": "ana@teste.com"})

    assert resposta.status_code == 404


# --------------------------------------------------------------------------
# PATCH /users/{id}
# --------------------------------------------------------------------------


def test_patch_altera_apenas_o_campo_enviado(client, usuario_criado):
    resposta = client.patch(
        f"/users/{usuario_criado['id']}", json={"nome": "Ana Clara"}
    )

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["nome"] == "Ana Clara"
    assert corpo["email"] == usuario_criado["email"]


def test_patch_sem_corpo_mantem_o_usuario(client, usuario_criado):
    resposta = client.patch(f"/users/{usuario_criado['id']}", json={})

    assert resposta.status_code == 200
    assert resposta.json() == usuario_criado


def test_patch_em_id_inexistente_devolve_404(client):
    resposta = client.patch("/users/999", json={"nome": "Ana"})

    assert resposta.status_code == 404


# --------------------------------------------------------------------------
# DELETE /users/{id}
# --------------------------------------------------------------------------


def test_delete_remove_o_usuario(client, usuario_criado):
    resposta = client.delete(f"/users/{usuario_criado['id']}")

    assert resposta.status_code == 204
    assert client.get(f"/users/{usuario_criado['id']}").status_code == 404


def test_delete_em_id_inexistente_devolve_404(client):
    resposta = client.delete("/users/999")

    assert resposta.status_code == 404


# --------------------------------------------------------------------------
# Verificacoes parametrizadas de contrato
# --------------------------------------------------------------------------


@pytest.mark.parametrize(
    "metodo, corpo",
    [
        ("get", None),
        ("put", {"nome": "Ana", "email": "ana@teste.com"}),
        ("patch", {"nome": "Ana"}),
        ("delete", None),
    ],
)
def test_todos_os_metodos_de_id_devolvem_404_quando_nao_existe(client, metodo, corpo):
    requisicao = getattr(client, metodo)
    resposta = (
        requisicao("/users/999")
        if corpo is None
        else requisicao("/users/999", json=corpo)
    )

    assert resposta.status_code == 404
