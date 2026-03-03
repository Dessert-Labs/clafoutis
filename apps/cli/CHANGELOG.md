# @clafoutis/cli

## 1.3.1

### Patch Changes

- f4356af: Fix producer workflow template to validate on PRs and release on push.

  Restores the two-job `validate` + `release` structure so token format and
  generation are checked on pull requests without cutting a release, while
  `release` (gated on `validate`) runs only on push to main. Adds
  `workflow_dispatch` so releases can be triggered manually without a token
  file change. Fixes a bug where the `release` job was missing the
  `generate` step, causing releases to be created with no assets attached.

## 1.3.0

### Minor Changes

- 981c701: Add first-class motion token support (duration and cubicBezier).

  **`@clafoutis/generators`**
  - Register `cubicBezier/css` StyleDictionary transform — converts `[0.4, 0, 0.2, 1]` arrays to valid `cubic-bezier(0.4, 0, 0.2, 1)` CSS function strings. Without this, cubicBezier token values were emitted as broken comma-joined arrays.
  - Generate `motion-reduced.css` — a `@media (prefers-reduced-motion: reduce)` block that automatically zeroes all `duration` tokens, imported from `index.css` alongside `base.css` and `dark.css`.
  - Map `duration.*` tokens to `transitionDuration` and `easing.*` tokens to `transitionTimingFunction` in the generated `tailwind.base.js` config, enabling classes like `duration-fast` and `ease-out` backed by CSS custom properties.

  **`@clafoutis/cli`**
  - Add `tokens/motion/base.json` starter template with a comprehensive set of motion primitives and semantic presets:
    - 8 duration tokens: `none`, `instant`, `fast`, `moderate`, `normal`, `slow`, `deliberate`, `leisurely`
    - 10 easing tokens: `linear`, `default`, `in`, `out`, `inOut`, `spring`, `bounce`, `snappy`, `gentle`, `expressive`
    - 7 semantic motion presets referencing the primitives: `micro`, `small`, `expand`, `enter`, `exit`, `page`, `loading`
  - This template is included when running `clafoutis init --producer`.

### Patch Changes

- Updated dependencies [981c701]
  - @clafoutis/generators@1.1.0

## 1.2.2

### Patch Changes

- 39f80c1: Fix generator cwd handling so `clafoutis generate --cwd <path>` always reads tokens and writes output relative to the provided working directory instead of the process root.

  Update the default starter badge tokens to use semantic state colors (info/success/warning/error) rather than slate-heavy values, improving out-of-the-box badge appearance.

- Updated dependencies [39f80c1]
  - @clafoutis/generators@1.0.5

## 1.2.1

### Patch Changes

- d2a7d2a: Add monorepo-friendly `--cwd` support across CLI commands and update producer workflow scaffolding to commit `build/**` artifacts before creating a GitHub release.

## 1.2.0

### Minor Changes

- Add the `clafoutis format` command for consistent token JSON formatting and improve CLI command robustness for token formatting and generation workflows.

## 1.1.2

### Patch Changes

- 226b446: **generators:** Fix color/spaceRGB transform to preserve alpha channel. Transparent and rgba color values were being output as solid black (0 0 0) because the alpha component was silently dropped. Now outputs modern CSS `r g b / a` syntax (e.g., `0 0 0 / 0` for transparent, `0 0 0 / 0.5` for semi-transparent overlays).

  **cli:** Redesign default token templates with a comprehensive color system featuring 30 color scales with light and dark variants, expanded semantic tokens (overlays, disabled states, focus rings, feedback states), and component-level tokens for all standard UI components. Token templates restructured from inline definitions to separate JSON files.

- Updated dependencies [226b446]
  - @clafoutis/generators@1.0.4

## 1.1.1

### Patch Changes

- Updated dependencies [54b87e4]
  - @clafoutis/generators@1.0.3

## 1.1.0

### Minor Changes

- d8c075c: Restructure starter token templates with proper primitive/semantic separation

  **Primitives** (raw color values):
  - `colors/primitives.json`: gray, blue, green, red, amber scales (50-900)

  **Semantics** (named colors with meaning that reference primitives):
  - `colors/semantic.json`: primary→blue, neutral→gray, success→green, warning→amber, error→red, plus background/foreground/border tokens for light mode
  - `colors/semantic.dark.json`: dark mode overrides for background/foreground/border

  This follows the proper design token architecture where primitives are raw values and semantics provide meaning by referencing primitives.

### Patch Changes

- d8c075c: Add .gitignore templates to init command
  - Producer repos: ignore `node_modules/`, `build/`, and `release-assets/`
  - Consumer repos: ignore `.clafoutis/cache`

  This prevents accidentally committing generated files that cause CI workflow failures.

## 1.0.2

### Patch Changes

- cbe806b: Fix broken GitHub workflow template: change package name from `clafoutis` to `@clafoutis/cli`

  The generated workflow was failing in CI because `clafoutis` doesn't exist on npm - the correct package name is `@clafoutis/cli`.

- Updated dependencies [a263304]
  - @clafoutis/generators@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [a5b006a]
  - @clafoutis/shared@1.0.0
  - @clafoutis/generators@1.0.1

## 1.0.0

### Major Changes

- 5631750: Clafoutis v2 - Full CLI for GitOps-powered design token generation and distribution.

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

### Patch Changes

- Updated dependencies [5631750]
  - @clafoutis/generators@1.0.0
