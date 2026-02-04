# Clafoutis - GitOps powered Design System Generator 🚀

Clafoutis is a powerful, automated design system generator that transforms your design tokens into production-ready code across multiple platforms.

Built on the [Design Tokens Community Group (DTCG) specification](https://tr.designtokens.org/), Clafoutis ensures your design system remains vendor-agnostic while maintaining industry standards.

## Why Clafoutis? 🤔

In today's AI-powered development environment, maintaining brand consistency between design and code at scale is crucial. Clafoutis bridges this gap by:

- **GitOps-First Approach**: Treat your design tokens like infrastructure code - version controlled, reviewable, and deployable
- **Industry Standard Compliant**: Built on the DTCG specification, ensuring your tokens are future-proof and portable
- **Multi-Platform Support**: Generate code for both design and development platforms from a single source of truth
- **Automated Workflows**: Reduce manual work and eliminate human error in token distribution

## Key Features ✨

- **Single Source of Truth**: Define your design tokens once, deploy everywhere
- **GitOps Integration**: Version control your design system alongside your codebase
- **Realtime Generation**: Transform tokens into platform-specific formats automatically
- **Recommended Starting Design Tokens**: We will be building a 'recommended' design token schema, allowing developers and designers to build their own design system from Day 1. See /tokens/\*.
- **Version-Controlled Distribution**: Pin to specific versions for reproducible builds
- **Custom Generators**: Create platform-specific generators with full StyleDictionary access

## Supported Platforms 🎯

### Design Tools

- **Figma**: Generate variables and styles directly in your Figma files
  - [Documentation](./docs/figma/README.md)

### Development Frameworks

- **React/Tailwind**: Generate Tailwind configuration and React components
  - [Documentation](./docs/tailwind/README.md)

## Getting Started 🚀

### Installation

```bash
npm install -D clafoutis
```

### For Design System Producers

```bash
# Initialize a new design system
npx clafoutis init --producer

# Edit your tokens in tokens/colors/primitives.json

# Generate platform outputs
npx clafoutis generate

# Push to GitHub - releases are created automatically
```

### For Application Consumers

```bash
# Initialize consumer configuration
npx clafoutis init --consumer --repo YourOrg/design-system

# Edit .clafoutis/consumer.json to set your desired version

# Sync tokens from GitHub Release
npx clafoutis sync

# Commit the synced tokens
git add .clafoutis/ src/tokens/
git commit -m "chore: add design tokens"
```

## CLI Commands 💻

### `clafoutis generate`

Generate platform outputs from design tokens (for producers).

```bash
npx clafoutis generate [options]

Options:
  -c, --config <path>  Config file (default: .clafoutis/producer.json)
  --tailwind           Generate Tailwind output
  --figma              Generate Figma variables
  -o, --output <dir>   Output directory (default: ./build)
  --dry-run            Preview changes without writing files
```

### `clafoutis sync`

Sync design tokens from a GitHub Release (for consumers).

```bash
npx clafoutis sync [options]

Options:
  -f, --force          Force sync even if versions match
  -c, --config <path>  Config file (default: .clafoutis/consumer.json)
  --dry-run            Preview changes without writing files
```

### `clafoutis init`

Initialize Clafoutis configuration.

```bash
npx clafoutis init [options]

Options:
  --producer           Set up as a design token producer
  --consumer           Set up as a design token consumer
  -r, --repo <repo>    GitHub repo for consumer mode (org/name)
```

## Configuration ⚙️

### Producer Configuration (.clafoutis/producer.json)

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

### Consumer Configuration (.clafoutis/consumer.json)

```json
{
  "repo": "YourOrg/design-system",
  "version": "v1.0.0",
  "files": {
    "scss._colors.scss": "src/tokens/_colors.scss",
    "scss._typography.scss": "src/tokens/_typography.scss",
    "tailwind.config.js": "./tailwind.config.js"
  }
}
```

- `repo`: GitHub repository in `org/name` format
- `version`: Release tag to sync (e.g., `v1.0.0`)
- `files`: Mapping of release asset names to local file paths

Asset names are flattened from the build directory (e.g., `build/scss/_colors.scss` becomes `scss._colors.scss`).

## Custom Generators 🔧

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

Custom generators are TypeScript files that export a `generate` function:

```typescript
import type { GeneratorPlugin } from 'clafoutis';

export const generate: GeneratorPlugin = async ({ tokensDir, outputDir, StyleDictionary }) => {
  // Use StyleDictionary to transform tokens
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

## Project Structure 📁

```
clafoutis/
├── apps/
│   └── cli/              # Main CLI package
├── packages/
│   ├── eslint-config/    # Shared ESLint config
│   ├── prettier-config/  # Shared Prettier config
│   ├── shared/           # Shared utilities (logger)
│   ├── vitest-config/    # Shared Vitest config
│   └── generators/       # Token generators
├── docs/                 # Documentation
├── examples/             # Example configs and workflows
├── schemas/              # JSON schemas
├── tokens/               # Example design tokens
└── Makefile              # Development commands
```

## Documentation 📚

- [Token Distribution Guide](docs/distribution/README.md) - Complete guide for producers and consumers

## Development 🛠️

```bash
# Install dependencies
make init

# Build all packages
make build-all

# Run all checks (lint, format, type-check)
make check-all

# Fix all issues (lint, format)
make fix-all

# Run tests
make test-all
```

## Why GitOps? 🔄

GitOps has revolutionized how we manage infrastructure. We're bringing the same principles to design systems:

- **Version Control**: Track changes to your design system over time
- **Review Process**: Implement design changes through pull requests
- **Automated Deployments**: Deploy design updates with confidence
- **Audit Trail**: Maintain a clear history of design decisions
- **Collaboration**: Enable better collaboration between designers and developers

## Contributing 🤝

We welcome contributions! Whether it's adding support for new platforms, improving documentation, or fixing bugs, your help makes Clafoutis better for everyone

---

Built with ❤️ by the Dessert team.
