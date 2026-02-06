import type { DTCGTokenFile } from "@clafoutis/studio-core";

import { regeneratePreview } from "./preview-css";
import { getTokenStore } from "./studio-api";

export async function importFromFiles(
  fileList: FileList,
): Promise<{ loaded: number; errors: string[] }> {
  const files: Record<string, DTCGTokenFile> = {};
  const errors: string[] = [];

  for (const file of Array.from(fileList)) {
    if (!file.name.endsWith(".json")) {
      errors.push(`Skipped non-JSON file: ${file.name}`);
      continue;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (typeof parsed !== "object" || parsed === null) {
        errors.push(`Invalid token file: ${file.name}`);
        continue;
      }

      const relativePath = file.webkitRelativePath
        ? file.webkitRelativePath
            .replace(/^[^/]+\/tokens\//, "")
            .replace(/^[^/]+\//, "")
        : file.name;

      files[relativePath] = parsed;
    } catch {
      errors.push(`Failed to parse: ${file.name}`);
    }
  }

  if (Object.keys(files).length > 0) {
    getTokenStore().getState().loadTokens(files);
    await regeneratePreview(files);
  }

  return { loaded: Object.keys(files).length, errors };
}
