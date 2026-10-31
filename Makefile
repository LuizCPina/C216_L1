.PHONY: install test test-verbose test-unit test-integration migrate migration migrate-down lint format run build up down compose-build logs ps \
        front-install front-dev front-build front-preview front-test front-test-watch front-test-unit front-test-integration front-test-e2e front-lint front-format front-format-check front-check \
        install-all test-all lint-all help

BACKEND := backend
FRONTEND := frontend
IMAGE := c216-backend

help:
	@echo "Available commands:"
	@echo "  make install   - Install the project dependencies"
	@echo "  make test      - Run the test suite"
	@echo "  make test-verbose - Run the test suite in verbose mode"
	@echo "  make test-unit - Run only the unit tests"
	@echo "  make test-integration - Run only the integration tests"
	@echo "  make migrate   - Apply all pending database migrations"
	@echo "  make migration m=\"message\" - Create a new migration"
	@echo "  make migrate-down - Revert the last migration"
	@echo "  make lint      - Run the linter to check code quality"
	@echo "  make format    - Format the code according to style guidelines"
	@echo "  make run       - Run the project using Uvicorn"
	@echo "  make build     - Build the backend Docker image"
	@echo "  make up        - Start the containers with Docker Compose"
	@echo "  make down      - Stop and remove the containers"
	@echo "  make compose-build - Build the images with Docker Compose"
	@echo "  make logs      - Show the container logs"
	@echo "  make ps        - List the running containers"
	@echo ""
	@echo "Frontend:"
	@echo "  make front-install - Install the frontend dependencies"
	@echo "  make front-dev - Run the frontend dev server (Vite)"
	@echo "  make front-build - Build the frontend for production"
	@echo "  make front-preview - Preview the production build"
	@echo "  make front-test - Run the Vitest suite"
	@echo "  make front-test-watch - Run the Vitest suite in watch mode"
	@echo "  make front-test-unit - Run only the frontend unit tests"
	@echo "  make front-test-integration - Run only the frontend integration tests"
	@echo "  make front-test-e2e - Run the Playwright end-to-end tests"
	@echo "  make front-lint - Run Biome as a linter"
	@echo "  make front-format - Format the frontend code with Biome"
	@echo "  make front-format-check - Check the formatting without changing files"
	@echo "  make front-check - Run Biome lint, format and import checks"
	@echo ""
	@echo "Both sides:"
	@echo "  make install-all - Install backend and frontend dependencies"
	@echo "  make test-all  - Run the backend and frontend test suites"
	@echo "  make lint-all  - Lint the backend and the frontend"

install:
	@echo "Installing the project..."
	@cd $(BACKEND) && poetry install --no-root
	@echo "Installation complete."

test:
	@echo "Running tests..."
	@cd $(BACKEND) && poetry run pytest
	@echo "Tests completed."

test-verbose:
	@echo "Running tests in verbose mode..."
	@cd $(BACKEND) && poetry run pytest -v
	@echo "Verbose tests completed."

test-unit:
	@echo "Running unit tests..."
	@cd $(BACKEND) && poetry run pytest tests/unit
	@echo "Unit tests completed."

test-integration:
	@echo "Running integration tests..."
	@cd $(BACKEND) && poetry run pytest tests/integration
	@echo "Integration tests completed."

migrate:
	@echo "Applying migrations..."
	@cd $(BACKEND) && poetry run alembic upgrade head
	@echo "Migrations applied."

migration:
	@echo "Creating a new migration..."
	@cd $(BACKEND) && poetry run alembic revision --autogenerate -m "$(m)"
	@echo "Migration created."

migrate-down:
	@echo "Reverting the last migration..."
	@cd $(BACKEND) && poetry run alembic downgrade -1
	@echo "Migration reverted."

lint:
	@echo "Running linter..."
	@cd $(BACKEND) && poetry run ruff check .
	@echo "Linting completed."

format:
	@echo "Formatting code..."
	@cd $(BACKEND) && poetry run ruff format .
	@echo "Code formatting completed."

run:
	@echo "Running the project..."
	@cd $(BACKEND) && poetry run uvicorn app.main:app --reload
	@echo "Project execution finished."

build:
	@echo "Building the Docker image..."
	@cd $(BACKEND) && docker build -t $(IMAGE) .
	@echo "Build completed."

up:
	@echo "Starting the containers..."
	@docker compose up -d
	@echo "Containers started."

down:
	@echo "Stopping the containers..."
	@docker compose down
	@echo "Containers stopped."

compose-build:
	@echo "Building the images with Compose..."
	@docker compose build
	@echo "Build completed."

logs:
	@echo "Showing the container logs..."
	@docker compose logs
	@echo "Logs displayed."

ps:
	@echo "Listing the containers..."
	@docker compose ps
	@echo "Listing completed."

# ---------------------------------------------------------------------------
# Frontend
#
# Cada alvo apenas chama o script equivalente do package.json. O npm continua
# funcionando sozinho; o make existe para que os dois lados do projeto tenham
# a mesma porta de entrada.
# ---------------------------------------------------------------------------

front-install:
	@echo "Installing the frontend..."
	@cd $(FRONTEND) && npm install
	@echo "Frontend installation complete."

front-dev:
	@echo "Starting the frontend dev server..."
	@cd $(FRONTEND) && npm run dev

front-build:
	@echo "Building the frontend..."
	@cd $(FRONTEND) && npm run build
	@echo "Frontend build completed."

front-preview:
	@echo "Previewing the frontend build..."
	@cd $(FRONTEND) && npm run preview

front-test:
	@echo "Running frontend tests..."
	@cd $(FRONTEND) && npm run test
	@echo "Frontend tests completed."

front-test-watch:
	@echo "Running frontend tests in watch mode..."
	@cd $(FRONTEND) && npm run test:watch

front-test-unit:
	@echo "Running frontend unit tests..."
	@cd $(FRONTEND) && npm run test:unit
	@echo "Frontend unit tests completed."

front-test-integration:
	@echo "Running frontend integration tests..."
	@cd $(FRONTEND) && npm run test:integration
	@echo "Frontend integration tests completed."

front-test-e2e:
	@echo "Running end-to-end tests..."
	@cd $(FRONTEND) && npm run test:e2e
	@echo "End-to-end tests completed."

front-lint:
	@echo "Running the frontend linter..."
	@cd $(FRONTEND) && npm run lint
	@echo "Frontend linting completed."

front-format:
	@echo "Formatting the frontend code..."
	@cd $(FRONTEND) && npm run format
	@echo "Frontend formatting completed."

front-format-check:
	@echo "Checking the frontend formatting..."
	@cd $(FRONTEND) && npm run format:check
	@echo "Frontend formatting check completed."

front-check:
	@echo "Checking the frontend with Biome..."
	@cd $(FRONTEND) && npm run check
	@echo "Frontend check completed."

# ---------------------------------------------------------------------------
# Atalhos que cobrem os dois lados
# ---------------------------------------------------------------------------

install-all: install front-install

test-all: test front-test

lint-all: lint front-lint
