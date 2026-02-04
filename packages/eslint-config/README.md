# @clafoutis/eslint-config

Shared ESLint configuration for the Clafoutis monorepo.

## Usage

In your package, create `.eslintrc.cjs`:

```js
module.exports = {
  extends: ["@clafoutis/eslint-config"],
  env: {
    node: true, // or browser: true
    es2022: true,
  },
  rules: {
    // Additional rules specific to your package
  },
};
```

## Features

- TypeScript support with `@typescript-eslint`
- Automatic import sorting with `simple-import-sort`
- Unused imports cleanup with `unused-imports`
- Prettier compatibility
- Sensible defaults for ES2022+

## Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "lint:check": "eslint .",
    "lint:write": "eslint . --fix"
  }
}
```
