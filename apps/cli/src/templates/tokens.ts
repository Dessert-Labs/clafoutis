/**
 * Starter color primitives with a complete palette.
 * Includes primary, neutral, and semantic colors.
 */
export const colorPrimitives = {
  color: {
    primary: {
      50: { $value: '#eff6ff' },
      100: { $value: '#dbeafe' },
      200: { $value: '#bfdbfe' },
      300: { $value: '#93c5fd' },
      400: { $value: '#60a5fa' },
      500: { $value: '#3b82f6' },
      600: { $value: '#2563eb' },
      700: { $value: '#1d4ed8' },
      800: { $value: '#1e40af' },
      900: { $value: '#1e3a8a' },
    },
    neutral: {
      50: { $value: '#fafafa' },
      100: { $value: '#f5f5f5' },
      200: { $value: '#e5e5e5' },
      300: { $value: '#d4d4d4' },
      400: { $value: '#a3a3a3' },
      500: { $value: '#737373' },
      600: { $value: '#525252' },
      700: { $value: '#404040' },
      800: { $value: '#262626' },
      900: { $value: '#171717' },
    },
    success: {
      500: { $value: '#22c55e' },
    },
    warning: {
      500: { $value: '#f59e0b' },
    },
    error: {
      500: { $value: '#ef4444' },
    },
  },
};

/**
 * Dark mode color overrides.
 * Uses the `.dark.json` suffix so the Figma generator places these in the Dark collection.
 * Semantic colors reference the inverted neutral scale for proper dark mode contrast.
 */
export const colorDarkPrimitives = {
  color: {
    // Background colors - use lighter neutrals in dark mode
    background: {
      default: { $value: '{color.neutral.900}' },
      subtle: { $value: '{color.neutral.800}' },
      muted: { $value: '{color.neutral.700}' },
    },
    // Foreground/text colors - use darker neutrals (which are lighter) in dark mode
    foreground: {
      default: { $value: '{color.neutral.50}' },
      muted: { $value: '{color.neutral.400}' },
      subtle: { $value: '{color.neutral.500}' },
    },
    // Border colors
    border: {
      default: { $value: '{color.neutral.700}' },
      muted: { $value: '{color.neutral.800}' },
    },
  },
};

/**
 * Starter spacing scale following a 4px base grid.
 * Values use rem for accessibility (respects user font size preferences).
 */
export const spacingPrimitives = {
  spacing: {
    0: { $value: '0' },
    1: { $value: '0.25rem' },
    2: { $value: '0.5rem' },
    3: { $value: '0.75rem' },
    4: { $value: '1rem' },
    5: { $value: '1.25rem' },
    6: { $value: '1.5rem' },
    8: { $value: '2rem' },
    10: { $value: '2.5rem' },
    12: { $value: '3rem' },
    16: { $value: '4rem' },
    20: { $value: '5rem' },
    24: { $value: '6rem' },
  },
};

/**
 * Starter typography tokens including font families, sizes, weights, and line heights.
 * Uses system font stacks for optimal performance and native feel.
 */
export const typographyPrimitives = {
  fontFamily: {
    sans: { $value: 'ui-sans-serif, system-ui, sans-serif' },
    serif: { $value: 'ui-serif, Georgia, serif' },
    mono: { $value: 'ui-monospace, monospace' },
  },
  fontSize: {
    xs: { $value: '0.75rem' },
    sm: { $value: '0.875rem' },
    base: { $value: '1rem' },
    lg: { $value: '1.125rem' },
    xl: { $value: '1.25rem' },
    '2xl': { $value: '1.5rem' },
    '3xl': { $value: '1.875rem' },
    '4xl': { $value: '2.25rem' },
  },
  fontWeight: {
    normal: { $value: '400' },
    medium: { $value: '500' },
    semibold: { $value: '600' },
    bold: { $value: '700' },
  },
  lineHeight: {
    tight: { $value: '1.25' },
    normal: { $value: '1.5' },
    relaxed: { $value: '1.75' },
  },
};

/**
 * Map of all starter token files to their content.
 * Keys are relative paths within the tokens directory.
 * Note: `.dark.json` suffix is required for dark mode tokens to be recognized by generators.
 */
export const starterTokens = {
  'colors/primitives.json': colorPrimitives,
  'colors/primitives.dark.json': colorDarkPrimitives,
  'spacing/primitives.json': spacingPrimitives,
  'typography/primitives.json': typographyPrimitives,
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
  return JSON.stringify(tokens, null, 2) + '\n';
}

/**
 * Returns all starter token files with their paths and JSON content.
 * Used during producer init to create the initial token structure.
 */
export function getAllStarterTokens(): Array<{
  path: string;
  content: string;
}> {
  return Object.keys(starterTokens).map(fileName => ({
    path: fileName,
    content: getStarterTokenContent(fileName),
  }));
}
