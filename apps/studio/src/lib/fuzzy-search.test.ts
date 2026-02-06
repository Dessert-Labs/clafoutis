import { describe, expect, it } from "vitest";

import { fuzzyMatch, fuzzyScore } from "./fuzzy-search";

describe("fuzzyMatch", () => {
  it("returns true for empty query", () => {
    expect(fuzzyMatch("button", "")).toBe(true);
  });

  it("returns false for empty text", () => {
    expect(fuzzyMatch("", "button")).toBe(false);
  });

  it("matches exact string", () => {
    expect(fuzzyMatch("button", "button")).toBe(true);
  });

  it("matches substring", () => {
    expect(fuzzyMatch("button", "btn")).toBe(true);
  });

  it("matches fuzzy characters", () => {
    expect(fuzzyMatch("button", "btn")).toBe(true);
    expect(fuzzyMatch("primary", "prm")).toBe(true);
  });

  it("matches with spaces - single word", () => {
    expect(fuzzyMatch("button outline", "btn")).toBe(true);
    expect(fuzzyMatch("button outline", "out")).toBe(true);
  });

  it("matches with spaces - multiple words", () => {
    expect(fuzzyMatch("button outline", "btn out")).toBe(true);
    expect(fuzzyMatch("button outline", "button outline")).toBe(true);
    expect(fuzzyMatch("colors.button.primary.bg", "btn prm")).toBe(true);
  });

  it("requires all words to match", () => {
    expect(fuzzyMatch("button outline", "btn xyz")).toBe(false);
    expect(fuzzyMatch("button outline", "xyz btn")).toBe(false);
  });

  it("handles multiple spaces", () => {
    expect(fuzzyMatch("button outline", "btn  out")).toBe(true);
    expect(fuzzyMatch("button outline", "  btn out  ")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(fuzzyMatch("Button Outline", "BTN OUT")).toBe(true);
    expect(fuzzyMatch("BUTTON", "btn")).toBe(true);
  });
});

describe("fuzzyScore", () => {
  it("returns 0 for empty query", () => {
    expect(fuzzyScore("button", "")).toBe(0);
  });

  it("returns 0 for empty text", () => {
    expect(fuzzyScore("", "button")).toBe(0);
  });

  it("returns 0 for non-match", () => {
    expect(fuzzyScore("button", "xyz")).toBe(0);
  });

  it("scores exact match higher than fuzzy match", () => {
    const exactScore = fuzzyScore("button", "button");
    const fuzzyScore1 = fuzzyScore("button", "btn");
    expect(exactScore).toBeGreaterThan(fuzzyScore1);
  });

  it("scores closer matches higher", () => {
    const closeScore = fuzzyScore("button", "btn");
    const farScore = fuzzyScore("bxxuxxxtxxoxxn", "btn");
    expect(closeScore).toBeGreaterThan(farScore);
  });

  it("scores matches with spaces", () => {
    const score1 = fuzzyScore("button outline", "btn out");
    expect(score1).toBeGreaterThan(0);

    const score2 = fuzzyScore("button outline", "button outline");
    expect(score2).toBeGreaterThan(score1);
  });

  it("requires all words to match for non-zero score", () => {
    expect(fuzzyScore("button outline", "btn xyz")).toBe(0);
  });

  it("handles multiple spaces", () => {
    const score1 = fuzzyScore("button outline", "btn out");
    const score2 = fuzzyScore("button outline", "btn  out");
    expect(score1).toBe(score2);
  });
});
