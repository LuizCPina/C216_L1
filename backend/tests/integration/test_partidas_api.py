"""Testes de integracao das rotas de partidas.

Conferem que cada regra do servico chega ao cliente com o status code certo:
404 para o que nao existe, 409 para sessao encerrada e 422 para partida
impossivel no jogo.
"""

VITORIA = {"gols_pro": 3, "gols_contra": 1, "mmr_depois": 1010}


def rota_partidas(sessao):
    return f"/sessoes/{sessao['id']}/partidas"


# Registro


def test_registrar_partida_retorna_201(client, sessao_aberta):
    resposta = client.post(
        rota_partidas(sessao_aberta),
        json=VITORIA | {"companheiro": "Pedro", "notas": "Gol de bicicleta"},
    )

    assert resposta.status_code == 201
    corpo = resposta.json()
    assert corpo["sessao_id"] == sessao_aberta["id"]
    assert corpo["resultado"] == "vitoria"
    assert corpo["overtime"] is False
    assert corpo["companheiro"] == "Pedro"


def test_registrar_empate_retorna_422(client, sessao_aberta):
    resposta = client.post(
        rota_partidas(sessao_aberta), json=VITORIA | {"gols_contra": 3}
    )

    assert resposta.status_code == 422
    assert "não existe empate" in resposta.json()["detail"]


def test_registrar_vitoria_que_baixa_o_mmr_retorna_422(client, sessao_aberta):
    resposta = client.post(
        rota_partidas(sessao_aberta), json=VITORIA | {"mmr_depois": 990}
    )

    assert resposta.status_code == 422
    assert "precisa ser maior que 1000" in resposta.json()["detail"]


def test_registrar_overtime_com_diferenca_maior_que_um_retorna_422(
    client, sessao_aberta
):
    resposta = client.post(
        rota_partidas(sessao_aberta), json=VITORIA | {"overtime": True}
    )

    assert resposta.status_code == 422
    assert "overtime" in resposta.json()["detail"]


def test_registrar_companheiro_em_1v1_retorna_422(client):
    sessao = client.post("/sessoes", json={"playlist": "1v1", "mmr_inicial": 800})

    resposta = client.post(
        rota_partidas(sessao.json()), json=VITORIA | {"companheiro": "Pedro"}
    )

    assert resposta.status_code == 422
    assert "1v1" in resposta.json()["detail"]


def test_registrar_com_gols_negativos_retorna_422(client, sessao_aberta):
    resposta = client.post(
        rota_partidas(sessao_aberta), json=VITORIA | {"gols_pro": -1}
    )

    assert resposta.status_code == 422


def test_registrar_em_sessao_encerrada_retorna_409(client, sessao_aberta):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    resposta = client.post(rota_partidas(sessao_aberta), json=VITORIA)

    assert resposta.status_code == 409
    assert "encerrada" in resposta.json()["detail"]


def test_registrar_em_sessao_inexistente_retorna_404(client):
    resposta = client.post("/sessoes/99/partidas", json=VITORIA)

    assert resposta.status_code == 404


# Consulta


def test_listar_partidas_da_sessao(client, sessao_aberta, partida_registrada):
    derrota = client.post(
        rota_partidas(sessao_aberta),
        json={"gols_pro": 0, "gols_contra": 2, "mmr_depois": 1001},
    ).json()

    resposta = client.get(rota_partidas(sessao_aberta))

    assert resposta.status_code == 200
    assert [p["id"] for p in resposta.json()] == [
        partida_registrada["id"],
        derrota["id"],
    ]
    assert [p["resultado"] for p in resposta.json()] == ["vitoria", "derrota"]


def test_listar_partidas_de_sessao_inexistente_retorna_404(client):
    resposta = client.get("/sessoes/99/partidas")

    assert resposta.status_code == 404


def test_buscar_partida(client, partida_registrada):
    resposta = client.get(f"/partidas/{partida_registrada['id']}")

    assert resposta.status_code == 200
    assert resposta.json() == partida_registrada


def test_buscar_partida_inexistente_retorna_404(client):
    resposta = client.get("/partidas/99")

    assert resposta.status_code == 404
    assert resposta.json()["detail"] == "Partida 99 não encontrada."


# Edicao


def test_editar_partida(client, partida_registrada):
    resposta = client.put(
        f"/partidas/{partida_registrada['id']}",
        json={"gols_pro": 2, "gols_contra": 3, "overtime": True, "mmr_depois": 995},
    )

    assert resposta.status_code == 200
    assert resposta.json()["resultado"] == "derrota"
    assert resposta.json()["overtime"] is True


def test_editar_para_empate_retorna_422(client, partida_registrada):
    resposta = client.put(
        f"/partidas/{partida_registrada['id']}", json=VITORIA | {"gols_pro": 1}
    )

    assert resposta.status_code == 422


def test_editar_para_derrota_que_sobe_o_mmr_retorna_422(client, partida_registrada):
    # E a primeira partida da sessao: a comparacao e com o MMR inicial (1000).
    resposta = client.put(
        f"/partidas/{partida_registrada['id']}",
        json={"gols_pro": 1, "gols_contra": 2, "mmr_depois": 1005},
    )

    assert resposta.status_code == 422
    assert "precisa ser menor que 1000" in resposta.json()["detail"]


def test_editar_partida_de_sessao_encerrada_retorna_409(
    client, sessao_aberta, partida_registrada
):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    resposta = client.put(f"/partidas/{partida_registrada['id']}", json=VITORIA)

    assert resposta.status_code == 409


def test_editar_partida_inexistente_retorna_404(client):
    resposta = client.put("/partidas/99", json=VITORIA)

    assert resposta.status_code == 404


# Remocao


def test_remover_partida(client, partida_registrada):
    resposta = client.delete(f"/partidas/{partida_registrada['id']}")

    assert resposta.status_code == 204
    assert client.get(f"/partidas/{partida_registrada['id']}").status_code == 404


def test_remover_partida_de_sessao_encerrada_retorna_409(
    client, sessao_aberta, partida_registrada
):
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")

    resposta = client.delete(f"/partidas/{partida_registrada['id']}")

    assert resposta.status_code == 409


def test_remover_sessao_apaga_as_partidas(client, sessao_aberta, partida_registrada):
    client.delete(f"/sessoes/{sessao_aberta['id']}")

    assert client.get(f"/partidas/{partida_registrada['id']}").status_code == 404
