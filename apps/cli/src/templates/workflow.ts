/**
 * Returns the GitHub Actions workflow YAML for automatic token releases.
 * Triggers on push to main when tokens change, generates outputs, and creates a release.
 */
export function getWorkflowTemplate(): string {
  return `name: Design Token Release

on:
  push:
    branches: [main]
    paths:
      - 'tokens/**'

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Clafoutis
        run: npm install -D @clafoutis/cli

      - name: Generate tokens
        run: npx clafoutis generate

      - name: Get next version
        id: version
        run: |
          LATEST=$(git tag -l 'v*' | grep -E '^v[0-9]+\\.[0-9]+\\.[0-9]+$' | sort -V | tail -n1)
          if [ -z "$LATEST" ]; then
            echo "version=1.0.0" >> $GITHUB_OUTPUT
          else
            VERSION=\${LATEST#v}
            IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"
            PATCH=$((PATCH + 1))
            echo "version=\${MAJOR}.\${MINOR}.\${PATCH}" >> $GITHUB_OUTPUT
          fi

      - name: Prepare release assets
        run: |
          mkdir -p release-assets
          while IFS= read -r -d '' file; do
            relative="\${file#build/}"
            flat_name="\${relative//\\//.}"
            target="release-assets/$flat_name"
            if [ -e "$target" ]; then
              echo "::error::Collision detected: '$relative' flattens to '$flat_name' which already exists"
              exit 1
            fi
            cp "$file" "$target"
          done < <(find build -type f -print0)

      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v\${{ steps.version.outputs.version }}
          name: Design Tokens v\${{ steps.version.outputs.version }}
          generate_release_notes: true
          files: release-assets/*
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
}

/**
 * Returns the standard path for the Clafoutis release workflow.
 */
export function getWorkflowPath(): string {
  return ".github/workflows/clafoutis-release.yml";
}
