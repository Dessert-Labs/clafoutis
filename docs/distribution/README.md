# Automated Version-Controlled Token Distribution with Clafoutis

Clafoutis provides a GitOps workflow for design token distribution:

- **Producers** define tokens in JSON, run `clafoutis generate`, and publish via GitHub Releases
- **Consumers** pin to a version, run `clafoutis sync`, and commit the output

Tokens are statically cached and version controlled - no runtime dependencies, no build-time network requests (after initial sync).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Producer: Design System Repo                    │
│                                                              │
│  tokens/colors/primitives.json    (source of truth)         │
│           │                                                  │
│           ▼                                                  │
│  npx clafoutis generate           (transform)               │
│           │                                                  │
│           ▼                                                  │
│  build/*                          (platform outputs)        │
│           │                                                  │
│           ▼                                                  │
│  GitHub Release v1.0.0            (distribution)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ versioned, immutable releases
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Consumer: Application Repo                      │
│                                                              │
│  .clafoutis/consumer.json         (version pin)             │
│  { "version": "v1.0.0" }                                    │
│           │                                                  │
│           ▼                                                  │
│  npx clafoutis sync               (download if changed)     │
│           │                                                  │
│           ▼                                                  │
│  src/tokens/*                     (committed to repo)       │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

- **Explicit Version Control**: You decide when to adopt new tokens
- **Static Caching**: Tokens are committed - no network needed for builds
- **Atomic Updates**: Bump version → sync → commit = clean history
- **CI Friendly**: No secrets needed for public repos
- **Reproducible Builds**: Same version = same output, always

---

## For Producers (Design System Maintainers)

### Quick Start

```bash
# Create a new design system repo
mkdir my-design-system && cd my-design-system
git init

# Initialize as producer
npm install -D @clafoutis/cli
npx clafoutis init --producer

# Edit your tokens
# tokens/colors/primitives.json

# Generate outputs
npx clafoutis generate

# Push to GitHub - releases are created automatically
git add . && git commit -m "Initial design system"
git push origin main
```

### Producer Config: .clafoutis/producer.json

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

### Token Format (DTCG Standard)

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#3b82f6"
    },
    "secondary": {
      "$type": "color",
      "$value": "#64748b"
    }
  }
}
```

### CLI: clafoutis generate

```bash
npx clafoutis generate [options]

Options:
  -c, --config <path>  Config file (default: .clafoutis/producer.json)
  --tailwind           Generate Tailwind output
  --figma              Generate Figma variables
  -o, --output <dir>   Output directory (default: ./build)
  --dry-run            Preview changes without writing files
```

### GitHub Releases (How It Works)

When you run `npx clafoutis init --producer`, a GitHub Actions workflow is created at `.github/workflows/clafoutis-release.yml`. This workflow:

1. **Triggers** when you push changes to `tokens/` or `.clafoutis/producer.json`
2. **Runs** `npx clafoutis generate` to create platform outputs
3. **Creates a GitHub Release** with all generated files as assets
4. **Auto-increments** the patch version (e.g., `v1.0.0` → `v1.0.1`)

### Manual Releases & Pre-release Versions

The workflow supports two release modes:

**Automatic releases** (on push to main):
- Triggered when `tokens/**` or `.clafoutis/producer.json` changes
- Auto-increments the patch version based on existing strict semver tags (`vX.Y.Z`)
- Example: `v1.0.2` → `v1.0.3`

**Manual releases** (via workflow_dispatch):
- Triggered manually with any version string you specify
- Supports pre-release versions like `1.0.0-beta.1`, `2.0.0-rc.1`, `1.1.0-alpha`
- Does not affect automatic version detection (only strict `vX.Y.Z` tags are considered for auto-increment)

#### Triggering a Manual Release

**Via GitHub CLI:**

```bash
# Release a beta version
gh workflow run "Generate and Release" -f version=2.0.0-beta.1

# Release a release candidate
gh workflow run "Generate and Release" -f version=2.0.0-rc.1

# Release a specific version (bypassing auto-increment)
gh workflow run "Generate and Release" -f version=1.1.0
```

**Via GitHub UI:**

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Generate and Release** workflow
4. Click **Run workflow** dropdown
5. Enter your version (e.g., `2.0.0-beta.1`)
6. Click **Run workflow**

#### Consumer Usage with Pre-release Versions

Consumers can pin to pre-release versions just like any other version:

```json
{
  "repo": "YourOrg/design-system",
  "version": "v2.0.0-beta.1",
  "files": {
    "tailwind.base.css": "src/styles/base.css"
  }
}
```

This is useful for:
- Testing new design system features before a stable release
- Gradual rollouts across multiple consuming applications
- Beta testing with select teams before wider adoption

**Release assets**: The workflow flattens the build directory structure into dot-separated asset names to avoid filename conflicts.

Example: If your build outputs:
```
build/
├── scss/
│   ├── _colors.scss
│   └── _typography.scss
├── tailwind/
│   ├── base.css
│   └── config.js
└── figma/
    └── tokens.json
```

The release assets will be named:
```
v1.0.0
├── scss._colors.scss
├── scss._typography.scss
├── tailwind.base.css
├── tailwind.config.js
└── figma.tokens.json
```

This prevents conflicts when multiple generators output files with the same name (e.g., `base.css`).

Consumers reference these by their flattened name:
```json
{
  "files": {
    "scss._colors.scss": "src/tokens/_colors.scss",
    "tailwind.config.js": "./tailwind.config.js"
  }
}
```

### Custom Generators

You can create custom generators for your specific platform needs:

```json
{
  "tokens": "./tokens",
  "output": "./build",
  "generators": {
    "tailwind": true,
    "brand-scss": "./generators/brand-scss.ts"
  }
}
```

Custom generators receive the `StyleDictionary` instance:

```typescript
import type { GeneratorPlugin } from 'clafoutis';

export const generate: GeneratorPlugin = async ({ tokensDir, outputDir, StyleDictionary }) => {
  // Register custom transforms
  StyleDictionary.registerTransform({
    name: 'brand/color-hex',
    type: 'value',
    filter: (token) => token.$type === 'color',
    transform: (token) => token.$value,
  });

  // Build
  const sd = new StyleDictionary({
    source: [`${tokensDir}/**/*.json`],
    platforms: {
      scss: {
        transformGroup: 'scss',
        buildPath: outputDir + '/',
        files: [{ destination: '_colors.scss', format: 'scss/variables' }],
      },
    },
  });

  await sd.buildAllPlatforms();
};
```

---

## For Consumers (Application Developers)

### Quick Start

```bash
# In your application repo
npm install -D @clafoutis/cli
npx clafoutis init --consumer --repo YourOrg/design-system

# Edit .clafoutis/consumer.json to set the version you want
# Then sync
npx clafoutis sync

# Commit the synced tokens
git add .clafoutis/ src/tokens/
git commit -m "chore: add design tokens v1.0.0"
```

### Consumer Config: .clafoutis/consumer.json

```json
{
  "repo": "YourOrg/design-system",
  "version": "v1.0.0",
  "files": {
    "_colors.scss": "src/tokens/_colors.scss",
    "_typography.scss": "src/tokens/_typography.scss",
    "tailwind.config.js": "./tailwind.config.js"
  }
}
```

- `files`: Mapping of release asset names to local file paths
  - Key: exact asset filename from the GitHub Release
  - Value: path where the file should be written in your repo

Each file is downloaded and written to its specified location. This allows you to place different files in different directories (e.g., SCSS tokens in `src/tokens/`, Tailwind config in root).

### CLI: clafoutis sync

```bash
npx clafoutis sync [options]

Options:
  -f, --force          Force sync even if versions match
  -c, --config <path>  Config file (default: .clafoutis/consumer.json)
  --dry-run            Preview changes without writing files
```

### Updating to a New Version

```bash
# 1. Check available releases
gh release list -R YourOrg/design-system

# 2. Update .clafoutis/consumer.json
# Change "version" to new tag

# 3. Sync (or just run npm run dev if you have predev hook)
npx clafoutis sync

# 4. Commit
git add .clafoutis/ src/tokens/
git commit -m "chore: update design tokens to v1.1.0"
```

### CI Integration

Add to package.json:

```json
{
  "scripts": {
    "predev": "clafoutis sync",
    "prebuild": "clafoutis sync"
  }
}
```

Add to .gitignore:

```
.clafoutis/cache
```

---

## Configuration Reference

### Producer: .clafoutis/producer.json

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| tokens | string | ./tokens | Directory containing token JSON files |
| output | string | ./build | Output directory for generated files |
| generators | object | all enabled | Which generators to run |

### Consumer: .clafoutis/consumer.json

| Field | Type | Description |
|-------|------|-------------|
| repo | string | GitHub repository (org/name) |
| version | string | Release tag to sync |
| files | object | Mapping of asset names to local file paths |
| postSync | string | Optional command to run after sync |

---

## Private Repositories

For private repositories, set the `CLAFOUTIS_REPO_TOKEN` environment variable with a GitHub classic PAT that has `repo` scope:

```bash
export CLAFOUTIS_REPO_TOKEN=ghp_xxxxxxxxxxxx
npx clafoutis sync
```

In CI, use a secret:

```yaml
- run: npx clafoutis sync
  env:
    CLAFOUTIS_REPO_TOKEN: ${{ secrets.CLAFOUTIS_REPO_TOKEN }}
```

**Note:** GitHub classic PATs are required (not fine-grained tokens). Create one at GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic).

---

## Troubleshooting

### Release not found

```
Error: Release not found
Version v1.0.0 does not exist in YourOrg/design-system

Suggestion: Check available releases: gh release list -R YourOrg/design-system
```

Verify the version exists in your design system repo's releases.

### Authentication required

```
Error: Authentication required
CLAFOUTIS_REPO_TOKEN is required for private repositories

Suggestion: Set the environment variable: export CLAFOUTIS_REPO_TOKEN=ghp_xxx
```

Create a GitHub classic PAT with `repo` scope and set it as `CLAFOUTIS_REPO_TOKEN`.

### Config not found

```
Error: Configuration not found
Could not find .clafoutis/consumer.json

Suggestion: Run: npx clafoutis init --consumer
```

Initialize your project with `npx clafoutis init --consumer`.
