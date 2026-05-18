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

build: ## build web (bundled into the worker as ASSETS)
	$(BUN) --filter ./web build

# Single Worker serves api + web/dist. Auth is via the project-account
# API token in what_i_need.md (NOT `wrangler login`, which lands on the
# wrong CF account). See llm/deploy.md.
prod-logs: ## stream live worker logs from smm-api (wrangler tail)
	@test -f what_i_need.md || (echo "what_i_need.md missing" && exit 1)
	cd api && \
	  CLOUDFLARE_API_TOKEN=$$(grep '^CLOUDFLARE_API_TOKEN=' ../what_i_need.md | cut -d= -f2) \
	  CLOUDFLARE_ACCOUNT_ID=$$(grep '^CLOUDFLARE_ACCOUNT_ID=' ../what_i_need.md | cut -d= -f2) \
	  $(BUN) x wrangler tail -c wrangler.local.toml --format pretty

deploy: build ## build web + deploy worker (api + spa) to smm.table.pw
	@test -f what_i_need.md || (echo "what_i_need.md missing — can't read CLOUDFLARE_API_TOKEN" && exit 1)
	cd api && \
	  CLOUDFLARE_API_TOKEN=$$(grep '^CLOUDFLARE_API_TOKEN=' ../what_i_need.md | cut -d= -f2) \
	  CLOUDFLARE_ACCOUNT_ID=$$(grep '^CLOUDFLARE_ACCOUNT_ID=' ../what_i_need.md | cut -d= -f2) \
	  $(BUN) x wrangler deploy -c wrangler.local.toml
	@echo "deployed at $(TS)"
