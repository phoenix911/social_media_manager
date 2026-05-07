.DEFAULT_GOAL := help
SHELL := /usr/bin/env bash

BUN := bun
TS := $(shell date +%Y-%m-%dT%H:%M:%S)

##@ Help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Setup

deps: ## install all workspace deps
	$(BUN) install

##@ Dev

dev: ## run api + web side by side (uses 2 terminals via overmind/process compose; for now just hint)
	@echo "Open two terminals:"
	@echo "  make dev-api"
	@echo "  make dev-web"

dev-api: ## run api worker locally on :8787
	$(BUN) --filter ./api dev

dev-web: ## run web on :5173
	$(BUN) --filter ./web dev

##@ Database

db-generate: ## drizzle-kit generate (after editing api/src/db/schema.ts)
	$(BUN) --filter ./api db:generate

db-apply-local: ## apply migrations to the local D1 (wrangler dev)
	$(BUN) --filter ./api db:apply:local

db-apply-remote: ## apply migrations to remote D1
	$(BUN) --filter ./api db:apply:remote

##@ Build / Deploy

typecheck: ## tsc --noEmit across all workspaces
	$(BUN) --filter '*' typecheck

build: ## build api + web
	$(BUN) --filter ./api build
	$(BUN) --filter ./web build

deploy-api: build ## deploy api worker
	$(BUN) --filter ./api deploy

deploy-web: ## deploy web to Pages
	$(BUN) --filter ./web build
	$(BUN) --filter ./web deploy

deploy: deploy-api deploy-web ## deploy everything
	@echo "deployed at $(TS)"
