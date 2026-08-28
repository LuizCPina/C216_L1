.PHONY: install test lint format run help

PYTEST := poetry run pytest
UVICORN := poetry run uvicorn
RUFF := poetry run ruff

help:
	@echo "Available commands:"
	@echo "  make install   - Install the project dependencies"
	@echo "  make test      - Run the test suite"
	@echo "  make lint      - Run the linter to check code quality"
	@echo "  make format    - Format the code according to style guidelines"
	@echo "  make run       - Run the project using Uvicorn"

install:
	@echo "Installing the project..."
	@poetry install
	@echo "Installation complete."

test:
	@echo "Running tests..."
	@$(PYTEST)
	@echo "Tests completed."

lint:
	@echo "Running linter..."
	@$(RUFF) check .
	@echo "Linting completed."

format:
	@echo "Formatting code..."
	@$(RUFF) format .
	@echo "Code formatting completed."

run:
	@echo "Running the project..."
	@$(UVICORN) main:app --reload
	@echo "Project execution finished."
