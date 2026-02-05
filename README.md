# Clafoutis

GitOps-powered design token generation and distribution.

## The Problem

Design tokens get out of sync. A designer updates the primary color in Figma, but three weeks later the React app still has the old blue. The marketing site has a different shade entirely. Nobody knows which version is "correct."

**Without Clafoutis:**
```text
Designer updates Figma → exports JSON → emails developer → 
developer copies values → commits to repo A → forgets repo B →
repos drift apart → Figma has different values than code →
"why does the button look different?"
```

**With Clafoutis:**
```text
Update tokens in Git → PR merged → GitHub Release created →
all consuming repos sync the same version →
Figma variables regenerated from the same source →
design and code stay in sync
```

## How It Works

**Producers** (design system maintainers) define tokens in JSON and publish via GitHub Releases:

```bash
npx clafoutis init --producer
# Edit tokens/colors/primitives.json
npx clafoutis generate
git push  # GitHub Action creates release automatically
```

**Consumers** (application developers) pin to a version and sync:

```bash
npx clafoutis init --consumer --repo Acme/design-system
npx clafoutis sync
git commit -m "chore: sync design tokens v1.2.0"
```

Tokens are committed to your repo. No runtime dependencies. No build-time network requests. Just static files under version control.

## Why This Approach?

| Pain Point | How Clafoutis Solves It |
|------------|------------------------|
| "Which Figma file has the latest tokens?" | Single source of truth in a Git repo with tagged releases |
| "Our CI build failed because the token CDN was down" | Tokens are committed locally - no network needed at build time |
| "We updated tokens and broke three apps" | Pin to specific versions, update each app on its own schedule |
| "How do I know what changed between v1.0 and v2.0?" | Standard Git diff - tokens are just JSON files |
| "Setting up Style Dictionary is complicated" | Built-in generators for Tailwind and Figma, or bring your own |

## Quick Start

### Installation

```bash
npm install -D @clafoutis/cli
```

### For Producers (Design System Teams)

```bash
# Initialize with interactive wizard
npx clafoutis init --producer

# Or non-interactive for CI
npx clafoutis init --producer --generators=tailwind,figma --non-interactive
```

This creates:
- `.clafoutis/producer.json` - configuration
- `tokens/` - starter token templates (colors, spacing, typography)
- `.github/workflows/clafoutis-release.yml` - auto-release on push

Edit your tokens, push to main, and a GitHub Release is created automatically.

### For Consumers (Application Teams)

```bash
# Initialize
npx clafoutis init --consumer --repo Acme/design-system

# Sync tokens from the latest release
npx clafoutis sync

# Commit the synced files
git add .clafoutis/ src/tokens/
git commit -m "chore: sync design tokens"
```

### Updating Tokens

```bash
# Check available versions
gh release list -R Acme/design-system

# Update .clafoutis/consumer.json to new version
# Then sync
npx clafoutis sync
```

## Configuration

### Producer (.clafoutis/producer.json)

```json
{
  "tokens": "./tokens",
  "output": "./build",
  "generators": {
    "tailwind": true,
    "figma": true
  }
}
```

### Consumer (.clafoutis/consumer.json)

```json
{
  "repo": "Acme/design-system",
  "version": "v1.2.0",
  "files": {
    "tailwind.base.css": "src/styles/tokens.css",
    "tailwind.config.js": "./tailwind.config.js"
  }
}
```

Use `"version": "latest"` during development to always get the newest release. Pin to a specific tag (e.g., `"v1.2.0"`) for production stability.

## CLI Reference

### `clafoutis init`

Initialize configuration with an interactive wizard, or use flags for CI:

```bash
npx clafoutis init --producer              # Interactive producer setup
npx clafoutis init --consumer --repo X/Y   # Interactive consumer setup
npx clafoutis init --non-interactive       # Skip prompts, use flags/defaults
npx clafoutis init --dry-run               # Preview without writing files
```

### `clafoutis generate`

Transform tokens into platform-specific outputs:

```bash
npx clafoutis generate                     # Use config file
npx clafoutis generate --tailwind --figma  # Specify generators
npx clafoutis generate --dry-run           # Preview output
```

### `clafoutis sync`

Download tokens from a GitHub Release:

```bash
npx clafoutis sync                         # Sync if version changed
npx clafoutis sync --force                 # Re-sync even if cached
npx clafoutis sync --dry-run               # Preview what would sync
```

## Custom Generators

Create platform-specific generators when the built-ins don't fit:

```json
{
  "generators": {
    "tailwind": true,
    "brand-scss": "./generators/brand-scss.ts"
  }
}
```

```typescript
// generators/brand-scss.ts
import type { GeneratorPlugin } from 'clafoutis';

export const generate: GeneratorPlugin = async ({ tokensDir, outputDir, StyleDictionary }) => {
  const sd = new StyleDictionary({
    source: [`${tokensDir}/**/*.json`],
    platforms: {
      scss: {
        transformGroup: 'scss',
        buildPath: `${outputDir}/`,
        files: [{ destination: '_brand.scss', format: 'scss/variables' }],
      },
    },
  });
  await sd.buildAllPlatforms();
};
```

## Private Repositories

Set `CLAFOUTIS_REPO_TOKEN` with a GitHub PAT that has `repo` scope:

```bash
export CLAFOUTIS_REPO_TOKEN=ghp_xxxx
npx clafoutis sync
```

In CI:

```yaml
- run: npx clafoutis sync
  env:
    CLAFOUTIS_REPO_TOKEN: ${{ secrets.DESIGN_SYSTEM_TOKEN }}
```

## Token Format

Clafoutis uses the [Design Tokens Community Group (DTCG)](https://www.designtokens.org/tr/2025.10/) specification:

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#3b82f6"
    }
  },
  "spacing": {
    "sm": {
      "$type": "dimension",
      "$value": "8px"
    }
  }
}
```

## Documentation

- [Distribution Guide](docs/distribution/README.md) - Detailed producer/consumer workflow
- [Tailwind Generator](docs/tailwind/README.md) - Tailwind-specific configuration
- [Figma Generator](docs/figma/README.md) - Figma variables export

## Development

```bash
make init       # Install dependencies
make build-all  # Build all packages
make check-all  # Lint, format, type-check
make test-all   # Run tests
```

## License

BUSL-1.1
