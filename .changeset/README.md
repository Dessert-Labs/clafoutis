# Changesets

This folder contains changesets that describe changes to published packages. Changesets are used to version packages and generate changelogs automatically.

## Adding a Changeset

Create a markdown file in this directory with the following format:

```markdown
---
"@clafoutis/cli": minor
---

Brief description of the change.
```

The frontmatter specifies which package(s) are affected and the version bump type. The body describes what changed.

## Semantic Versioning Guide

Choose the correct bump type based on the nature of your change:

| Type | When to use | Examples |
|------|-------------|----------|
| `major` | Breaking changes | Removed public API, changed behavior incompatibly |
| `minor` | New features | New command, new flag, new generator |
| `patch` | Bug fixes | Fixed crash, corrected output, documentation fix |

## Changeset Examples

### Single Package

```markdown
---
"@clafoutis/cli": patch
---

Fix config validation to correctly handle nested generator options.
```

### Multiple Packages

When changes affect multiple packages, list them all:

```markdown
---
"@clafoutis/cli": minor
"@clafoutis/generators": minor
---

Add Figma generator with variable export support.
```

### Breaking Change

```markdown
---
"@clafoutis/cli": major
---

Remove deprecated `--css` generator flag. Use `--tailwind` instead.
```

## Package Names

Use the exact npm package names in changesets:

| Package | Name |
|---------|------|
| CLI | `@clafoutis/cli` |
| Generators | `@clafoutis/generators` |

Internal packages are ignored and don't need changesets:
- `@clafoutis/eslint-config`
- `@clafoutis/prettier-config`
- `@clafoutis/shared`
- `@clafoutis/vitest-config`

## What NOT to Include

- Internal refactoring that doesn't affect users (no changeset needed)
- Changes to dev dependencies only (no changeset needed)
- Changes to ignored internal packages (no changeset needed)

## How the Release Bot Works

When changes with changesets are merged to `main`:

1. The release bot detects pending changesets
2. Creates a "Version Packages" PR that:
   - Bumps package versions based on changeset types
   - Updates CHANGELOG.md with all changes
   - Removes consumed changeset files
3. When the "Version Packages" PR is merged:
   - Packages are automatically published to npm
   - Git tags are created for each release
