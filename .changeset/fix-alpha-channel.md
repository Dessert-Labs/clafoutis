---
"@clafoutis/generators": patch
"@clafoutis/cli": patch
---

**generators:** Fix color/spaceRGB transform to preserve alpha channel. Transparent and rgba color values were being output as solid black (0 0 0) because the alpha component was silently dropped. Now outputs modern CSS `r g b / a` syntax (e.g., `0 0 0 / 0` for transparent, `0 0 0 / 0.5` for semi-transparent overlays).

**cli:** Redesign default token templates with a comprehensive color system featuring 30 color scales with light and dark variants, expanded semantic tokens (overlays, disabled states, focus rings, feedback states), and component-level tokens for all standard UI components. Token templates restructured from inline definitions to separate JSON files.
