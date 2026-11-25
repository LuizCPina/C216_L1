.PHONY: help install test run lint format up down logs ps

BACKEND := backend

help:
	@echo Available commands:
	@echo   make install - Install the backend dependencies
	@echo   make test    - Run the backend tests
	@echo   make run    - Run the API with Uvicorn
	@echo   make lint    - Check the code with Ruff
	@echo   make format  - Format the code with Ruff
	@echo   make up      - Build and start the containers
	@echo   make down    - Stop and remove the containers
	@echo   make logs    - Follow the container logs
	@echo   make ps      - List the containers

install:
	@echo Installing the backend...
	@cd $(BACKEND) && poetry install --no-root
	@echo Installation complete.

test:
	@echo Running tests...
	@cd $(BACKEND) && poetry run pytest -v
	@echo Tests completed.

run:
	@echo Running the API...
	@cd $(BACKEND) && poetry run uvicorn app.main:app --reload

lint:
	@echo Running linter...
	@cd $(BACKEND) && poetry run ruff check .
	@echo Linting completed.

format:
	@echo Formatting code...
	@cd $(BACKEND) && poetry run ruff format .
	@echo Formatting completed.

up:
	@echo Starting the containers...
	@docker compose up -d --build
	@echo Containers started.

down:
	@echo Stopping the containers...
	@docker compose down
	@echo Containers stopped.

logs:
	@docker compose logs -f

ps:
	@docker compose ps
