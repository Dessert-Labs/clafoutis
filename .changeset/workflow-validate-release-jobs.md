---
"@clafoutis/cli": patch
---

Fix producer workflow template to validate on PRs and release on push.

Restores the two-job `validate` + `release` structure so token format and
generation are checked on pull requests without cutting a release, while
`release` (gated on `validate`) runs only on push to main. Adds
`workflow_dispatch` so releases can be triggered manually without a token
file change. Fixes a bug where the `release` job was missing the
`generate` step, causing releases to be created with no assets attached.
