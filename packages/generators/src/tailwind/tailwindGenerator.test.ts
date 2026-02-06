import fs from "fs";
import os from "os";
import path from "path";
import tinycolor from "tinycolor2";
import { afterEach, describe, expect, it, vi } from "vitest";

import { generate } from "./tailwindGenerator";

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

// ---------------------------------------------------------------------------
// generate() cwd parameter tests
// ---------------------------------------------------------------------------

/** Minimal base token fixture */
const BASE_TOKENS = {
  colors: {
    primary: {
      $type: "color",
      $value: "#3b82f6",
    },
    secondary: {
      $type: "color",
      $value: "rgba(0, 0, 0, 0.5)",
    },
  },
};

/** Minimal dark token fixture */
const DARK_TOKENS = {
  colors: {
    primary: {
      $type: "color",
      $value: "#60a5fa",
    },
  },
};

/**
 * Write the minimal token fixtures into `dir/tokens/`.
 */
function seedTokens(dir: string): void {
  const tokensDir = path.join(dir, "tokens", "colors");
  fs.mkdirSync(tokensDir, { recursive: true });
  fs.writeFileSync(
    path.join(tokensDir, "base.json"),
    JSON.stringify(BASE_TOKENS, null, 2),
  );
  fs.writeFileSync(
    path.join(tokensDir, "base.dark.json"),
    JSON.stringify(DARK_TOKENS, null, 2),
  );
}

describe("generate() cwd parameter", () => {
  const tmpDirs: string[] = [];

  function makeTmpDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-test-"));
    tmpDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("generates CSS output in an explicit cwd without mutating process.cwd()", async () => {
    const workDir = makeTmpDir();
    seedTokens(workDir);

    const cwdBefore = process.cwd();
    await generate(workDir);
    const cwdAfter = process.cwd();

    // process.cwd() must not have changed
    expect(cwdAfter).toBe(cwdBefore);

    // Output files should exist under the provided workDir
    const buildDir = path.join(workDir, "build", "tailwind");
    expect(fs.existsSync(path.join(buildDir, "base.css"))).toBe(true);
    expect(fs.existsSync(path.join(buildDir, "dark.css"))).toBe(true);

    // base.css should contain the primary color as space-separated RGB
    const baseCSS = fs.readFileSync(path.join(buildDir, "base.css"), "utf-8");
    expect(baseCSS).toContain("59 130 246"); // #3b82f6

    // dark.css should contain the dark override, scoped to .dark
    const darkCSS = fs.readFileSync(path.join(buildDir, "dark.css"), "utf-8");
    expect(darkCSS).toContain(".dark");
    expect(darkCSS).toContain("96 165 250"); // #60a5fa
  });

  it("defaults to process.cwd() when no argument is provided", async () => {
    const workDir = makeTmpDir();
    seedTokens(workDir);

    const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(workDir);

    try {
      await generate();

      const buildDir = path.join(workDir, "build", "tailwind");
      expect(fs.existsSync(path.join(buildDir, "base.css"))).toBe(true);
      expect(fs.existsSync(path.join(buildDir, "dark.css"))).toBe(true);
    } finally {
      cwdSpy.mockRestore();
    }
  });

  it("preserves alpha channel in generated CSS variables", async () => {
    const workDir = makeTmpDir();
    seedTokens(workDir);

    await generate(workDir);

    const baseCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "base.css"),
      "utf-8",
    );
    // rgba(0,0,0,0.5) should produce "0 0 0 / 0.5"
    expect(baseCSS).toContain("0 0 0 / 0.5");
  });
});
