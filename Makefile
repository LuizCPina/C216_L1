.PHONY: install test lint format run build up down compose-build logs ps help

BACKEND := backend
IMAGE := c216-backend

help:
	@echo "Available commands:"
	@echo "  make install   - Install the project dependencies"
	@echo "  make test      - Run the test suite"
	@echo "  make lint      - Run the linter to check code quality"
	@echo "  make format    - Format the code according to style guidelines"
	@echo "  make run       - Run the project using Uvicorn"
	@echo "  make build     - Build the backend Docker image"
	@echo "  make up        - Start the containers with Docker Compose"
	@echo "  make down      - Stop and remove the containers"
	@echo "  make compose-build - Build the images with Docker Compose"
	@echo "  make logs      - Show the container logs"
	@echo "  make ps        - List the running containers"

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
