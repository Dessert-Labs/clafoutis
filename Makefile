SHELL := /bin/bash
# Load .env if present, then NVM and Node from .nvmrc (install if missing)
ENV_LOADER := set -a && ([ -f .env ] && . ./.env || true) && set +a && export NVM_DIR="$${NVM_DIR:-$$HOME/.nvm}" && [ -s "$$NVM_DIR/nvm.sh" ] && . "$$NVM_DIR/nvm.sh" && nvm install && nvm use

# Inline args for targets that take them (e.g. make install axios lodash)
ARGS := $(filter-out install,$(MAKECMDGOALS))

.PHONY: help init install build-all lint-check lint-fix format-check format-fix check-all fix-all type-check test-all clean turbo-clean pre-commit

help:
	@echo "Usage: make [target] [ARGS...]"
	@echo ""
	@echo "Setup:"
	@echo "  make             - show this help"
	@echo "  make init        - install pre-commit hooks and dependencies"
	@echo "  make install [pkg ...] - pnpm install, or add pkgs if given"
	@echo ""
	@echo "Build:"
	@echo "  make build-all   - build all packages"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint-check  - run ESLint (check only)"
	@echo "  make lint-fix    - run ESLint with --fix"
	@echo "  make format-check - run Prettier (check only)"
	@echo "  make format-fix  - run Prettier (write)"
	@echo "  make type-check  - run TypeScript type checking"
	@echo "  make check-all   - run all checks (lint + format + type-check)"
	@echo "  make fix-all     - fix all issues (lint + format)"
	@echo ""
	@echo "Testing:"
	@echo "  make test-all    - run all tests"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean       - remove node_modules, dist, .turbo"
	@echo "  make turbo-clean - clear Turbo cache only"
	@echo ""
	@echo "Git Hooks:"
	@echo "  make pre-commit  - run pre-commit checks (called by husky)"

init:
	$(ENV_LOADER) && npx husky install && pnpm install
.PHONY: init

# Install all dependencies, or add packages inline: make install axios lodash
install:
	$(ENV_LOADER) && ARGS='$(ARGS)' && if [ -z "$$ARGS" ]; then pnpm install; else set -- $$ARGS && pnpm add "$$@"; fi
.PHONY: install

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

# Dummy target so "make install pkg1 pkg2" does not try to build pkg1/pkg2
%:
	@:
