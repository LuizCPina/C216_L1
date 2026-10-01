# C216_L1

Repositório da disciplina de Sistemas Distribuídos.

O backend é uma aplicação Python com FastAPI, gerenciada pelo Poetry. O banco de
dados é um PostgreSQL 16, e os dois serviços sobem juntos pelo Docker Compose.

## Estrutura

```
backend/
  app/          codigo da aplicacao
  tests/        testes automatizados
  pyproject.toml
compose.yaml    servicos api e db
Makefile        atalhos de desenvolvimento
```

## Testes

Os testes ficam em `backend/tests/` e usam **pytest**, declarado como dependência
de desenvolvimento no grupo `dev` do `pyproject.toml`.

| Arquivo | Conteúdo |
| --- | --- |
| `tests/test_main.py` | Testes das funções de exemplo da aula |
| `tests/test_validacoes.py` | Testes das funções de apoio da API (`app/validacoes.py`) |

### Pré-requisitos

- Python 3.12 ou superior
- [Poetry](https://python-poetry.org/) — instale com `pipx install poetry`

### Instalando as dependências

A partir da raiz do repositório:

```bash
make install
```

Ou, sem o Makefile, entrando na pasta do backend:

```bash
cd backend
poetry install --no-root
```

> O `--no-root` instala apenas as dependências. Sem ele o Poetry tenta instalar o
> próprio projeto como pacote e falha, porque este repositório é uma aplicação e
> não uma biblioteca publicável.

### Executando os testes

```bash
make test
```

Para ver o nome de cada teste individualmente:

```bash
make test-verbose
```

Sem o Makefile:

```bash
cd backend
poetry run pytest          # execucao normal
poetry run pytest -v       # modo verboso
```

Saída esperada:

```
============================= test session starts =============================
collected 21 items
...
============================= 21 passed in 0.07s ==============================
```

### Rodando um teste específico

```bash
cd backend
poetry run pytest tests/test_validacoes.py                                  # um arquivo
poetry run pytest tests/test_validacoes.py::test_montar_url_banco_usa_o_formato_do_compose   # um teste
poetry run pytest -k email                                                  # por palavra-chave
```

## Integração contínua

O workflow `.github/workflows/ci-backend.yml` roda a suíte no GitHub Actions a
cada `push` e a cada `pull_request`. Ele instala o Python 3.12, instala o Poetry
com `pipx`, resolve as dependências com `poetry install --no-root` e executa o
`pytest`. O resultado aparece na aba **Actions** do repositório e no rodapé de
cada Pull Request.

## Outros comandos

Rode `make help` para a lista completa. Os principais:

| Comando | O que faz |
| --- | --- |
| `make install` | Instala as dependências do backend |
| `make test` | Executa os testes |
| `make lint` | Verifica o código com o Ruff |
| `make format` | Formata o código com o Ruff |
| `make run` | Sobe a API com o Uvicorn |
| `make up` / `make down` | Sobe / derruba os contêineres |
| `make logs` / `make ps` | Logs e status dos contêineres |
