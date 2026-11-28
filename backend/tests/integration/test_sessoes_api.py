"""Testes de integracao das rotas de sessoes.

Passam pela aplicacao inteira via HTTP: rota, schema, servico e repositorio.
Conferem principalmente os status code e o corpo das respostas.
"""


def test_iniciar_sessao_retorna_201(client):
    resposta = client.post(
        "/sessoes",
        json={"playlist": "3v3", "mmr_inicial": 850, "observacoes": "Primeira do dia"},
    )

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["id"] == 1
    assert corpo["playlist"] == "3v3"
    assert corpo["mmr_inicial"] == 850
    assert corpo["status"] == "aberta"
    assert corpo["encerrada_em"] is None
    assert corpo["observacoes"] == "Primeira do dia"


def test_iniciar_com_outra_sessao_aberta_retorna_409(client, sessao_aberta):
    resposta = client.post("/sessoes", json={"playlist": "1v1", "mmr_inicial": 700})

    assert resposta.status_code == 409
    assert "Já existe uma sessão aberta" in resposta.json()["detail"]


def test_iniciar_com_playlist_invalida_retorna_422(client):
    resposta = client.post("/sessoes", json={"playlist": "4v4", "mmr_inicial": 1000})

    assert resposta.status_code == 422


def test_iniciar_com_mmr_negativo_retorna_422(client):
    resposta = client.post("/sessoes", json={"playlist": "2v2", "mmr_inicial": -1})

    assert resposta.status_code == 422


def test_listar_sessoes_mais_recente_primeiro(client, sessao_aberta):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")
    nova = client.post("/sessoes", json={"playlist": "1v1", "mmr_inicial": 600}).json()

    resposta = client.get("/sessoes")

    assert resposta.status_code == 200
    assert [s["id"] for s in resposta.json()] == [nova["id"], sessao_aberta["id"]]


def test_listar_filtra_por_status_e_playlist(client, sessao_aberta):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")
    nova = client.post("/sessoes", json={"playlist": "1v1", "mmr_inicial": 600}).json()

    abertas = client.get("/sessoes", params={"status": "aberta"}).json()
    duplas = client.get("/sessoes", params={"playlist": "2v2"}).json()

    assert [s["id"] for s in abertas] == [nova["id"]]
    assert [s["id"] for s in duplas] == [sessao_aberta["id"]]


def test_listar_com_filtro_invalido_retorna_422(client):
    resposta = client.get("/sessoes", params={"playlist": "4v4"})

    assert resposta.status_code == 422


def test_buscar_sessao(client, sessao_aberta):
    resposta = client.get(f"/sessoes/{sessao_aberta['id']}")

    assert resposta.status_code == 200
    assert resposta.json() == sessao_aberta


def test_buscar_sessao_inexistente_retorna_404(client):
    resposta = client.get("/sessoes/99")

    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Sessão 99 não encontrada."


def test_atualizar_observacoes(client, sessao_aberta):
    resposta = client.patch(
        f"/sessoes/{sessao_aberta['id']}", json={"observacoes": "Jogando de duo"}
    )

    assert resposta.status_code == 200
    assert resposta.json()["observacoes"] == "Jogando de duo"
    assert resposta.json()["mmr_inicial"] == sessao_aberta["mmr_inicial"]


def test_atualizar_sessao_inexistente_retorna_404(client):
    resposta = client.patch("/sessoes/99", json={"observacoes": "x"})

    assert resposta.status_code == 404


def test_encerrar_sessao(client, sessao_aberta):
    resposta = client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    assert resposta.status_code == 200
    assert resposta.json()["status"] == "encerrada"
    assert resposta.json()["encerrada_em"] is not None


def test_encerrar_sessao_ja_encerrada_retorna_409(client, sessao_aberta):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    resposta = client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    assert resposta.status_code == 409


def test_encerrar_sessao_inexistente_retorna_404(client):
    resposta = client.post("/sessoes/99/encerrar")

    assert resposta.status_code == 404


def test_remover_sessao(client, sessao_aberta):
    resposta = client.delete(f"/sessoes/{sessao_aberta['id']}")

    assert resposta.status_code == 204
    assert client.get(f"/sessoes/{sessao_aberta['id']}").status_code == 404


def test_remover_sessao_inexistente_retorna_404(client):
    resposta = client.delete("/sessoes/99")

    assert resposta.status_code == 404
