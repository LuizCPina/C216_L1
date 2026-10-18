# C216_L1

Repositório da disciplina de Sistemas Distribuídos.

O backend é uma aplicação Python com FastAPI, gerenciada pelo Poetry. O banco de
dados é um PostgreSQL 16, e os dois serviços sobem juntos pelo Docker Compose.

## Estrutura

```
backend/
  app/
    main.py            so a inicializacao da aplicacao
    api/routes/        rotas HTTP (users, health)
    schemas/           modelos Pydantic
    services/          regras de negocio
    validacoes.py      funcoes de apoio
  tests/
    conftest.py        fixtures compartilhadas
    unit/              testes unitarios
    integration/       testes de integracao (TestClient)
  pyproject.toml
compose.yaml           servicos api e db
Makefile               atalhos de desenvolvimento
```

A separação por camadas existe para que cada arquivo tenha uma responsabilidade:
`main.py` apenas cria a aplicação e registra os roteadores, as rotas traduzem
HTTP, os schemas validam a entrada e os services guardam a regra de negócio.

## API

O recurso exposto é `users`, com armazenamento em memória (a persistência em
PostgreSQL entra em uma prática futura).

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/` | Confirma que a API está no ar |
| `GET` | `/users` | Lista usuários — aceita os query parameters `nome` e `limite` |
| `GET` | `/users/{user_id}` | Busca um usuário pelo id (path parameter) |
| `POST` | `/users` | Cria um usuário (201) |
| `PUT` | `/users/{user_id}` | Substitui todos os campos |
| `PATCH` | `/users/{user_id}` | Atualiza apenas os campos enviados |
| `DELETE` | `/users/{user_id}` | Remove um usuário (204) |

Erros: `404` para id inexistente, `409` para email já cadastrado e `422` quando
o corpo não passa na validação do Pydantic.

Com a API no ar (`make run`), a documentação interativa fica em
<http://localhost:8000/docs>.

## Testes

Os testes ficam em `backend/tests/` e usam **pytest**, declarado como dependência
de desenvolvimento no grupo `dev` do `pyproject.toml`. Eles são separados em dois
tipos:

| Pasta | Tipo | O que verifica |
| --- | --- | --- |
| `tests/unit/` | Unitário | Funções isoladas, sem HTTP: validações e a camada de serviço |
| `tests/integration/` | Integração | Os endpoints via `TestClient`, passando por roteamento, Pydantic e serviço |

| Arquivo | Conteúdo |
| --- | --- |
| `tests/unit/test_main.py` | Funções de exemplo da aula |
| `tests/unit/test_validacoes.py` | Funções de apoio (`app/validacoes.py`) |
| `tests/unit/test_user_service.py` | Regras de negócio (`app/services/user.py`) |
| `tests/integration/test_users_api.py` | Todos os endpoints, via `TestClient` |

O `tests/conftest.py` zera o armazenamento em memória antes de cada teste, para
que a ordem de execução não influencie o resultado.

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

Para rodar só um dos tipos:

```bash
make test-unit          # apenas tests/unit
make test-integration   # apenas tests/integration
```

Sem o Makefile:

```bash
cd backend
poetry run pytest                    # tudo
poetry run pytest -v                 # modo verboso
poetry run pytest tests/unit         # so unitarios
poetry run pytest tests/integration  # so integracao
```

Saída esperada:

```
============================= test session starts =============================
collected 61 items

tests\integration\test_users_api.py ........................       [ 39%]
tests\unit\test_main.py ........                                   [ 52%]
tests\unit\test_user_service.py ................                   [ 78%]
tests\unit\test_validacoes.py .............                        [100%]

============================== 61 passed in 0.88s =============================
```

### Rodando um teste específico

```bash
cd backend
poetry run pytest tests/unit/test_validacoes.py        # um arquivo
poetry run pytest tests/unit/test_validacoes.py::test_montar_url_banco_usa_o_formato_do_compose
poetry run pytest -k email                             # por palavra-chave
```

## Integração contínua

O workflow `.github/workflows/ci-backend.yml` roda a suíte no GitHub Actions a
cada `push` e a cada `pull_request`. Ele instala o Python 3.12, instala o Poetry
com `pipx`, resolve as dependências com `poetry install --no-root` e executa
`pytest -v`, que percorre `tests/` inteiro — unitários e de integração — em uma
única etapa. O modo verboso faz as duas pastas aparecerem nomeadas no log. O
resultado aparece na aba **Actions** do repositório e no rodapé de cada Pull
Request.

## Outros comandos

Rode `make help` para a lista completa. Os principais:

| Comando | O que faz |
| --- | --- |
| `make install` | Instala as dependências do backend |
| `make test` | Executa todos os testes |
| `make test-unit` / `make test-integration` | Executa só um dos tipos |
| `make lint` | Verifica o código com o Ruff |
| `make format` | Formata o código com o Ruff |
| `make run` | Sobe a API com o Uvicorn |
| `make up` / `make down` | Sobe / derruba os contêineres |
| `make logs` / `make ps` | Logs e status dos contêineres |
