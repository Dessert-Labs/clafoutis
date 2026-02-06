import tinycolor from "tinycolor2";
import { describe, expect, it } from "vitest";

/**
 * Tests the color/spaceRGB transform logic directly.
 * This is the same logic used in the StyleDictionary transform registered
 * in tailwindGenerator.ts — extracted here to verify alpha preservation.
 */
function colorToSpaceRGB(value: string): string {
  const { r, g, b, a } = tinycolor(value).toRgb();
  if (a < 1) {
    return `${r} ${g} ${b} / ${a}`;
  }
  return `${r} ${g} ${b}`;
}

describe("color/spaceRGB transform", () => {
  it("converts hex colors to space-separated RGB", () => {
    expect(colorToSpaceRGB("#FF0000")).toBe("255 0 0");
    expect(colorToSpaceRGB("#fcfcfd")).toBe("252 252 253");
    expect(colorToSpaceRGB("#000000")).toBe("0 0 0");
    expect(colorToSpaceRGB("#ffffff")).toBe("255 255 255");
  });

  it("converts transparent to RGB with zero alpha", () => {
    expect(colorToSpaceRGB("transparent")).toBe("0 0 0 / 0");
  });

  it("preserves alpha for rgba values", () => {
    expect(colorToSpaceRGB("rgba(0, 0, 0, 0.5)")).toBe("0 0 0 / 0.5");
    expect(colorToSpaceRGB("rgba(0, 0, 0, 0.7)")).toBe("0 0 0 / 0.7");
  });

  it("preserves alpha for whiteAlpha values", () => {
    expect(colorToSpaceRGB("rgba(255, 255, 255, 0.05)")).toBe(
      "255 255 255 / 0.05",
    );
    expect(colorToSpaceRGB("rgba(255, 255, 255, 0.5)")).toBe(
      "255 255 255 / 0.5",
    );
  });

  it("does not add alpha for fully opaque colors", () => {
    expect(colorToSpaceRGB("#3b82f6")).toBe("59 130 246");
    expect(colorToSpaceRGB("rgb(59, 130, 246)")).toBe("59 130 246");
    expect(colorToSpaceRGB("rgba(59, 130, 246, 1)")).toBe("59 130 246");
  });
});
