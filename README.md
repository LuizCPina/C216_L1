# C216_L1

Repositório da disciplina de Sistemas Distribuídos.

O backend é uma aplicação Python com FastAPI, gerenciada pelo Poetry. O banco de
dados é um PostgreSQL 16, e os dois serviços sobem juntos pelo Docker Compose.

O frontend é uma aplicação React com Vite e Tailwind CSS, gerenciada pelo npm.
Ele ainda **não consome a API** — os dados vivem só na memória do navegador. A
integração entre as duas pontas entra na próxima prática.

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
frontend/
  src/
    main.jsx           ponto de entrada do React
    App.jsx            raiz da aplicacao
    index.css          so a linha que importa o Tailwind
    components/        componentes reutilizaveis
    pages/             paginas (componentes de tela)
    validation.js      regras de validacao (funcoes puras, sem JSX)
  tests/
    setup.js           setup do Vitest
    unit/              testes unitarios
    integration/       testes de integracao
    e2e/               testes end-to-end (Playwright)
  biome.json           linter e formatador
  vite.config.js       build, dev server e config do Vitest
  playwright.config.js config dos testes e2e
  package.json
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

## API (backend)

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

## Testes do backend

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

## Frontend

Aplicação **React 19** servida pelo **Vite**, estilizada com **Tailwind CSS v4**
e gerenciada pelo **npm**. JavaScript puro, sem TypeScript.

A tela é um gerenciador de usuários: cadastrar, listar, buscar por nome e
remover. Os dados ficam no estado do React — **não há API nem persistência**
nesta prática, então recarregar a página zera a lista. A integração com o
backend entra na Prática 7.

### Organização

As regras de validação ficam em `src/validation.js`, separadas dos componentes.
São funções puras, sem JSX e sem React, o que permite testá-las isoladamente —
e espelham as regras de `backend/app/validacoes.py`, para o usuário receber o
mesmo "não" dos dois lados.

A convenção de extensão segue a da aula: **arquivo que retorna componente é
`.jsx`; arquivo de lógica pura é `.js`**.

### Ferramentas

| Ferramenta | Papel | Equivalente no backend |
| --- | --- | --- |
| npm | Gerenciador de dependências | Poetry |
| Biome | Linter e formatador (escrito em Rust) | Ruff |
| Vitest | Testes unitários e de integração | pytest |
| Testing Library | Renderiza componentes como o usuário vê | — |
| Playwright | Testes end-to-end em navegador real | — |

Não usamos ESLint nem Prettier: o Biome cobre os dois papéis em uma ferramenta
só, do mesmo jeito que o Ruff faz no backend.

Não há `tailwind.config.js` nem `postcss.config.js`. Na v4 o Tailwind entra
como plugin do Vite, e o `src/index.css` tem uma linha só: `@import "tailwindcss";`.

### Rodando

```bash
make front-install
make front-dev        # http://localhost:5173
```

### Testes do frontend

| Pasta | Tipo | O que verifica |
| --- | --- | --- |
| `tests/unit/` | Unitário | Funções puras e componentes isolados |
| `tests/integration/` | Integração | Vários componentes juntos, pelo fluxo do usuário |
| `tests/e2e/` | End-to-end | A aplicação real, em um Chromium de verdade |

```bash
make front-test              # unitários + integração (Vitest)
make front-test-unit
make front-test-integration
make front-test-e2e          # Playwright
```

Os arquivos do Vitest terminam em `.test.js` / `.test.jsx`; os do Playwright,
em `.spec.js`. O `include` no `vite.config.js` existe para o Vitest não tentar
executar os `.spec.js`, que usam outro runner.

Antes do primeiro `make front-test-e2e`, baixe o navegador:

```bash
cd frontend && npx playwright install chromium
```

O Playwright sobe o Vite sozinho antes dos testes e derruba no final — não é
preciso deixar o servidor rodando.

### Qualidade

```bash
make front-lint     # só o linter
make front-format   # formata os arquivos
make front-format-check  # só verifica, sem alterar nada
make front-check    # linter + formatação + ordem dos imports
```

## Integração contínua

São dois workflows, ambos disparados a cada `push` e a cada `pull_request`. O
resultado aparece na aba **Actions** e no rodapé de cada Pull Request.

**`.github/workflows/ci-backend.yml`** — um job. Instala o Python 3.12 e o
Poetry com `pipx`, resolve as dependências com `poetry install --no-root` e
executa `pytest -v`, que percorre `tests/` inteiro em uma única etapa.

**`.github/workflows/ci-frontend.yml`** — dois jobs encadeados:

```
lint  ──(needs)──>  test
```

O job `lint` roda `biome check`. O job `test` só começa se o lint passar, e aí
executa o Vitest, baixa o Chromium e roda o Playwright. A ordem é proposital:
não faz sentido gastar minutos baixando um navegador se o código nem está
formatado. O relatório HTML do Playwright é publicado como artefato da
execução.

## Outros comandos

Rode `make help` para a lista completa. Os principais:

**Backend:**

| Comando | O que faz |
| --- | --- |
| `make install` | Instala as dependências do backend |
| `make test` | Executa todos os testes do backend |
| `make test-unit` / `make test-integration` | Executa só um dos tipos |
| `make migrate` | Aplica as migrações pendentes |
| `make migration m="..."` | Cria uma migração nova |
| `make migrate-down` | Reverte a última migração |
| `make lint` | Verifica o código com o Ruff |
| `make format` | Formata o código com o Ruff |
| `make run` | Sobe a API com o Uvicorn |
| `make up` / `make down` | Sobe / derruba os contêineres |
| `make logs` / `make ps` | Logs e status dos contêineres |

**Frontend:**

| Comando | O que faz |
| --- | --- |
| `make front-install` | Instala as dependências do frontend |
| `make front-dev` | Sobe o servidor de desenvolvimento do Vite |
| `make front-build` / `make front-preview` | Build de produção e preview |
| `make front-test` | Executa a suíte do Vitest |
| `make front-test-watch` | Executa o Vitest em modo watch |
| `make front-test-unit` / `make front-test-integration` | Executa só um dos tipos |
| `make front-test-e2e` | Executa os testes end-to-end |
| `make front-lint` / `make front-format` | Linter e formatador (Biome) |
| `make front-format-check` | Verifica a formatação sem alterar arquivos |
| `make front-check` | Linter + formatação + ordem dos imports |

**Os dois lados:**

| Comando | O que faz |
| --- | --- |
| `make install-all` | Instala as dependências das duas pontas |
| `make test-all` | Roda as duas suítes de teste |
| `make lint-all` | Roda os dois linters |
