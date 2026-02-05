---
"@clafoutis/cli": patch
---

Fix broken GitHub workflow template: change package name from `clafoutis` to `@clafoutis/cli`

The generated workflow was failing in CI because `clafoutis` doesn't exist on npm - the correct package name is `@clafoutis/cli`.
