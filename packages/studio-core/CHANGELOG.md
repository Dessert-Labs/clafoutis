# @clafoutis/studio-core

## 1.1.0

### Minor Changes

- 821c92d: Add comprehensive motion timing token support with DTCG-safe primitives.
  - Remove misleading `bounce` easing preset from starter motion templates.
  - Add `delay` token group (duration-typed) for stagger/choreography primitives.
  - Add `string` token support in studio-core validation/types to support timing-function strings like `steps(...)` and `linear(...)`.
  - Expand starter easing presets with `steps(...)` and multi-stop `linear(...)` options.
  - Map `delay` tokens to Tailwind `transitionDelay` output in generators.
