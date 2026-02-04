---
"@clafoutis/cli": major
"@clafoutis/generators": major
"@clafoutis/shared": major
---

Clafoutis v2 - Full CLI for GitOps-powered design token generation and distribution.

This release transforms Clafoutis from a standalone token generator into a full-featured npm package with CLI. It introduces a producer/consumer workflow where design system maintainers generate tokens and publish via GitHub Releases, and application developers sync specific versions into their projects.

**New Features:**

- Interactive setup wizard with `@clack/prompts` for guided producer/consumer configuration
- Three CLI commands: `init`, `generate`, and `sync`
- Multi-select generator selection (Tailwind, Figma) with custom plugin support
- Starter token templates automatically created for new producers
- GitHub Actions workflow template for automated releases
- `--dry-run`, `--force`, and `--non-interactive` flags for all commands
- Wizard prompts when running `generate` or `sync` without config
- Config validation with JSON schema using `ajv`
- Warnings for unknown/deprecated config fields
- Structured error handling with actionable suggestions
- Version pinning with `"latest"` resolution support
- Caching to avoid redundant downloads
- Private repository support via `CLAFOUTIS_REPO_TOKEN`
- Shell completions for bash and zsh
- Comprehensive test suite (118 tests)

**Infrastructure:**

- Restructured to Turborepo monorepo with pnpm workspaces
- Shared ESLint, Prettier, and Vitest configurations
- Makefile task runner
- Husky pre-commit hooks
- Changesets for versioning and changelog generation
- Automated npm publishing via GitHub Actions

**Breaking Changes:**

- Package renamed from `claf` to `@clafoutis/cli`
- Configuration files moved to `.clafoutis/` directory
- Environment variable changed from `GITHUB_TOKEN` to `CLAFOUTIS_REPO_TOKEN`
- Old `pnpm run generate` scripts removed - use `npx clafoutis generate` instead
