---
"@clafoutis/cli": minor
"@clafoutis/generators": minor
"@clafoutis/studio-core": minor
---

Add comprehensive motion timing token support with DTCG-safe primitives.

- Remove misleading `bounce` easing preset from starter motion templates.
- Add `delay` token group (duration-typed) for stagger/choreography primitives.
- Add `string` token support in studio-core validation/types to support timing-function strings like `steps(...)` and `linear(...)`.
- Expand starter easing presets with `steps(...)` and multi-stop `linear(...)` options.
- Map `delay` tokens to Tailwind `transitionDelay` output in generators.
