# Diário de Ranked

Aplicação web para registrar sessões de partidas ranqueadas de **Rocket League** e acompanhar a evolução: vitórias, derrotas, sequência atual e quanto MMR foi ganho ou perdido, por sessão e por playlist.

Projeto Final da disciplina **C216 — Sistemas Distribuídos**: frontend React, API FastAPI e PostgreSQL, cada um no seu contêiner, orquestrados pelo Docker Compose.

## Vídeo demonstrativo

**Link:** _(a adicionar)_

## Objetivo e tema

Quem joga ranqueada todo dia raramente tem um registro simples de como foi cada sessão: quantas partidas ganhou, quanto MMR subiu ou caiu, se está em uma sequência boa ou ruim. O Diário de Ranked resolve isso: o jogador abre uma sessão antes de jogar, registra cada partida logo depois de terminar e o sistema calcula os números.

- **Sessão:** um período jogando uma playlist (`1v1`, `2v2` ou `3v3`), com o MMR do início.
- **Partida:** pertence a uma sessão. Guarda o placar, se foi para o overtime, o MMR depois da partida e, opcionalmente, o companheiro de equipe e anotações.

## Funcionalidades

### Interface

- **Sessão atual**
  - Iniciar uma sessão escolhendo a playlist, o MMR inicial e observações opcionais.
  - Ver a sessão aberta com o MMR inicial e o **MMR atual**, e encerrá-la.
- **Partidas (CRUD completo pela tela)**
  - Registrar uma partida: placar, overtime, MMR depois da partida, companheiro (o campo não aparece em `1v1`) e notas.
  - Listar as partidas da sessão na ordem em que foram jogadas, com resultado, placar e **quanto o MMR mudou em cada uma**.
  - Editar uma partida na própria linha da lista e excluir com confirmação.
- **Estatísticas da sessão**: partidas, taxa de vitória, sequência atual, variação de MMR e saldo de gols.
- **Histórico**
  - Resumo geral de todas as sessões, com os mesmos números.
  - Sessões encerradas, cada uma com vitórias, derrotas e a variação de MMR.
  - Filtro por playlist.
- Toda chamada à API mostra o estado de **carregando**, **sucesso** ou **erro**. Os formulários validam os dados antes de enviar, com as mesmas regras da API.

### Regras de negócio

As regras ficam na camada de serviços da API. A interface repete as de validação só para avisar antes de enviar; quem decide é a API.

| Regra | Resposta |
| --- | --- |
| Não existe empate no Rocket League: placar igual é recusado | 422 |
| O overtime termina no primeiro gol: com overtime, a diferença precisa ser de exatamente 1 gol | 422 |
| Sessão `1v1` não tem companheiro de equipe | 422 |
| Números inteiros a partir de 0, playlist `1v1`/`2v2`/`3v3`, limite de tamanho nos textos | 422 |
| Só pode existir uma sessão aberta por vez | 409 |
| Partidas só podem ser registradas, editadas ou excluídas em sessão aberta | 409 |
| Uma sessão encerrada não pode ser encerrada de novo | 409 |
| Sessão ou partida inexistente | 404 |

- O **resultado** (vitória ou derrota) e as **estatísticas** são calculados toda vez que são pedidos, nunca gravados. Por isso editar ou excluir uma partida nunca deixa os números desatualizados.
- A **variação de MMR** de uma partida é o MMR depois dela menos o MMR da partida anterior (ou o MMR inicial da sessão, se for a primeira).
- Apagar uma sessão apaga as partidas dela junto (`ON DELETE CASCADE` no banco).

### API

| Método | Rota | O que faz |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `GET` | `/sessoes` | Lista as sessões, da mais nova para a mais antiga (filtros: `playlist`, `status`) |
| `POST` | `/sessoes` | Inicia uma sessão |
| `GET` | `/sessoes/{id}` | Busca uma sessão |
| `PATCH` | `/sessoes/{id}` | Altera as observações da sessão |
| `POST` | `/sessoes/{id}/encerrar` | Encerra a sessão |
| `DELETE` | `/sessoes/{id}` | Apaga a sessão e as partidas dela |
| `GET` | `/sessoes/{id}/partidas` | Partidas da sessão, na ordem em que foram jogadas |
| `POST` | `/sessoes/{id}/partidas` | Registra uma partida na sessão |
| `GET` | `/partidas/{id}` | Busca uma partida |
| `PUT` | `/partidas/{id}` | Substitui os dados de uma partida |
| `DELETE` | `/partidas/{id}` | Apaga uma partida |
| `GET` | `/sessoes/{id}/estatisticas` | Números da sessão e a evolução do MMR partida a partida |
| `GET` | `/estatisticas` | Resumo de todas as sessões (filtro: `playlist`) |

`PATCH /sessoes/{id}` e `DELETE /sessoes/{id}` existem na API, mas a interface não usa essas duas rotas. A documentação interativa (Swagger) fica em http://localhost:8000/docs.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Backend | Python 3.12, FastAPI, Pydantic, Uvicorn, Poetry |
| Banco de dados | PostgreSQL 16, SQLAlchemy 2, Alembic, psycopg 3 |
| Frontend | React 19 (JavaScript), Vite, Tailwind CSS 4 |
| Testes | Pytest, Vitest e Testing Library, Playwright |
| Qualidade | Ruff (backend), Biome (frontend) |
| Infraestrutura | Docker, Docker Compose, nginx (serve o frontend), Make, GitHub Actions |

## Estrutura

```
Navegador ──► web (nginx, porta 5173)       entrega a página (build do React)
    │
    └───────► api (FastAPI, porta 8000) ──► db (PostgreSQL 16, volume postgres_data)
```

O navegador baixa a página do serviço `web` e chama a API diretamente. Por isso a API libera, via CORS, só as origens do frontend (`CORS_ORIGINS`).

```
.
├── backend/
│   ├── app/
│   │   ├── api/routes/      rotas HTTP: recebem a requisição e devolvem a resposta
│   │   ├── services/        regras de negócio e cálculo das estatísticas
│   │   ├── repositories/    acesso ao banco (o único lugar com consultas)
│   │   ├── models/          tabelas (SQLAlchemy)
│   │   ├── schemas/         formato de entrada e saída da API (Pydantic)
│   │   ├── core/, db/       configuração e conexão com o banco
│   │   └── main.py
│   ├── alembic/             migrações do banco
│   ├── tests/               unit/ e integration/ (Pytest)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           Sessão atual e Histórico: guardam o estado e chamam a API
│   │   ├── components/      formulários, listas e cards (só recebem dados e devolvem eventos)
│   │   ├── api.js           cliente HTTP da API
│   │   └── validacao.js, formatacao.js
│   ├── tests/               unit/ e integration/ (Vitest), e2e/ (Playwright)
│   └── Dockerfile
├── .github/workflows/       CI Backend, CI Frontend e CI E2E
├── compose.yaml
├── Makefile
└── .env.example
```

## Pré-requisitos

Para rodar a aplicação:

- [Docker](https://docs.docker.com/get-docker/) com o Docker Compose v2 (no Windows e no macOS, o Docker Desktop já traz os dois)
- GNU Make
- Git

Para desenvolver ou rodar os testes fora dos contêineres:

- Python 3.12 e [Poetry](https://python-poetry.org/) 2
- Node.js 26 e npm (a mesma versão do Dockerfile e do CI)

## Variáveis de ambiente

O arquivo `.env` é opcional: sem ele, o Compose usa os mesmos valores do [`.env.example`](.env.example). Para mudar algo, copie e edite:

```bash
cp .env.example .env
```

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | `app` | Banco, usuário e senha do contêiner do PostgreSQL. O Compose monta com eles a conexão da API |
| `POSTGRES_PORT` | `5432` | Porta do PostgreSQL na sua máquina |
| `VITE_API_URL` | `http://localhost:8000` | Endereço da API usado pelo navegador. Entra no build do serviço `web` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Origens do frontend que podem chamar a API, separadas por vírgula |
| `DATABASE_URL` | `postgresql+psycopg://app:app@localhost:5432/app` | Conexão da API e do Alembic quando rodam **fora** do Docker. No Compose ela é montada automaticamente |

Os valores são de desenvolvimento local; nenhum deles é segredo real. Rodando o frontend com o Vite, o `VITE_API_URL` pode ser trocado em `frontend/.env` (há um [`frontend/.env.example`](frontend/.env.example)).

## Como executar

```bash
git clone https://github.com/LuizCPina/C216_L1.git
cd C216_L1
git checkout projeto-final
make up
```

O `make up` constrói as imagens e sobe os três serviços (`web`, `api` e `db`). Ele só termina quando todos estão prontos: o banco e a API passam pelo healthcheck. Antes de iniciar, a API aplica as migrações sozinha. Depois disso, a aplicação está em **http://localhost:5173**.

| Comando | O que faz |
| --- | --- |
| `make up` | Constrói e sobe web, api e db, esperando ficarem prontos |
| `make ps` | Lista os contêineres |
| `make logs` | Acompanha os logs |
| `make down` | Para e remove os contêineres. Os dados continuam no volume `postgres_data` |

Sem o Make, o equivalente é `docker compose up -d --build --wait` e `docker compose down`. Para apagar também os dados, use `docker compose down -v`.

## Migrações

As migrações ficam em `backend/alembic/versions` e são aplicadas automaticamente quando a API sobe no Compose (`alembic upgrade head`). Se o banco já estiver na última versão, nada muda.

Para rodar à mão, com o banco do Compose no ar e a API fora do Docker:

| Comando | O que faz |
| --- | --- |
| `make migrate` | Aplica as migrações pendentes |
| `make migration m="descricao"` | Gera uma migração nova a partir dos modelos (revise o arquivo antes de commitar) |
| `make migrate-down` | Desfaz a última migração. **Apaga as tabelas dela e os dados junto** |

## Desenvolvimento sem os contêineres da aplicação

Dá para rodar a API e o frontend direto na máquina, deixando só o banco no Docker. As portas são as mesmas dos contêineres: se a stack completa estiver no ar, pare antes o `web` e a `api` com `docker compose stop web api`.

```bash
docker compose up -d db     # só o PostgreSQL

make install                # dependências do backend (Poetry)
make migrate
make run                    # API em http://localhost:8000, recarregando ao salvar

make front-install          # dependências do frontend (npm)
make front-dev              # Vite em http://localhost:5173
```

`make help` lista todos os comandos.

## Testes

| Comando | O que roda |
| --- | --- |
| `make test` | Pytest do backend: serviços com repositórios falsos (`tests/unit`) e rotas, repositórios e CORS com SQLite em memória (`tests/integration`) |
| `make lint` | Ruff no backend (`make format` formata) |
| `make front-test` | Vitest do frontend: validação, formatação, cliente HTTP e componentes (`tests/unit`), e as páginas com a API simulada (`tests/integration`) |
| `make front-check` | Biome no frontend: lint, formatação e ordem dos imports (`make front-format` formata) |
| `make e2e` | Playwright no Chromium contra a aplicação inteira do `make up` |

Os testes E2E usam frontend, API e PostgreSQL de verdade. Eles iniciam uma sessão, registram uma partida e conferem que ela continua lá depois de recarregar a página. Também testam o placar empatado, a edição e a exclusão de partidas e o histórico. Para rodar:

```bash
make up
make front-install          # se ainda não instalou
make e2e-install            # uma vez: baixa o Chromium do Playwright
make e2e
```

Os testes E2E rodam no mesmo banco da aplicação, mas apagam só as sessões que eles mesmos criam. Como a API só permite uma sessão aberta por vez, eles não rodam se houver uma sessão aberta: encerre-a antes.

### Integração contínua

Três workflows do GitHub Actions rodam a cada push e pull request:

| Workflow | Passos |
| --- | --- |
| CI Backend | Ruff (lint e formatação), depois Pytest |
| CI Frontend | Biome, depois Vitest |
| CI E2E | `docker compose up --build --wait`, depois Playwright. O relatório fica como artefato |

## Acesso

Com o `make up` rodando:

| O quê | Endereço |
| --- | --- |
| Aplicação | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação da API (Swagger) | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432`, usuário `app`, senha `app`, banco `app` |
