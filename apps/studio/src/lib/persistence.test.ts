import "fake-indexeddb/auto";

import { afterEach, describe, expect, it } from "vitest";

import { clearDraft, hasDraft, loadDraft, saveDraft } from "./persistence";

const PROJECT_ID = "test-project";

const sampleTokenFiles = {
  "colors/primitives.json": {
    colors: {
      blue: { 500: { $type: "color" as const, $value: "#3B82F6" } },
    },
  },
};

afterEach(async () => {
  await clearDraft(PROJECT_ID).catch(() => {});
});

describe("persistence", () => {
  it("saveDraft then loadDraft returns the same data", async () => {
    const before = Date.now();
    await saveDraft(PROJECT_ID, sampleTokenFiles, "abc123");

    const draft = await loadDraft(PROJECT_ID);
    expect(draft).not.toBeNull();
    expect(draft!.projectId).toBe(PROJECT_ID);
    expect(draft!.tokenFiles).toEqual(sampleTokenFiles);
    expect(draft!.baselineSha).toBe("abc123");
    expect(draft!.savedAt).toBeGreaterThanOrEqual(before);
    expect(draft!.savedAt).toBeLessThanOrEqual(Date.now());
  });

  it("clearDraft removes the draft and hasDraft returns false", async () => {
    await saveDraft(PROJECT_ID, sampleTokenFiles, "abc123");
    expect(await hasDraft(PROJECT_ID)).toBe(true);

    await clearDraft(PROJECT_ID);
    expect(await hasDraft(PROJECT_ID)).toBe(false);

    const draft = await loadDraft(PROJECT_ID);
    expect(draft).toBeNull();
  });

  it("overwrite existing draft returns the latest data", async () => {
    await saveDraft(PROJECT_ID, sampleTokenFiles, "sha-1");

    const updatedFiles = {
      "colors/primitives.json": {
        colors: {
          blue: { 500: { $type: "color" as const, $value: "#EF4444" } },
        },
      },
    };
    await saveDraft(PROJECT_ID, updatedFiles, "sha-2");

    const draft = await loadDraft(PROJECT_ID);
    expect(draft).not.toBeNull();
    expect(draft!.tokenFiles).toEqual(updatedFiles);
    expect(draft!.baselineSha).toBe("sha-2");
  });
});
