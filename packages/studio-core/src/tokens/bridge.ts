import type { Effect, RGBA, SolidPaint } from "../types/nodes";
import type { ResolvedToken } from "../types/tokens";

function hexToRGBA(hex: string): RGBA | null {
  const cleaned = hex.replace("#", "");
  let r: number,
    g: number,
    b: number,
    a = 1;

  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16) / 255;
    g = parseInt(cleaned[1] + cleaned[1], 16) / 255;
    b = parseInt(cleaned[2] + cleaned[2], 16) / 255;
  } else if (cleaned.length === 6) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
  } else if (cleaned.length === 8) {
    r = parseInt(cleaned.slice(0, 2), 16) / 255;
    g = parseInt(cleaned.slice(2, 4), 16) / 255;
    b = parseInt(cleaned.slice(4, 6), 16) / 255;
    a = parseInt(cleaned.slice(6, 8), 16) / 255;
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b) || isNaN(a)) return null;
  return { r, g, b, a };
}

function parseDimension(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;
  const match = value.match(/^([\d.]+)(px|rem|em)?$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const unit = match[2];
  if (unit === "rem" || unit === "em") return num * 16;
  return num;
}

/** Converts a resolved DTCG color token to a SolidPaint. */
export function bridgeColorToPaint(token: ResolvedToken): SolidPaint | null {
  const value = token.resolvedValue;
  if (typeof value !== "string") return null;
  const rgba = hexToRGBA(value);
  if (!rgba) return null;
  return { type: "SOLID", color: rgba };
}

/** Converts a resolved DTCG shadow token to an Effect. */
export function bridgeShadowToEffect(token: ResolvedToken): Effect | null {
  const value = token.resolvedValue;
  if (typeof value !== "object" || value === null) return null;
  const shadow = value as Record<string, unknown>;

  const color =
    typeof shadow.color === "string" ? hexToRGBA(shadow.color) : null;
  const offsetX =
    parseDimension(shadow.offsetX) ?? parseDimension(shadow.x) ?? 0;
  const offsetY =
    parseDimension(shadow.offsetY) ?? parseDimension(shadow.y) ?? 0;
  const blur = parseDimension(shadow.blur) ?? 0;
  const spread = parseDimension(shadow.spread) ?? 0;

  return {
    type: "DROP_SHADOW",
    color: color || { r: 0, g: 0, b: 0, a: 0.25 },
    offset: { x: offsetX, y: offsetY },
    radius: blur,
    spread,
    visible: true,
  };
}

/** Converts a resolved DTCG dimension token to a numeric value. */
export function bridgeDimensionToNumber(token: ResolvedToken): number | null {
  return parseDimension(token.resolvedValue);
}

/** Converts a resolved DTCG fontFamily token to a string. */
export function bridgeFontFamily(token: ResolvedToken): string | null {
  const value = token.resolvedValue;
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return String(value[0]);
  return null;
}

/** Converts a resolved DTCG fontWeight token to a number. */
export function bridgeFontWeight(token: ResolvedToken): number | null {
  const value = token.resolvedValue;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/** Dispatches to the appropriate bridge function based on token type. */
export function bridgeTokenToCanvas(
  token: ResolvedToken,
): SolidPaint | Effect | number | string | null {
  switch (token.type) {
    case "color":
      return bridgeColorToPaint(token);
    case "shadow":
      return bridgeShadowToEffect(token);
    case "dimension":
    case "number":
      return bridgeDimensionToNumber(token);
    case "fontFamily":
      return bridgeFontFamily(token);
    case "fontWeight":
      return bridgeFontWeight(token);
    default:
      return null;
  }
}
