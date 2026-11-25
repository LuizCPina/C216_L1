.PHONY: help install run lint format

BACKEND := backend

help:
	@echo Available commands:
	@echo   make install - Install the backend dependencies
	@echo   make run     - Run the API with Uvicorn
	@echo   make lint    - Check the code with Ruff
	@echo   make format  - Format the code with Ruff

install:
	@echo Installing the backend...
	@cd $(BACKEND) && poetry install --no-root
	@echo Installation complete.

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
