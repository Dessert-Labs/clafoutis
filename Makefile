SHELL := /bin/bash
# Load .env if present, then NVM and Node from .nvmrc (install if missing)
ENV_LOADER := set -a && [ -f .env ] && . ./.env && set +a && export NVM_DIR="$${NVM_DIR:-$$HOME/.nvm}" && [ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && nvm install && nvm use

# --- Package alias resolver ---
# Maps short names to pnpm workspace filter names.
# Usage: make build studio  |  make test studio-core  |  make start studio
resolve_pkg = $(if $(filter studio,$(1)),@clafoutis/studio,\
              $(if $(filter studio-core,$(1)),@clafoutis/studio-core,\
              $(if $(filter studio-mcp,$(1)),@clafoutis/studio-mcp,\
              $(if $(filter cli,$(1)),@clafoutis/cli,\
              $(if $(filter generators,$(1)),@clafoutis/generators,\
              $(if $(filter shared,$(1)),@clafoutis/shared,\
              $(if $(filter eslint-config,$(1)),@clafoutis/eslint-config,\
              $(if $(filter prettier-config,$(1)),@clafoutis/prettier-config,\
              $(if $(filter tsup-config,$(1)),@clafoutis/tsup-config,\
              $(if $(filter typescript-config,$(1)),@clafoutis/typescript-config,\
              $(if $(filter vitest-config,$(1)),@clafoutis/vitest-config,\
              @clafoutis/$(1))))))))))))

# Grab everything after the first word so "make dev studio" gives PKG=studio
SUBCMD := $(word 2,$(MAKECMDGOALS))

.PHONY: help init install build-all lint-check lint-fix format-check format-fix check-all fix-all type-check test-all clean turbo-clean pre-commit dev build test start lint type storybook test-storybook

help:
	@echo "Usage: make [target] [package]"
	@echo ""
	@echo "Setup:"
	@echo "  make              - show this help"
	@echo "  make init         - install pre-commit hooks and dependencies"
	@echo "  make install [pkg ...] - pnpm install, or add pkgs if given"
	@echo ""
	@echo "Per-package (pass a short name as second arg):"
	@echo "  make start <pkg>  - run dev server/watch for a package"
	@echo "  make dev <pkg>    - alias for start"
	@echo "  make build <pkg>  - build a single package"
	@echo "  make test <pkg>   - run tests for a single package"
	@echo "  make lint <pkg>   - lint a single package"
	@echo "  make type <pkg>   - type-check a single package"
	@echo "  make storybook <pkg> - run Storybook dev server"
	@echo "  make test-storybook <pkg> - run Storybook Playwright tests"
	@echo ""
	@echo "  Packages: studio | studio-core | studio-mcp | cli | generators | shared"
	@echo ""
	@echo "  Examples:"
	@echo "    make start studio      - start the Studio dev server"
	@echo "    make build studio-core - build studio-core"
	@echo "    make test studio-core  - run studio-core tests"
	@echo ""
	@echo "All-packages:"
	@echo "  make build-all    - build all packages"
	@echo "  make check-all    - lint + format + type-check all"
	@echo "  make fix-all      - lint fix + format fix all"
	@echo "  make test-all     - run all tests"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint-check   - ESLint check only (all)"
	@echo "  make lint-fix     - ESLint fix (all)"
	@echo "  make format-check - Prettier check only (all)"
	@echo "  make format-fix   - Prettier fix (all)"
	@echo "  make type-check   - TypeScript type-check (all)"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean        - remove node_modules, dist, .turbo"
	@echo "  make turbo-clean  - clear Turbo cache only"
	@echo ""
	@echo "Git Hooks:"
	@echo "  make pre-commit   - run pre-commit checks (called by husky)"

# --- Setup targets ---

init:
	$(ENV_LOADER) && npx husky install && pnpm install
.PHONY: init

install:
	@$(eval INSTALL_ARGS := $(filter-out install,$(MAKECMDGOALS)))
	$(ENV_LOADER) && ARGS='$(INSTALL_ARGS)' && if [ -z "$$ARGS" ]; then pnpm install; else set -- $$ARGS && pnpm add "$$@"; fi
.PHONY: install

# --- Per-package targets ---

start:
ifndef SUBCMD
	@echo "Usage: make start <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) dev
endif
.PHONY: start

dev: start
.PHONY: dev

build:
ifndef SUBCMD
	@echo "Usage: make build <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) build
endif
.PHONY: build

test:
ifndef SUBCMD
	@echo "Usage: make test <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) test
endif
.PHONY: test

lint:
ifndef SUBCMD
	@echo "Usage: make lint <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) lint:check
endif
.PHONY: lint

type:
ifndef SUBCMD
	@echo "Usage: make type <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) type-check
endif
.PHONY: type

storybook:
ifndef SUBCMD
	@echo "Usage: make storybook <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) storybook
endif
.PHONY: storybook

test-storybook:
ifndef SUBCMD
	@echo "Usage: make test-storybook <package>"; exit 1
else
	$(ENV_LOADER) && pnpm --filter $(call resolve_pkg,$(SUBCMD)) test:storybook
endif
.PHONY: test-storybook

# --- All-packages targets ---

build-all:
	$(ENV_LOADER) && pnpm turbo build
.PHONY: build-all

lint-check:
	$(ENV_LOADER) && pnpm turbo lint:check
.PHONY: lint-check

lint-fix:
	$(ENV_LOADER) && pnpm turbo lint:write
.PHONY: lint-fix

format-check:
	$(ENV_LOADER) && pnpm turbo format:check
.PHONY: format-check

format-fix:
	$(ENV_LOADER) && pnpm turbo format:write
.PHONY: format-fix

type-check:
	$(ENV_LOADER) && pnpm turbo type-check
.PHONY: type-check

check-all: lint-check format-check type-check
.PHONY: check-all

fix-all: lint-fix format-fix
.PHONY: fix-all

test-all:
	$(ENV_LOADER) && pnpm turbo test
.PHONY: test-all

# --- Cleanup ---

clean:
	@echo "Cleaning everything..."
	@find . -name "node_modules" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
	@find . -name "dist" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
	@find . -name ".turbo" -type d -prune -exec rm -rf '{}' + 2>/dev/null || true
	@echo "Cleanup completed!"
.PHONY: clean

turbo-clean:
	@echo "Clearing Turbo cache..."
	@pnpm turbo clean 2>/dev/null || true
	@rm -rf node_modules/.cache/turbo 2>/dev/null || true
	@echo "Turbo cache cleared!"
.PHONY: turbo-clean

# --- Git Hooks ---

pre-commit:
	@echo "Running pre-commit checks..."
	@echo "→ Checking linting..."
	@$(ENV_LOADER) && pnpm turbo lint:check || { echo "✗ Linting failed. Please fix the errors and try again."; exit 1; }
	@echo "→ Checking types..."
	@$(ENV_LOADER) && pnpm turbo type-check || { echo "✗ Type checking failed. Please fix the errors and try again."; exit 1; }
	@echo "→ Checking formatting..."
	@$(ENV_LOADER) && pnpm turbo format:check || { echo "✗ Formatting check failed. Run 'make fix-all' to fix formatting."; exit 1; }
	@echo "✓ All pre-commit checks passed!"
.PHONY: pre-commit

# Catch-all: swallow extra args so "make dev studio" doesn't try to build "studio" as a target
%:
	@:
