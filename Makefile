.PHONY: install test lint format run help

BACKEND := backend

help:
	@echo "Available commands:"
	@echo "  make install   - Install the project dependencies"
	@echo "  make test      - Run the test suite"
	@echo "  make lint      - Run the linter to check code quality"
	@echo "  make format    - Format the code according to style guidelines"
	@echo "  make run       - Run the project using Uvicorn"

install:
	@echo "Installing the project..."
	@cd $(BACKEND) && poetry install
	@echo "Installation complete."

test:
	@echo "Running tests..."
	@cd $(BACKEND) && poetry run pytest
	@echo "Tests completed."

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
	@cd $(BACKEND) && poetry run uvicorn main:app --reload
	@echo "Project execution finished."
