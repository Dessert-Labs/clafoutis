---
"@clafoutis/generators": minor
"@clafoutis/cli": minor
---

Add first-class motion token support (duration and cubicBezier).

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
