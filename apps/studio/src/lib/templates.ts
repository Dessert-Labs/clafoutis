import type { DTCGTokenFile } from "@clafoutis/studio-core";

export interface TokenTemplate {
  id: string;
  name: string;
  description: string;
  files: Record<string, DTCGTokenFile>;
}

const minimalPrimitives: DTCGTokenFile = {
  colors: {
    white: { $type: "color", $value: "#FFFFFF" },
    black: { $type: "color", $value: "#000000" },
    gray: {
      100: { $type: "color", $value: "#f9fafb" },
      200: { $type: "color", $value: "#f3f4f6" },
      300: { $type: "color", $value: "#d1d5db" },
      400: { $type: "color", $value: "#9ca3af" },
      500: { $type: "color", $value: "#6b7280" },
      600: { $type: "color", $value: "#4b5563" },
      700: { $type: "color", $value: "#374151" },
      800: { $type: "color", $value: "#1f2937" },
      900: { $type: "color", $value: "#111827" },
    },
    blue: {
      100: { $type: "color", $value: "#dbeafe" },
      500: { $type: "color", $value: "#3b82f6" },
      700: { $type: "color", $value: "#1d4ed8" },
      900: { $type: "color", $value: "#1e3a5f" },
    },
    green: {
      100: { $type: "color", $value: "#dcfce7" },
      500: { $type: "color", $value: "#22c55e" },
      700: { $type: "color", $value: "#15803d" },
    },
    red: {
      100: { $type: "color", $value: "#fee2e2" },
      500: { $type: "color", $value: "#ef4444" },
      700: { $type: "color", $value: "#b91c1c" },
    },
  },
};

const minimalSemantics: DTCGTokenFile = {
  colors: {
    background: {
      primary: { $type: "color", $value: "{colors.white}" },
      secondary: { $type: "color", $value: "{colors.gray.100}" },
      inverse: { $type: "color", $value: "{colors.gray.900}" },
    },
    text: {
      primary: { $type: "color", $value: "{colors.gray.900}" },
      secondary: { $type: "color", $value: "{colors.gray.500}" },
      inverse: { $type: "color", $value: "{colors.white}" },
    },
    border: {
      default: { $type: "color", $value: "{colors.gray.300}" },
    },
    accent: {
      default: { $type: "color", $value: "{colors.blue.500}" },
      hover: { $type: "color", $value: "{colors.blue.700}" },
    },
    success: { default: { $type: "color", $value: "{colors.green.500}" } },
    error: { default: { $type: "color", $value: "{colors.red.500}" } },
  },
};

const minimalTypography: DTCGTokenFile = {
  fontFamily: {
    base: { $type: "fontFamily", $value: "Inter, system-ui, sans-serif" },
    heading: { $type: "fontFamily", $value: "Inter, system-ui, sans-serif" },
    mono: { $type: "fontFamily", $value: "JetBrains Mono, monospace" },
  },
  fontSize: {
    xs: { $type: "dimension", $value: "12px" },
    sm: { $type: "dimension", $value: "14px" },
    base: { $type: "dimension", $value: "16px" },
    lg: { $type: "dimension", $value: "18px" },
    xl: { $type: "dimension", $value: "20px" },
    "2xl": { $type: "dimension", $value: "24px" },
    "3xl": { $type: "dimension", $value: "30px" },
  },
};

const minimalDimensions: DTCGTokenFile = {
  spacing: {
    0: { $type: "dimension", $value: "0px" },
    1: { $type: "dimension", $value: "4px" },
    2: { $type: "dimension", $value: "8px" },
    3: { $type: "dimension", $value: "16px" },
    4: { $type: "dimension", $value: "24px" },
    5: { $type: "dimension", $value: "32px" },
    6: { $type: "dimension", $value: "48px" },
  },
  borderRadius: {
    none: { $type: "dimension", $value: "0px" },
    sm: { $type: "dimension", $value: "4px" },
    md: { $type: "dimension", $value: "8px" },
    lg: { $type: "dimension", $value: "12px" },
    full: { $type: "dimension", $value: "9999px" },
  },
};

export const TEMPLATES: TokenTemplate[] = [
  {
    id: "minimal",
    name: "Minimal Starter",
    description:
      "A clean starting point with basic colors, typography, and spacing. Great for new projects.",
    files: {
      "colors/primitives.json": minimalPrimitives,
      "colors/semantics.json": minimalSemantics,
      "typography/base.json": minimalTypography,
      "dimensions/base.json": minimalDimensions,
    },
  },
  {
    id: "empty",
    name: "Blank Canvas",
    description:
      "Start completely from scratch. An empty token file you can build up yourself.",
    files: {
      "tokens.json": {},
    },
  },
];

export function exportTokensAsZip(files: Record<string, DTCGTokenFile>): void {
  const entries = Object.entries(files);
  if (entries.length === 1) {
    const [name, content] = entries[0];
    downloadJSON(name, content);
    return;
  }
  for (const [name, content] of entries) {
    downloadJSON(name, content);
  }
}

function downloadJSON(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replaceAll("/", "_");
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
