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

// ---------------------------------------------------------------------------
// Motion token tests
// ---------------------------------------------------------------------------

const MOTION_TOKENS = {
  duration: {
    none: { $type: "duration", $value: "0ms" },
    instant: { $type: "duration", $value: "50ms" },
    fast: { $type: "duration", $value: "100ms" },
    moderate: { $type: "duration", $value: "150ms" },
    normal: { $type: "duration", $value: "250ms" },
    slow: { $type: "duration", $value: "400ms" },
    deliberate: { $type: "duration", $value: "700ms" },
    leisurely: { $type: "duration", $value: "1000ms" },
  },
  easing: {
    linear: { $type: "cubicBezier", $value: [0, 0, 1, 1] },
    default: { $type: "cubicBezier", $value: [0.4, 0, 0.2, 1] },
    in: { $type: "cubicBezier", $value: [0.4, 0, 1, 1] },
    out: { $type: "cubicBezier", $value: [0, 0, 0.2, 1] },
    spring: { $type: "cubicBezier", $value: [0.175, 0.885, 0.32, 1.275] },
    bounce: { $type: "cubicBezier", $value: [0.34, 1.56, 0.64, 1] },
  },
  motion: {
    micro: {
      duration: { $type: "duration", $value: "{duration.fast}" },
      easing: { $type: "cubicBezier", $value: "{easing.default}" },
    },
    enter: {
      duration: { $type: "duration", $value: "{duration.normal}" },
      easing: { $type: "cubicBezier", $value: "{easing.out}" },
    },
    exit: {
      duration: { $type: "duration", $value: "{duration.fast}" },
      easing: { $type: "cubicBezier", $value: "{easing.in}" },
    },
  },
};

function seedMotionTokens(dir: string): void {
  const tokensDir = path.join(dir, "tokens", "motion");
  fs.mkdirSync(tokensDir, { recursive: true });
  fs.writeFileSync(
    path.join(tokensDir, "base.json"),
    JSON.stringify(MOTION_TOKENS, null, 2),
  );
}

describe("motion token generation", () => {
  const tmpDirs: string[] = [];

  function makeTmpDir(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gen-motion-test-"));
    tmpDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tmpDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tmpDirs.length = 0;
  });

  it("generates duration CSS custom properties", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const baseCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "base.css"),
      "utf-8",
    );

    expect(baseCSS).toContain("--duration-none: 0ms");
    expect(baseCSS).toContain("--duration-fast: 100ms");
    expect(baseCSS).toContain("--duration-normal: 250ms");
    expect(baseCSS).toContain("--duration-slow: 400ms");
  });

  it("generates cubicBezier CSS custom properties as cubic-bezier() functions", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const baseCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "base.css"),
      "utf-8",
    );

    expect(baseCSS).toContain("cubic-bezier(0, 0, 1, 1)"); // linear
    expect(baseCSS).toContain("cubic-bezier(0.4, 0, 0.2, 1)"); // default
    expect(baseCSS).toContain("cubic-bezier(0.175, 0.885, 0.32, 1.275)"); // spring
  });

  it("does NOT output raw array syntax for cubicBezier tokens", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const baseCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "base.css"),
      "utf-8",
    );

    // Should not contain raw comma-joined array without cubic-bezier() wrapper
    expect(baseCSS).not.toMatch(/--easing-\w+:\s*[\d.,\s]+;/);
  });

  it("emits motion-reduced.css with @media prefers-reduced-motion block", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const reducedCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "motion-reduced.css"),
      "utf-8",
    );

    expect(reducedCSS).toContain("@media (prefers-reduced-motion: reduce)");
    expect(reducedCSS).toContain("--duration-fast: 0ms");
    expect(reducedCSS).toContain("--duration-normal: 0ms");
    expect(reducedCSS).toContain("--duration-none: 0ms");
  });

  it("imports motion-reduced.css from index.css", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const indexCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "index.css"),
      "utf-8",
    );

    expect(indexCSS).toContain('@import "./motion-reduced.css"');
  });

  it("maps duration tokens to transitionDuration in tailwind.base.js", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const tailwindBase = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "tailwind.base.js"),
      "utf-8",
    );

    expect(tailwindBase).toContain("transitionDuration");
    expect(tailwindBase).toContain("var(--duration-fast)");
    expect(tailwindBase).toContain("var(--duration-normal)");
  });

  it("maps easing tokens to transitionTimingFunction in tailwind.base.js", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const tailwindBase = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "tailwind.base.js"),
      "utf-8",
    );

    expect(tailwindBase).toContain("transitionTimingFunction");
    expect(tailwindBase).toContain("var(--easing-default)");
    expect(tailwindBase).toContain("var(--easing-spring)");
  });

  it("resolves semantic motion references in base.css", async () => {
    const workDir = makeTmpDir();
    seedMotionTokens(workDir);
    await generate(workDir);

    const baseCSS = fs.readFileSync(
      path.join(workDir, "build", "tailwind", "base.css"),
      "utf-8",
    );

    // Semantic tokens reference primitives — outputReferences: true means CSS vars reference each other
    expect(baseCSS).toContain("--motion-micro-duration");
    expect(baseCSS).toContain("--motion-enter-duration");
    expect(baseCSS).toContain("--motion-exit-duration");
  });
});
