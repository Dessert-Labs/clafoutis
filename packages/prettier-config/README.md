# @clafoutis/prettier-config

Shared Prettier configuration for the Clafoutis monorepo.

## Usage

In your package's `package.json`:

```json
{
  "prettier": "@clafoutis/prettier-config"
}
```

Or create `.prettierrc.js`:

```js
module.exports = require('@clafoutis/prettier-config');
```

## Configuration

Copy `.prettierignore.example` to `.prettierignore` in your package and customize as needed.

## Features

- Single quotes
- 2-space indentation
- 80 character line width
- Semicolons enabled
- Trailing commas (ES5)

## Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "format:check": "prettier --check .",
    "format:write": "prettier --write ."
  }
}
```
