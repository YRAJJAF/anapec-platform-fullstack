.PHONY: help dev prod stop logs seed test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start dev environment (hot reload)
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✅ Dev server: http://localhost:3000 | API: http://localhost:3001 | Swagger: http://localhost:3001/api/docs"

prod: ## Start production stack
	docker compose up -d --build
	@echo "✅ Production: http://localhost"

stop: ## Stop all containers
	docker compose down

logs: ## Tail all logs
	docker compose logs -f

logs-backend: ## Tail backend logs only
	docker compose logs -f backend

seed: ## Re-seed the database
	docker compose exec backend npx ts-node prisma/seed.ts

migrate: ## Run pending migrations
	docker compose exec backend npx prisma migrate deploy

studio: ## Open Prisma Studio (DB GUI)
	cd backend && npx prisma studio

test: ## Run backend unit tests
	cd backend && npm run test

test-cov: ## Run tests with coverage
	cd backend && npm run test:cov

clean: ## Remove all containers, volumes and images
	docker compose down -v --rmi local
	@echo "⚠️  All data has been removed"

install: ## Install all dependencies
	cd backend && npm install
	cd frontend && npm install

lint: ## Lint both projects
	cd backend && npm run lint
	cd frontend && npm run lint

build: ## Build both projects
	cd backend && npm run build
	cd frontend && npm run build
