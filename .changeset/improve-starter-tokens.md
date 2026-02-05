---
"@clafoutis/cli": minor
---

Restructure starter token templates with proper primitive/semantic separation

**Primitives** (raw color values):
- `colors/primitives.json`: gray, blue, green, red, amber scales (50-900)

**Semantics** (named colors with meaning that reference primitives):
- `colors/semantic.json`: primary→blue, neutral→gray, success→green, warning→amber, error→red, plus background/foreground/border tokens for light mode
- `colors/semantic.dark.json`: dark mode overrides for background/foreground/border

This follows the proper design token architecture where primitives are raw values and semantics provide meaning by referencing primitives.
