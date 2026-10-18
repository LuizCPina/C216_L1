# C216_L1

Repositório da disciplina de Sistemas Distribuídos.

O backend é uma aplicação Python com FastAPI, gerenciada pelo Poetry. O banco de
dados é um PostgreSQL 16, e os dois serviços sobem juntos pelo Docker Compose.

## Estrutura

```
backend/
  app/
    main.py            so a inicializacao da aplicacao
    api/
      deps.py          dependencias compartilhadas (sessao do banco)
      routes/          rotas HTTP (users, health)
    core/config.py     configuracao lida do ambiente
    db/
      base.py          base declarativa do SQLAlchemy
      session.py       engine, sessao e a dependencia get_db
    models/            modelos ORM (tabelas)
    repositories/      acesso aos dados
    schemas/           modelos Pydantic (entrada e saida da API)
    services/          regras de negocio
    validacoes.py      funcoes de apoio
  alembic/             migracoes do banco
  alembic.ini
  tests/
    conftest.py        fixtures compartilhadas
    unit/              testes unitarios
    integration/       testes de integracao
  pyproject.toml
compose.yaml           servicos api e db
Makefile               atalhos de desenvolvimento
```

Cada arquivo tem uma responsabilidade, e o fluxo de uma requisição atravessa as
camadas sempre na mesma ordem:

```
rota  ->  service  ->  repository  ->  banco
(HTTP)    (regras)     (SQLAlchemy)
```

A rota só traduz HTTP, o schema valida a entrada, o service decide as regras e o
repository é o único que conhece SQLAlchemy. Trocar o banco mexe apenas na
última camada.

## API

O recurso exposto é `users`, persistido em PostgreSQL.

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

Com a API no ar, a documentação interativa fica em
<http://localhost:8000/docs>.

## Banco de dados

A persistência é em **PostgreSQL 16**, acessado com **SQLAlchemy**. O schema é
controlado pelo **Alembic** — ninguém cria tabela na mão.

### Conexão

A URL vem da variável de ambiente `DATABASE_URL`, lida em
`app/core/config.py`. O mesmo valor é usado pela aplicação e pelas migrações,
então não existe o risco de uma rodar em um banco e a outra em outro.

```
DATABASE_URL=postgresql+psycopg://app:app@db:5432/app
```

Dentro do Compose o host é `db`, o nome do serviço. Rodando a API na máquina
local com apenas o banco no Docker, troque por `localhost`. Copie o
[.env.example](.env.example) para `.env` para ajustar.

### Subindo tudo

```bash
make up
```

O serviço `api` espera o healthcheck do banco, roda `alembic upgrade head` e só
então inicia o Uvicorn. Como o Alembic é idempotente, subir de novo com o banco
já migrado não faz nada.

Os dados ficam no volume `postgres_data`, então sobrevivem a `make down` e a
reinícios do contêiner. Para apagar de verdade é preciso remover o volume
(`docker compose down -v`).

### Migrações

```bash
make migrate                       # aplica as pendentes
make migration m="o que mudou"     # cria uma nova a partir dos modelos
make migrate-down                  # reverte a última
```

O `make migration` usa autogenerate: o Alembic compara os modelos ORM em
`app/models/` com o estado atual do banco e escreve a diferença. **Sempre
revise o arquivo gerado** antes de commitar — o autogenerate acerta na maioria
dos casos, mas não em todos.

A primeira migração, `cria tabela users`, cria a tabela com o índice único em
`email`.

## Testes

Os testes ficam em `backend/tests/` e usam **pytest**, declarado como dependência
de desenvolvimento no grupo `dev` do `pyproject.toml`. Eles são separados em dois
tipos:

| Pasta | Tipo | O que verifica |
| --- | --- | --- |
| `tests/unit/` | Unitário | Funções isoladas, sem HTTP e sem banco |
| `tests/integration/` | Integração | Endpoints via `TestClient` e o repositório contra um banco real |

| Arquivo | Conteúdo |
| --- | --- |
| `tests/unit/test_main.py` | Funções de exemplo da aula |
| `tests/unit/test_validacoes.py` | Funções de apoio (`app/validacoes.py`) |
| `tests/unit/test_user_service.py` | Regras de negócio, com repositório dublê |
| `tests/integration/test_users_api.py` | Todos os endpoints, via `TestClient` |
| `tests/integration/test_user_repository.py` | Consultas e commits do repositório |

**Os testes não usam PostgreSQL.** O `tests/conftest.py` sobe um SQLite em
memória com o mesmo schema declarado nos modelos ORM, e os testes de integração
substituem a dependência `get_db` por uma sessão desse banco. Assim `make test`
funciona sem Docker ligado e a suíte roda em segundos. A aplicação em si não
muda — ela continua recebendo a sessão por injeção, sem saber qual banco está
do outro lado.

Nos testes unitários do serviço, o repositório real é trocado por um dublê em
memória. O serviço funcionar com esse dublê é, por si só, a prova de que ele
não depende de SQLAlchemy.

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
collected 70 items

tests\integration\test_user_repository.py ........                 [ 11%]
tests\integration\test_users_api.py ........................       [ 45%]
tests\unit\test_main.py ........                                   [ 57%]
tests\unit\test_user_service.py .................                  [ 81%]
tests\unit\test_validacoes.py .............                        [100%]

============================== 70 passed in 2.27s =============================
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
| `make migrate` | Aplica as migrações pendentes |
| `make migration m="..."` | Cria uma migração nova |
| `make migrate-down` | Reverte a última migração |
| `make lint` | Verifica o código com o Ruff |
| `make format` | Formata o código com o Ruff |
| `make run` | Sobe a API com o Uvicorn |
| `make up` / `make down` | Sobe / derruba os contêineres |
| `make logs` / `make ps` | Logs e status dos contêineres |
