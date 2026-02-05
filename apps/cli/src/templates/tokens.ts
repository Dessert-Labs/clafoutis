/**
 * Color primitives - raw color scales without semantic meaning.
 * These are the base colors that semantic tokens reference.
 * Using Radix-style naming: blue, gray, green, red, amber, etc.
 */
export const colorPrimitives = {
  color: {
    gray: {
      50: { $value: "#fafafa" },
      100: { $value: "#f5f5f5" },
      200: { $value: "#e5e5e5" },
      300: { $value: "#d4d4d4" },
      400: { $value: "#a3a3a3" },
      500: { $value: "#737373" },
      600: { $value: "#525252" },
      700: { $value: "#404040" },
      800: { $value: "#262626" },
      900: { $value: "#171717" },
    },
    blue: {
      50: { $value: "#eff6ff" },
      100: { $value: "#dbeafe" },
      200: { $value: "#bfdbfe" },
      300: { $value: "#93c5fd" },
      400: { $value: "#60a5fa" },
      500: { $value: "#3b82f6" },
      600: { $value: "#2563eb" },
      700: { $value: "#1d4ed8" },
      800: { $value: "#1e40af" },
      900: { $value: "#1e3a8a" },
    },
    green: {
      50: { $value: "#f0fdf4" },
      100: { $value: "#dcfce7" },
      200: { $value: "#bbf7d0" },
      300: { $value: "#86efac" },
      400: { $value: "#4ade80" },
      500: { $value: "#22c55e" },
      600: { $value: "#16a34a" },
      700: { $value: "#15803d" },
      800: { $value: "#166534" },
      900: { $value: "#14532d" },
    },
    red: {
      50: { $value: "#fef2f2" },
      100: { $value: "#fee2e2" },
      200: { $value: "#fecaca" },
      300: { $value: "#fca5a5" },
      400: { $value: "#f87171" },
      500: { $value: "#ef4444" },
      600: { $value: "#dc2626" },
      700: { $value: "#b91c1c" },
      800: { $value: "#991b1b" },
      900: { $value: "#7f1d1d" },
    },
    amber: {
      50: { $value: "#fffbeb" },
      100: { $value: "#fef3c7" },
      200: { $value: "#fde68a" },
      300: { $value: "#fcd34d" },
      400: { $value: "#fbbf24" },
      500: { $value: "#f59e0b" },
      600: { $value: "#d97706" },
      700: { $value: "#b45309" },
      800: { $value: "#92400e" },
      900: { $value: "#78350f" },
    },
  },
};

/**
 * Semantic color tokens - colors with meaning that reference primitives.
 * These provide consistent naming for UI patterns across light/dark modes.
 */
export const colorSemantics = {
  color: {
    primary: {
      50: { $value: "{color.blue.50}" },
      100: { $value: "{color.blue.100}" },
      200: { $value: "{color.blue.200}" },
      300: { $value: "{color.blue.300}" },
      400: { $value: "{color.blue.400}" },
      500: { $value: "{color.blue.500}" },
      600: { $value: "{color.blue.600}" },
      700: { $value: "{color.blue.700}" },
      800: { $value: "{color.blue.800}" },
      900: { $value: "{color.blue.900}" },
    },
    neutral: {
      50: { $value: "{color.gray.50}" },
      100: { $value: "{color.gray.100}" },
      200: { $value: "{color.gray.200}" },
      300: { $value: "{color.gray.300}" },
      400: { $value: "{color.gray.400}" },
      500: { $value: "{color.gray.500}" },
      600: { $value: "{color.gray.600}" },
      700: { $value: "{color.gray.700}" },
      800: { $value: "{color.gray.800}" },
      900: { $value: "{color.gray.900}" },
    },
    success: {
      50: { $value: "{color.green.50}" },
      100: { $value: "{color.green.100}" },
      200: { $value: "{color.green.200}" },
      300: { $value: "{color.green.300}" },
      400: { $value: "{color.green.400}" },
      500: { $value: "{color.green.500}" },
      600: { $value: "{color.green.600}" },
      700: { $value: "{color.green.700}" },
      800: { $value: "{color.green.800}" },
      900: { $value: "{color.green.900}" },
    },
    warning: {
      50: { $value: "{color.amber.50}" },
      100: { $value: "{color.amber.100}" },
      200: { $value: "{color.amber.200}" },
      300: { $value: "{color.amber.300}" },
      400: { $value: "{color.amber.400}" },
      500: { $value: "{color.amber.500}" },
      600: { $value: "{color.amber.600}" },
      700: { $value: "{color.amber.700}" },
      800: { $value: "{color.amber.800}" },
      900: { $value: "{color.amber.900}" },
    },
    error: {
      50: { $value: "{color.red.50}" },
      100: { $value: "{color.red.100}" },
      200: { $value: "{color.red.200}" },
      300: { $value: "{color.red.300}" },
      400: { $value: "{color.red.400}" },
      500: { $value: "{color.red.500}" },
      600: { $value: "{color.red.600}" },
      700: { $value: "{color.red.700}" },
      800: { $value: "{color.red.800}" },
      900: { $value: "{color.red.900}" },
    },
    background: {
      default: { $value: "{color.gray.50}" },
      subtle: { $value: "{color.gray.100}" },
      muted: { $value: "{color.gray.200}" },
    },
    foreground: {
      default: { $value: "{color.gray.900}" },
      muted: { $value: "{color.gray.600}" },
      subtle: { $value: "{color.gray.500}" },
    },
    border: {
      default: { $value: "{color.gray.200}" },
      muted: { $value: "{color.gray.100}" },
    },
  },
};

/**
 * Dark mode semantic token overrides.
 * Only includes tokens that differ in dark mode (surface, text, border).
 * Uses the `.dark.json` suffix so generators apply these in dark mode.
 */
export const colorSemanticsDark = {
  color: {
    background: {
      default: { $value: "{color.gray.900}" },
      subtle: { $value: "{color.gray.800}" },
      muted: { $value: "{color.gray.700}" },
    },
    foreground: {
      default: { $value: "{color.gray.50}" },
      muted: { $value: "{color.gray.400}" },
      subtle: { $value: "{color.gray.500}" },
    },
    border: {
      default: { $value: "{color.gray.700}" },
      muted: { $value: "{color.gray.800}" },
    },
  },
};

/**
 * Starter spacing scale following a 4px base grid.
 * Values use rem for accessibility (respects user font size preferences).
 */
export const spacingPrimitives = {
  spacing: {
    0: { $value: "0" },
    1: { $value: "0.25rem" },
    2: { $value: "0.5rem" },
    3: { $value: "0.75rem" },
    4: { $value: "1rem" },
    5: { $value: "1.25rem" },
    6: { $value: "1.5rem" },
    8: { $value: "2rem" },
    10: { $value: "2.5rem" },
    12: { $value: "3rem" },
    16: { $value: "4rem" },
    20: { $value: "5rem" },
    24: { $value: "6rem" },
  },
};

/**
 * Starter typography tokens including font families, sizes, weights, and line heights.
 * Uses system font stacks for optimal performance and native feel.
 */
export const typographyPrimitives = {
  fontFamily: {
    sans: { $value: "ui-sans-serif, system-ui, sans-serif" },
    serif: { $value: "ui-serif, Georgia, serif" },
    mono: { $value: "ui-monospace, monospace" },
  },
  fontSize: {
    xs: { $value: "0.75rem" },
    sm: { $value: "0.875rem" },
    base: { $value: "1rem" },
    lg: { $value: "1.125rem" },
    xl: { $value: "1.25rem" },
    "2xl": { $value: "1.5rem" },
    "3xl": { $value: "1.875rem" },
    "4xl": { $value: "2.25rem" },
  },
  fontWeight: {
    normal: { $value: "400" },
    medium: { $value: "500" },
    semibold: { $value: "600" },
    bold: { $value: "700" },
  },
  lineHeight: {
    tight: { $value: "1.25" },
    normal: { $value: "1.5" },
    relaxed: { $value: "1.75" },
  },
};

/**
 * Map of all starter token files to their content.
 * Keys are relative paths within the tokens directory.
 *
 * Structure:
 * - primitives.json: Raw color values (gray, blue, green, red, amber)
 * - semantic.json: Named colors with meaning (primary, neutral, success, warning, error, background, foreground, border)
 * - semantic.dark.json: Dark mode overrides for surface/text/border colors
 */
export const starterTokens = {
  "colors/primitives.json": colorPrimitives,
  "colors/semantic.json": colorSemantics,
  "colors/semantic.dark.json": colorSemanticsDark,
  "spacing/primitives.json": spacingPrimitives,
  "typography/primitives.json": typographyPrimitives,
};

/**
 * Returns the JSON content for a starter token file.
 * @throws Error if fileName is not a known starter token file.
 */
export function getStarterTokenContent(fileName: string): string {
  const tokens = starterTokens[fileName as keyof typeof starterTokens];
  if (!tokens) {
    throw new Error(`Unknown starter token file: ${fileName}`);
  }
  return JSON.stringify(tokens, null, 2) + "\n";
}

/**
 * Returns all starter token files with their paths and JSON content.
 * Used during producer init to create the initial token structure.
 */
export function getAllStarterTokens(): Array<{
  path: string;
  content: string;
}> {
  return Object.keys(starterTokens).map((fileName) => ({
    path: fileName,
    content: getStarterTokenContent(fileName),
  }));
}
