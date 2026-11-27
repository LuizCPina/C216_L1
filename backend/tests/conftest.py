"""Fixtures compartilhadas por todos os testes e a pagina do relatorio HTML.

Os testes nao usam o PostgreSQL: sobem um SQLite em memoria com as mesmas
tabelas declaradas nos modelos ORM. Assim `make test` e o CI funcionam sem
Docker e sem depender de um banco externo, e a suite continua rapida.

No fim do arquivo ficam os hooks do pytest-html, que so mudam a pagina gerada
pelo `make test-report` (relatorios/testes.html).
"""

from html import escape
from pathlib import PurePosixPath

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models import partida, sessao  # noqa: F401 (registra as tabelas)


@pytest.fixture
def engine_de_teste():
    """Banco SQLite em memoria, criado e descartado a cada teste.

    StaticPool mantem a mesma conexao viva durante o teste. Sem ele cada nova
    sessao abriria um banco em memoria diferente, vazio.
    """
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def ligar_chaves_estrangeiras(conexao, _registro):
        # O SQLite ignora chaves estrangeiras por padrao. Ligando, ele recusa
        # partida sem sessao e aplica o ON DELETE CASCADE, como o Postgres.
        conexao.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db(engine_de_teste):
    """Sessao do SQLAlchemy ligada ao banco de teste."""
    fabrica = sessionmaker(bind=engine_de_teste)
    sessao_db = fabrica()
    try:
        yield sessao_db
    finally:
        sessao_db.close()


# Relatorio HTML (pytest-html). optionalhook=True deixa os testes rodarem
# mesmo sem o pytest-html instalado: sem ele, estes hooks so sao ignorados.

CAMADAS = {
    "unit": ("Unitário", "regras de negócio dos serviços, com repositórios falsos"),
    "integration": ("Integração", "rotas da API, repositórios e CORS"),
}


def partes_do_teste(nodeid: str) -> tuple[str, str, str]:
    """Camada, arquivo e nome legivel a partir do id do pytest.

    tests/unit/test_partida_service.py::test_recusa_placar_empatado vira
    ("Unitário", "test_partida_service.py", "recusa placar empatado").
    """
    caminho, _, funcao = nodeid.partition("::")
    pastas = PurePosixPath(caminho).parts
    camada = CAMADAS[pastas[1]][0] if len(pastas) > 2 and pastas[1] in CAMADAS else "-"
    nome = funcao.removeprefix("test_").replace("_", " ") or "o arquivo não carregou"
    return camada, PurePosixPath(caminho).name, nome


@pytest.hookimpl(optionalhook=True)
def pytest_html_report_title(report):
    report.title = "Diário de Ranked — testes do backend"


@pytest.hookimpl(optionalhook=True)
def pytest_html_results_summary(prefix, summary, postfix, session):
    """Painel no topo: o que foi testado, por camada, e o link da cobertura."""
    quantos = {}
    for item in session.items:
        camada = partes_do_teste(item.nodeid)[0]
        quantos[camada] = quantos.get(camada, 0) + 1
    camadas = "".join(
        f"<li><strong>{nome} ({quantos[nome]}):</strong> {descricao}.</li>"
        for nome, descricao in CAMADAS.values()
        if nome in quantos
    )
    prefix.append(
        '<div style="background:#f6f8fa;border:1px solid #d0d7de;color:#1f2328;'
        'border-radius:6px;padding:4px 16px;margin:8px 0 16px">'
        "<p>Testes da API do Diário de Ranked. Eles rodam sem Docker: o banco é "
        "um SQLite em memória, criado do zero a cada teste.</p>"
        f'<ul style="color:#1f2328">{camadas}</ul>'
        '<p><a href="coverage/index.html" style="color:#0969da">'
        "<strong>Abrir a cobertura do código</strong></a>: quanto do código de "
        "<code>app/</code> os testes executam "
        "e, em cada linha, quais testes passaram por ela.</p>"
        "<p>Clique num teste para ver os detalhes e no título de uma coluna "
        "para ordenar.</p></div>"
    )


@pytest.hookimpl(optionalhook=True)
def pytest_html_results_table_header(cells):
    """Colunas: Resultado, Camada, Arquivo, Teste e Tempo (sai a de links).

    A classe "sortable" deixa ordenar clicando no titulo. A ordem precisa
    bater com a das celulas de cada linha, montadas no hook de baixo.
    """
    cells[:] = [
        cells[0].replace(">Result<", ">Resultado<"),
        '<th class="sortable" data-column-type="camada">Camada</th>',
        '<th class="sortable" data-column-type="arquivo">Arquivo</th>',
        '<th class="sortable" data-column-type="testId">Teste</th>',
        cells[2].replace(">Duration<", ">Tempo<"),
    ]


@pytest.hookimpl(optionalhook=True)
def pytest_html_results_table_row(report, cells):
    """Troca o id cru do pytest por camada, arquivo e nome legivel."""
    camada, arquivo, nome = partes_do_teste(report.nodeid)
    # Um teste pulado tambem vem da fase de preparacao, entao o sufixo so
    # entra quando a preparacao ou a finalizacao falharam de verdade.
    if report.failed and report.when == "setup":
        nome += " (erro na preparação)"
    elif report.failed and report.when == "teardown":
        nome += " (erro na finalização)"
    cells[:] = [
        cells[0],
        f'<td class="col-camada">{camada}</td>',
        f'<td class="col-arquivo">{escape(arquivo)}</td>',
        f'<td class="col-testId" title="{escape(report.nodeid)}">{escape(nome)}</td>',
        cells[2],
    ]
