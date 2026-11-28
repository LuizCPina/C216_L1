"""Testes de integracao das rotas de estatisticas."""


def registrar(client, sessao, gols_pro, gols_contra, mmr_depois):
    """Registra uma partida pela API e devolve o corpo."""
    resposta = client.post(
        f"/sessoes/{sessao['id']}/partidas",
        json={
            "gols_pro": gols_pro,
            "gols_contra": gols_contra,
            "mmr_depois": mmr_depois,
        },
    )
    assert resposta.status_code == 201
    return resposta.json()


def test_estatisticas_gerais_sem_nada_registrado(client):
    resposta = client.get("/estatisticas")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["sessoes"] == 0
    assert corpo["partidas"] == 0
    assert corpo["taxa_vitoria"] == 0.0
    assert corpo["sequencia"] is None
    assert corpo["playlist"] is None


def test_estatisticas_da_sessao(client, sessao_aberta):
    registrar(client, sessao_aberta, 3, 1, 1010)
    registrar(client, sessao_aberta, 0, 2, 1001)
    registrar(client, sessao_aberta, 2, 1, 1012)

    resposta = client.get(f"/sessoes/{sessao_aberta['id']}/estatisticas")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["partidas"] == 3
    assert corpo["vitorias"] == 2
    assert corpo["taxa_vitoria"] == 66.7
    assert corpo["saldo_gols"] == 1
    assert corpo["sequencia"] == {"resultado": "vitoria", "quantidade": 1}
    assert corpo["mmr_inicial"] == 1000
    assert corpo["mmr_atual"] == 1012
    assert corpo["variacao_mmr"] == 12
    assert [p["variacao"] for p in corpo["evolucao"]] == [10, -9, 11]


def test_estatisticas_acompanham_a_edicao_de_uma_partida(client, sessao_aberta):
    partida = registrar(client, sessao_aberta, 3, 1, 1010)

    client.put(
        f"/partidas/{partida['id']}",
        json={"gols_pro": 1, "gols_contra": 3, "mmr_depois": 991},
    )
    corpo = client.get(f"/sessoes/{sessao_aberta['id']}/estatisticas").json()

    assert corpo["derrotas"] == 1
    assert corpo["variacao_mmr"] == -9


def test_estatisticas_de_sessao_inexistente_retorna_404(client):
    resposta = client.get("/sessoes/99/estatisticas")

    assert resposta.status_code == 404


def test_estatisticas_gerais_filtram_por_playlist(client, sessao_aberta):
    registrar(client, sessao_aberta, 3, 1, 1010)
    client.post(f"/sessoes/{sessao_aberta['id']}/encerrar")
    trio = client.post("/sessoes", json={"playlist": "3v3", "mmr_inicial": 900}).json()
    registrar(client, trio, 0, 1, 891)

    so_trios = client.get("/estatisticas", params={"playlist": "3v3"}).json()
    todas = client.get("/estatisticas").json()

    assert so_trios["playlist"] == "3v3"
    assert so_trios["sessoes"] == 1
    assert so_trios["derrotas"] == 1
    assert todas["sessoes"] == 2
    assert todas["partidas"] == 2


def test_estatisticas_gerais_com_playlist_invalida_retorna_422(client):
    resposta = client.get("/estatisticas", params={"playlist": "4v4"})

    assert resposta.status_code == 422
