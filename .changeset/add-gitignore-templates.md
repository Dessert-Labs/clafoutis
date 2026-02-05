---
"@clafoutis/cli": patch
---

Add .gitignore templates to init command

- Producer repos: ignore `node_modules/`, `build/`, and `release-assets/`
- Consumer repos: ignore `.clafoutis/cache`

This prevents accidentally committing generated files that cause CI workflow failures.
