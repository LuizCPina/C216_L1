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
  - Ver a sessão aberta com o MMR inicial → **MMR atual** em destaque (com a variação em verde ou vermelho) e encerrá-la.
- **Partidas (CRUD completo pela tela)**
  - Registrar uma partida: placar, overtime, MMR depois da partida, companheiro (o campo não aparece em `1v1`) e notas.
  - Listar as partidas da sessão na ordem em que foram jogadas, com resultado, placar (o seu time em azul e o adversário em laranja, como no jogo) e **quanto o MMR mudou em cada uma**.
  - Editar uma partida na própria linha da lista e excluir com confirmação.
- **Estatísticas da sessão**: partidas, taxa de vitória, sequência atual, variação de MMR e saldo de gols.
- **Gráfico da evolução do MMR** na sessão atual, partida a partida, com os pontos em verde (subiu) ou vermelho (caiu). É desenhado em SVG, sem biblioteca de gráficos; passar o mouse num ponto mostra o MMR daquela partida.
- **Histórico**
  - Resumo geral de todas as sessões, com os mesmos números.
  - Sessões encerradas, cada uma com vitórias, derrotas, a variação de MMR (com uma faixa verde ou vermelha na lateral) e uma barra da taxa de vitória.
  - Filtro por playlist.
- Toda chamada à API mostra o estado de **carregando**, **sucesso** ou **erro**. Os formulários validam os dados antes de enviar, com as mesmas regras da API.
- O cabeçalho tem um link para a **documentação da API** (Swagger), que abre em outra aba.
- **Layout responsivo.** Na tela grande:
  - a sessão atual fica em duas colunas: a sessão e o formulário de registrar à esquerda (o formulário fica parado na tela enquanto a página rola), e os números, o gráfico e as partidas à direita;
  - o formulário de nova sessão fica numa linha só;
  - o histórico mostra as sessões em grade.

  No celular, tudo fica em uma coluna.

### Regras de negócio

As regras ficam na camada de serviços da API. A interface repete as de validação só para avisar antes de enviar; quem decide é a API.

| Regra | Resposta |
| --- | --- |
| Não existe empate no Rocket League: placar igual é recusado | 422 |
| O overtime termina no primeiro gol: com overtime, a diferença precisa ser de exatamente 1 gol | 422 |
| Sessão `1v1` não tem companheiro de equipe | 422 |
| Na ranqueada, vitória sempre sobe o MMR e derrota sempre baixa: o MMR depois da partida precisa ser maior (vitória) ou menor (derrota) que o MMR antes dela | 422 |
| Números inteiros a partir de 0, playlist `1v1`/`2v2`/`3v3`, limite de tamanho nos textos | 422 |
| Só pode existir uma sessão aberta por vez | 409 |
| Partidas só podem ser registradas, editadas ou excluídas em sessão aberta | 409 |
| Uma sessão encerrada não pode ser encerrada de novo | 409 |
| Sessão ou partida inexistente | 404 |
| Vitória precisa subir o MMR e derrota precisa baixar | 422 |

- O **resultado** (vitória ou derrota) e as **estatísticas** são calculados toda vez que são pedidos, nunca gravados. Por isso editar ou excluir uma partida nunca deixa os números desatualizados.
- A **variação de MMR** de uma partida é o MMR depois dela menos o MMR da partida anterior (ou o MMR inicial da sessão, se for a primeira). É com esse mesmo MMR anterior que a regra da vitória e da derrota compara.
- Ao editar, a regra compara a partida só com a anterior a ela. A edição nunca é barrada por causa das partidas seguintes, para dar para corrigir um erro de digitação no meio da sessão.
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

`PATCH /sessoes/{id}` e `DELETE /sessoes/{id}` existem na API, mas a interface não usa essas duas rotas. A documentação interativa (Swagger) fica em http://localhost:8000/docs, e o link "Documentação da API" no cabeçalho da interface leva até ela.

## Tecnologias

| Parte | Tecnologias |
| --- | --- |
| Backend | Python 3.12, FastAPI, Pydantic, Uvicorn, Poetry |
| Banco de dados | PostgreSQL 16, SQLAlchemy 2, Alembic, psycopg 3 |
| Frontend | React 19 (JavaScript), Vite, Tailwind CSS 4 |
| Testes | Pytest, Vitest e Testing Library, Playwright. Relatórios com pytest-html, pytest-cov, @vitest/ui e @vitest/coverage-v8 |
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
│   ├── scripts/             resumo dos testes em português (CI e make test-report)
│   ├── tests/               unit/ e integration/ (Pytest)
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           Sessão atual e Histórico: guardam o estado e chamam a API
│   │   ├── components/      formulários, listas, cards e o gráfico (só recebem dados e devolvem eventos)
│   │   ├── api.js           cliente HTTP da API
│   │   └── validacao.js, formatacao.js, grafico.js
│   ├── public/              ícone da aplicação (favicon.svg)
│   ├── tests/               unit/ e integration/ (Vitest), e2e/ (Playwright)
│   └── Dockerfile
├── .github/workflows/       CI Backend, CI Frontend e CI E2E
├── compose.yaml
├── Makefile
└── .env.example
```

## Pré-requisitos

Para rodar a aplicação:

- [Docker](https://docs.docker.com/get-docker/) com o Docker Compose v2 (no Windows e no macOS, o Docker Desktop já traz os dois). O Docker precisa estar **aberto e rodando** antes do `make up`.
- GNU Make:
  - Windows: `winget install ezwinports.make` (depois, abra um terminal novo);
  - macOS: vem com as Command Line Tools (`xcode-select --install`);
  - Linux: pelo gerenciador de pacotes, por exemplo `sudo apt install make`.

  Sem o Make também funciona: cada comando tem o equivalente nas tabelas abaixo.
- Git
- As portas **5173** (frontend), **8000** (API) e **5432** (PostgreSQL) livres na máquina.

Para rodar os testes ou desenvolver fora dos contêineres:

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
| `POSTGRES_PORT` | `5432` | Porta do PostgreSQL na sua máquina. Se mudar, ajuste também a `DATABASE_URL` para rodar a API fora do Docker |
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

O `make up` constrói as imagens e sobe os três serviços (`web`, `api` e `db`). Na primeira vez, ele baixa as imagens base e as dependências, então demora alguns minutos. Ele só termina quando todos estão prontos: o banco e a API passam pelo healthcheck. Antes de iniciar, a API aplica as migrações sozinha. Depois disso, a aplicação está em **http://localhost:5173**.

| Comando | Sem o Make | O que faz |
| --- | --- | --- |
| `make up` | `docker compose up -d --build --wait` | Constrói e sobe web, api e db, esperando ficarem prontos |
| `make ps` | `docker compose ps` | Lista os contêineres e se estão saudáveis (`healthy`) |
| `make logs` | `docker compose logs -f` | Acompanha os logs (`Ctrl+C` para sair) |
| `make down` | `docker compose down` | Para e remove os contêineres. Os dados continuam no volume `postgres_data` |
| `make help` | | Lista todos os comandos do Makefile |

Para apagar também os dados, use `docker compose down -v`.

### Primeiros passos na aplicação

1. Abra http://localhost:5173. Sem sessão aberta, aparece o formulário **Nova sessão**: escolha a playlist, informe o seu MMR e clique em **Iniciar sessão**.
2. Depois de cada partida, preencha **Registrar partida**: placar, se foi para o overtime e o MMR que o jogo mostrou depois da partida. Os números, o gráfico e a lista se atualizam na hora.
3. Para corrigir ou apagar uma partida, use **Editar** ou **Excluir** na linha dela.
4. Ao terminar de jogar, clique em **Encerrar sessão**. A sessão vai para a aba **Histórico**, com o resumo geral e o filtro por playlist.
5. Recarregue a página, ou rode `make down` e `make up` de novo: os dados continuam lá, porque ficam no volume do PostgreSQL.

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

| Comando | O que faz |
| --- | --- |
| `make format` | Formata o backend com o Ruff |
| `make front-format` | Formata o frontend com o Biome |
| `make front-build` | Gera o build de produção do frontend em `frontend/dist` (o mesmo que o Dockerfile faz) |

`make help` lista todos os comandos.

## Testes

São três níveis de teste:
- **Backend e frontend:** **não precisam do Docker**. O backend testa com SQLite em memória, e o frontend simula a API.
- **E2E:** só ele precisa da aplicação no ar (`make up`).

### Preparação (uma vez)

```bash
make install                # dependências do backend (Poetry)
make front-install          # dependências do frontend (npm)
make e2e-install            # Chromium do Playwright, só para o E2E
```

### Comandos

| Comando | Sem o Make | O que roda |
| --- | --- | --- |
| `make test` | em `backend/`: `poetry run pytest -v` | Pytest do backend: serviços com repositórios falsos (`tests/unit`) e rotas, repositórios e CORS com SQLite em memória (`tests/integration`) |
| `make test-unit` | em `backend/`: `poetry run pytest -v tests/unit` | Só os testes unitários do backend |
| `make test-integration` | em `backend/`: `poetry run pytest -v tests/integration` | Só os testes de integração do backend |
| `make test-report` | veja [Relatórios dos testes](#relatórios-dos-testes) | Os mesmos testes do `make test`, gerando os relatórios |
| `make lint` | em `backend/`: `poetry run ruff check .` e `poetry run ruff format --check .` | Ruff no backend: lint e formatação, igual ao CI (`make format` formata) |
| `make front-test` | em `frontend/`: `npm run test` | Vitest do frontend: validação, formatação, contas do gráfico, cliente HTTP e componentes (`tests/unit`), e as páginas com a API simulada (`tests/integration`). Para rodar só uma parte: `npm run test:unit` ou `npm run test:integration` |
| `make front-test-report` | veja [Relatórios dos testes](#relatórios-dos-testes) | Os mesmos testes do `make front-test`, gerando os relatórios |
| `make front-check` | em `frontend/`: `npm run check` | Biome no frontend: lint, formatação e ordem dos imports (`make front-format` formata) |
| `make e2e` | em `frontend/`: `npm run test:e2e` | Playwright no Chromium contra a aplicação inteira do `make up` |

Para conferir na sua máquina tudo o que o CI confere, na mesma ordem:

```bash
make lint
make test
make front-check
make front-test
make up
make e2e
```

### Relatórios dos testes

O `make test-report` e o `make front-test-report` rodam os mesmos testes e geram, em `backend/relatorios/` e `frontend/relatorios/`:

| Arquivo | O que mostra |
| --- | --- |
| `resumo.md` | **O jeito mais fácil de ler.** Resumo em português: quantos testes passaram, as falhas com o motivo, a cobertura e a lista de todos os testes. É o mesmo resumo que aparece na página do CI. No VS Code, abra o arquivo e use `Ctrl+Shift+V` para ver formatado |
| `testes.html` (backend) e `index.html` (frontend) | Cada teste, se passou ou falhou e quanto tempo levou. No backend, a página abre com um painel do que foi testado, com um link para a cobertura, e separa os testes por camada (unitário ou integração). No frontend, a cobertura aparece na aba **Coverage** |
| `coverage/index.html` | Cobertura arquivo por arquivo, com as linhas sem teste marcadas em vermelho. No backend, cada linha mostra também quais testes passaram por ela (clique no `ctx` à direita) |

**Cobertura** é a parte do código que os testes executam. Ela é medida só no código da aplicação: `app/` no backend e `src/` no frontend.

O resumo é montado pelo script [`backend/scripts/resumo_testes.py`](backend/scripts/resumo_testes.py), que usa só a biblioteca padrão do Python. Ele lê dois arquivos em formatos padrão, que também ficam na pasta:
- `junit.xml`: o resultado de cada teste;
- o XML de cobertura (`cobertura.xml` no backend, `coverage/cobertura-coverage.xml` no frontend).

Sem o Make:

```bash
# em backend/
poetry run pytest -v --html=relatorios/testes.html --self-contained-html --junitxml=relatorios/junit.xml --cov --cov-context=test --cov-report=term --cov-report=html:relatorios/coverage --cov-report=xml:relatorios/cobertura.xml
poetry run python scripts/resumo_testes.py Backend relatorios/junit.xml relatorios/cobertura.xml > relatorios/resumo.md

# em frontend/ (o resumo usa o Python do backend)
npm run test:report
cd ../backend && poetry run python scripts/resumo_testes.py Frontend ../frontend/relatorios/junit.xml ../frontend/relatorios/coverage/cobertura-coverage.xml > ../frontend/relatorios/resumo.md
```

O terminal também mostra a tabela de cobertura no fim. As pastas `relatorios/` não vão para o Git.

### Testes E2E

Os testes E2E usam frontend, API e PostgreSQL de verdade. Eles:
- iniciam uma sessão, registram uma partida e conferem que ela continua lá depois de recarregar a página;
- testam o placar empatado;
- editam e excluem uma partida;
- conferem o histórico;
- conferem o link para a documentação da API.

Para rodar, com a preparação feita:

```bash
make up
make e2e
```

- **Banco:** eles rodam no mesmo banco da aplicação, mas apagam só as sessões que eles mesmos criam. Como a API só permite uma sessão aberta por vez, eles se recusam a rodar se houver uma sessão aberta: encerre-a antes.
- **Outro endereço:** por padrão, eles acessam o frontend em `http://localhost:5173` e a API em `http://localhost:8000`. Para usar outros endereços, defina as variáveis `E2E_URL` (frontend) e `E2E_API_URL` (API).
- **Linux:** se o Chromium reclamar de bibliotecas do sistema, instale-o junto com elas, como o CI faz. Em `frontend/`, rode `npx playwright install --with-deps chromium`.

### Integração contínua

Três workflows do GitHub Actions rodam a cada push e a cada pull request, em qualquer branch e sem filtro de pastas. Então qualquer alteração, no backend ou no frontend, aciona os três:

| Workflow | Passos |
| --- | --- |
| CI Backend | Ruff (lint e formatação), depois Pytest com os relatórios. Os relatórios ficam como artefato (`relatorio-backend`) |
| CI Frontend | Biome, depois Vitest com os relatórios. Os relatórios ficam como artefato (`relatorio-frontend`) |
| CI E2E | `docker compose up --build --wait`, depois Playwright. O relatório fica como artefato |

O resultado aparece na aba **Actions** do repositório e na aba **Checks** do pull request. Na página de cada execução:
- **Resumo**, no topo: no CI Backend e no CI Frontend, o mesmo `resumo.md` dos [Relatórios dos testes](#relatórios-dos-testes), em português. Não precisa baixar nada.
- **Artifacts**, no fim da página: os relatórios completos, que sobem mesmo quando algum teste falha. Para ver, baixe o zip e use **Extrair tudo** antes de abrir: aberto direto de dentro do zip, o HTML não acha as outras páginas.
  - `relatorio-backend` e `relatorio-frontend`: abra os arquivos da tabela de [Relatórios dos testes](#relatórios-dos-testes).
  - `playwright-report` (CI E2E): em `frontend/`, rode `npx playwright show-report <pasta-extraída>`.

## Acesso

Com o `make up` rodando:

| O quê | Endereço |
| --- | --- |
| Aplicação | http://localhost:5173 |
| API | http://localhost:8000 |
| Documentação da API (Swagger) | http://localhost:8000/docs (ou pelo link no cabeçalho da aplicação) |
| PostgreSQL | `localhost:5432`, usuário `app`, senha `app`, banco `app` |

## Problemas comuns

| O que aparece | O que fazer |
| --- | --- |
| `make up` falha com `failed to connect to the docker API` ou `Cannot connect to the Docker daemon` | O Docker não está rodando. Abra o Docker Desktop (ou inicie o serviço do Docker), espere carregar e rode de novo |
| `port is already allocated`, `ports are not available` ou `address already in use` | Outro programa usa a porta 5173, 8000 ou 5432; pode ser um `make run` ou `make front-dev` esquecido. Feche-o. A porta do PostgreSQL também pode ser trocada com `POSTGRES_PORT` no `.env` |
| `make` não é reconhecido (Windows) | Instale com `winget install ezwinports.make` e abra um terminal novo, ou use os comandos da coluna "Sem o Make" |
| A tela mostra "Não foi possível falar com a API. Ela está no ar?" | Confira com `make ps` se a `api` está `healthy` e veja o erro com `make logs` |
| O E2E para com "Já existe uma sessão aberta no banco" | Encerre a sessão aberta na tela (botão **Encerrar sessão**) e rode de novo |
| A API não conecta no banco depois de mudar `POSTGRES_USER`, `POSTGRES_PASSWORD` ou `POSTGRES_DB` no `.env` | O PostgreSQL só usa esses valores na primeira vez, quando cria o volume. Para recriar com os novos: `docker compose down -v` (**apaga os dados**) e `make up` |
