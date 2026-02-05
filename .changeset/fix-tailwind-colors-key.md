---
"@clafoutis/generators": patch
---

Fix Tailwind generator outputting `color` instead of `colors` in theme.extend

The generator was putting color tokens under `theme.extend.color` but Tailwind expects `theme.extend.colors`. This prevented using Tailwind utility classes like `bg-primary-500` or `text-neutral-900`.
