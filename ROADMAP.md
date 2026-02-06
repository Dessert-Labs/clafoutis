# Clafoutis Roadmap

## Screenshot-to-Tokens

Companies or developers upload a screenshot of their existing software, and the system automatically extracts colors, typography, and spacing to generate a DTCG-compliant design token set -- or maps the extracted values to conform to an existing token spec. This bridges the gap between "we have a live product but no formal design system" and "we want token-driven consistency."

Key capabilities:
- Color extraction from UI screenshots (dominant colors, accent detection, text/background pairs)
- Typography inference (font size ratios, weight distribution)
- Spacing pattern detection (grid, padding, margin consistency)
- Output as a ready-to-use Clafoutis token set or a diff against an existing set

## Component Library (Clafoutis UI)

A first-party component library -- similar to shadcn/ui -- that ships opinionated defaults built on Clafoutis design tokens and works natively with the Studio editor. Developers get a complete, token-driven component system out of the box while retaining full ownership of their design system.

Key capabilities:
- CLI scaffold: `npx clafoutis create-app` initialises a Vite + React app with the component library pre-wired
- Components (Button, Card, Input, Alert, Badge, etc.) use CSS custom properties generated from tokens
- Fully compatible with the Studio: edit tokens visually, see components update in real time
- Users own and can extend the design system freely -- the defaults are just a starting point

## Token Configurator in Studio

Within the Components tab of the Studio, users can interactively swap tokens used by each component preview. For example, select a Button, override its `--colors-button-primary-bg` token, and see the change reflected live. This makes the Studio a true design playground rather than a read-only viewer.

Key capabilities:
- Per-component token override panel
- Live preview of overrides before committing to the token files
- Ability to save overrides as new token values or new theme variants

## Monetisation

- SSO (SAML, OIDC) for enterprise teams
- Business subscriptions with team management (multi-user, role-based access)
- Private repo access tiers
- Hosted Studio instances with custom domains
- Premium generators (Figma plugin sync, iOS/Android codegen)
