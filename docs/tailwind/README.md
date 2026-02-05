# Integrating Clafoutis with Tailwind CSS

This guide covers how to integrate design tokens from a Clafoutis-powered design system into your Tailwind CSS project.

## Generated Artifacts

When a design system uses Clafoutis with the Tailwind generator, it produces:

| File | Description |
|------|-------------|
| `base.css` | Global (light/base) CSS variables |
| `dark.css` | Dark-mode CSS variables (`.dark` selector) |
| `index.css` | Imports base + dark CSS, plus Tailwind layers |
| `tailwind.base.js` | Partial Tailwind config with tokens |
| `tailwind.config.js` | Complete config that extends `tailwind.base.js` |

---

## Method 1: Using Clafoutis CLI (Recommended)

The easiest way to integrate tokens is using the Clafoutis CLI to sync from GitHub Releases.

### Setup

```bash
# Install Clafoutis
npm install -D @clafoutis/cli

# Initialize consumer config
npx clafoutis init --consumer --repo YourOrg/design-system
```

### Configure `.clafoutis/consumer.json`

```json
{
  "repo": "YourOrg/design-system",
  "version": "v1.0.0",
  "files": {
    "tailwind.base.css": "src/styles/base.css",
    "tailwind.dark.css": "src/styles/dark.css",
    "tailwind.index.css": "src/styles/index.css",
    "tailwind.tailwind.base.js": "./tailwind.base.js",
    "tailwind.tailwind.config.js": "./tailwind.config.js"
  }
}
```

### Sync Tokens

```bash
npx clafoutis sync
```

### Auto-sync (Optional)

Add to `package.json` to sync before dev/build:

```json
{
  "scripts": {
    "predev": "clafoutis sync",
    "prebuild": "clafoutis sync"
  }
}
```

### Updating Versions

```bash
# Check available releases
gh release list -R YourOrg/design-system

# Update version in .clafoutis/consumer.json, then:
npx clafoutis sync

# Commit the changes
git add .clafoutis/ src/styles/ tailwind.base.js
git commit -m "chore: update design tokens to v1.1.0"
```

---

## Method 2: Manual Download (Alternative)

If you prefer not to use the CLI, you can manually download files from GitHub Releases or use curl.

### Using curl

Add a download script to `package.json`:

```json
{
  "scripts": {
    "download:tokens": "curl -L 'https://github.com/YourOrg/design-system/releases/download/v1.0.0/tailwind.base.css' -o 'src/styles/base.css' && curl -L 'https://github.com/YourOrg/design-system/releases/download/v1.0.0/tailwind.tailwind.base.js' -o 'tailwind.base.js'",
    "build": "npm run download:tokens && vite build"
  }
}
```

### Manual Copy

1. Go to your design system's GitHub Releases page
2. Download the Tailwind artifacts from the latest release
3. Copy them to the appropriate locations in your project

---

## Project Structure

After syncing, your project should look like:

```
my-project/
├── src/
│   └── styles/
│       ├── base.css           # Light mode CSS variables
│       ├── dark.css           # Dark mode CSS variables
│       └── index.css          # Main entry (imports base + dark + Tailwind)
├── tailwind.base.js           # Token-generated Tailwind config
├── tailwind.config.js         # Main Tailwind config (extends base)
├── .clafoutis/
│   └── consumer.json          # Clafoutis config
└── ...
```

---

## Tailwind Configuration

The `tailwind.config.js` imports and extends `tailwind.base.js`:

```javascript
import base from "./tailwind.base.js";

export default {
  darkMode: base.darkMode,
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    ...base.theme,
    extend: {
      ...(base.theme?.extend || {}),
      // Add your custom extensions here
    },
  },
  plugins: [
    // Add plugins here
  ],
};
```

---

## Dark Mode

The design system uses Tailwind's `class` strategy for dark mode:

```html
<!-- Light mode (default) -->
<html>
  <body class="bg-background text-foreground">...</body>
</html>

<!-- Dark mode -->
<html class="dark">
  <body class="bg-background text-foreground">...</body>
</html>
```

Toggle programmatically:

```javascript
document.documentElement.classList.toggle('dark');
```

---

## Customizing Tokens

You can extend the base tokens in your `tailwind.config.js`:

```javascript
import base from "./tailwind.base.js";

export default {
  // ... base config
  theme: {
    ...base.theme,
    extend: {
      ...(base.theme?.extend || {}),
      colors: {
        ...(base.theme?.extend?.colors || {}),
        // Add custom colors
        "brand-accent": "#A855F7",
      },
    },
  },
};
```

---

## Ignoring Generated Files in Linters

Add to `.prettierignore`:

```
src/styles/base.css
src/styles/dark.css
tailwind.base.js
```

Add to `.eslintignore`:

```
tailwind.base.js
```

---

## Troubleshooting

### Tokens not updating?

1. Check your version in `.clafoutis/consumer.json`
2. Run `npx clafoutis sync --force` to re-download
3. Verify the release exists: `gh release list -R YourOrg/design-system`

### CSS variables not working?

Ensure `index.css` (or `base.css`) is imported in your app's entry point:

```javascript
// main.js or App.jsx
import './styles/index.css';
```

---

## Additional Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Clafoutis Distribution Guide](../distribution/README.md)
- [Style Dictionary Documentation](https://amzn.github.io/style-dictionary/)
