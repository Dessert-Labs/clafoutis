import type { DTCGTokenFile } from "@clafoutis/studio-core";

import { getRepoContents } from "./github-api";
import { regeneratePreview } from "./preview-css";
import { getTokenStore } from "./studio-api";

/** Loads tokens from a GitHub repo. Token is optional for public repos. */
export async function loadTokensFromGitHub(
  owner: string,
  repo: string,
  tokensPath = "tokens",
  token?: string | null,
): Promise<{ fileCount: number }> {
  const files: Record<string, DTCGTokenFile> = {};
  await fetchDirectory(owner, repo, tokensPath, files, token, tokensPath);

  const fileCount = Object.keys(files).length;
  if (fileCount === 0) {
    throw new Error(
      `No token files found in "${tokensPath}/" directory of ${owner}/${repo}. ` +
        "Make sure the repository has a tokens/ folder containing .json files.",
    );
  }

  getTokenStore().getState().loadTokens(files);
  await regeneratePreview(files);
  return { fileCount };
}

async function fetchDirectory(
  owner: string,
  repo: string,
  dirPath: string,
  result: Record<string, DTCGTokenFile>,
  token?: string | null,
  rootPath = "tokens",
): Promise<void> {
  let contents;
  try {
    contents = await getRepoContents(owner, repo, dirPath, token);
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) {
      throw new Error(
        `Directory "${dirPath}" not found in ${owner}/${repo}. ` +
          "Does this repo have a tokens/ folder?",
      );
    }
    throw err;
  }

  if (!Array.isArray(contents)) return;

  for (const item of contents) {
    if (item.type === "dir") {
      await fetchDirectory(owner, repo, item.path, result, token, rootPath);
    } else if (item.type === "file" && item.name.endsWith(".json")) {
      const fileContents = await getRepoContents(owner, repo, item.path, token);
      if (!Array.isArray(fileContents) && fileContents.content) {
        const decoded = atob(fileContents.content.replaceAll("\n", ""));
        // Escape special regex characters in rootPath and handle optional trailing slash
        const escapedRootPath = rootPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const relativePath = item.path.replace(
          new RegExp(`^${escapedRootPath}/?`),
          "",
        );
        try {
          result[relativePath] = JSON.parse(decoded);
        } catch (err) {
          console.error(
            `Failed to parse JSON in token file "${item.path}":`,
            err instanceof Error ? err.message : String(err),
          );
          // Skip malformed JSON files instead of aborting the entire load
        }
      }
    }
  }
}
