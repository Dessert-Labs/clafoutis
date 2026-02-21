---
"@clafoutis/cli": patch
"@clafoutis/generators": patch
---

Fix generator cwd handling so `clafoutis generate --cwd <path>` always reads tokens and writes output relative to the provided working directory instead of the process root.

Update the default starter badge tokens to use semantic state colors (info/success/warning/error) rather than slate-heavy values, improving out-of-the-box badge appearance.
