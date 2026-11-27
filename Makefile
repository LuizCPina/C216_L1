.PHONY: help install test test-unit test-integration test-report migrate migration migrate-down run lint format up down logs ps \
	front-install front-dev front-build front-test front-test-report front-check front-format \
	e2e-install e2e

BACKEND := backend
FRONTEND := frontend

help:
	@echo Available commands:
	@echo   make install - Install the backend dependencies
	@echo   make test    - Run the backend tests
	@echo   make test-unit - Run only the unit tests
	@echo   make test-integration - Run only the integration tests
	@echo   make test-report - Run the backend tests and generate the HTML and coverage reports
	@echo   make migrate - Apply the pending database migrations
	@echo   make migration m=message - Create a migration from the models
	@echo   make migrate-down - Revert the last migration
	@echo   make run    - Run the API with Uvicorn
	@echo   make lint    - Check lint and formatting with Ruff, like the CI
	@echo   make format  - Format the code with Ruff
	@echo   make up      - Build and start web, api and db, waiting until they are ready
	@echo   make down    - Stop and remove the containers
	@echo   make logs    - Follow the container logs
	@echo   make ps      - List the containers
	@echo Frontend:
	@echo   make front-install - Install the frontend dependencies
	@echo   make front-dev     - Run the frontend with Vite
	@echo   make front-build   - Build the frontend for production
	@echo   make front-test    - Run the frontend tests with Vitest
	@echo   make front-test-report - Run the frontend tests and generate the HTML and coverage reports
	@echo   make front-check   - Check lint and formatting with Biome
	@echo   make front-format  - Format the frontend code with Biome
	@echo End-to-end:
	@echo   make e2e-install - Download the Chromium used by Playwright
	@echo   make e2e         - Run the Playwright tests, with the stack up: make up

install:
	@echo Installing the backend...
	@cd $(BACKEND) && poetry install --no-root
	@echo Installation complete.

test:
	@echo Running tests...
	@cd $(BACKEND) && poetry run pytest -v
	@echo Tests completed.

test-unit:
	@echo Running unit tests...
	@cd $(BACKEND) && poetry run pytest -v tests/unit
	@echo Unit tests completed.

test-integration:
	@echo Running integration tests...
	@cd $(BACKEND) && poetry run pytest -v tests/integration
	@echo Integration tests completed.

test-report:
	@echo Running tests with reports...
	@cd $(BACKEND) && poetry run pytest -v --html=relatorios/testes.html --self-contained-html --junitxml=relatorios/junit.xml --cov --cov-report=term --cov-report=html:relatorios/coverage --cov-report=xml:relatorios/cobertura.xml
	@cd $(BACKEND) && poetry run python scripts/resumo_testes.py Backend relatorios/junit.xml relatorios/cobertura.xml > relatorios/resumo.md
	@echo Reports: backend/relatorios/resumo.md, testes.html and coverage/index.html

migrate:
	@echo Applying migrations...
	@cd $(BACKEND) && poetry run alembic upgrade head
	@echo Migrations applied.

migration:
	@echo Creating a new migration...
	@cd $(BACKEND) && poetry run alembic revision --autogenerate -m "$(m)"
	@echo Migration created. Review the generated file before committing.

migrate-down:
	@echo Reverting the last migration...
	@cd $(BACKEND) && poetry run alembic downgrade -1
	@echo Migration reverted.

run:
	@echo Running the API...
	@cd $(BACKEND) && poetry run uvicorn app.main:app --reload

lint:
	@echo Running linter...
	@cd $(BACKEND) && poetry run ruff check .
	@cd $(BACKEND) && poetry run ruff format --check .
	@echo Linting completed.

format:
	@echo Formatting code...
	@cd $(BACKEND) && poetry run ruff format .
	@echo Formatting completed.

up:
	@echo Starting the containers...
	@docker compose up -d --build --wait
	@echo Containers ready. Open http://localhost:5173

down:
	@echo Stopping the containers...
	@docker compose down
	@echo Containers stopped.

logs:
	@docker compose logs -f

ps:
	@docker compose ps

front-install:
	@echo Installing the frontend...
	@cd $(FRONTEND) && npm install
	@echo Frontend installation complete.

front-dev:
	@echo Running the frontend...
	@cd $(FRONTEND) && npm run dev

front-build:
	@echo Building the frontend...
	@cd $(FRONTEND) && npm run build
	@echo Frontend build complete.

front-test:
	@echo Running frontend tests...
	@cd $(FRONTEND) && npm run test
	@echo Frontend tests completed.

front-test-report:
	@echo Running frontend tests with reports...
	@cd $(FRONTEND) && npm run test:report
	@cd $(BACKEND) && poetry run python scripts/resumo_testes.py Frontend ../frontend/relatorios/junit.xml ../frontend/relatorios/coverage/cobertura-coverage.xml > ../frontend/relatorios/resumo.md
	@echo Reports: frontend/relatorios/resumo.md, index.html and coverage/index.html

front-check:
	@echo Checking the frontend with Biome...
	@cd $(FRONTEND) && npm run check
	@echo Frontend check completed.

front-format:
	@echo Formatting the frontend code...
	@cd $(FRONTEND) && npm run format
	@echo Frontend formatting completed.

e2e-install:
	@echo Installing the Playwright browser...
	@cd $(FRONTEND) && npx playwright install chromium
	@echo Browser installed.

e2e:
	@echo Running end-to-end tests against http://localhost:5173...
	@cd $(FRONTEND) && npm run test:e2e
	@echo End-to-end tests completed.
