import type { DTCGTokenFile } from "@clafoutis/studio-core";
import {
  computeDiff,
  createTokenStore,
  exportTokens,
  serializeTokenFile,
  validateTokens,
} from "@clafoutis/studio-core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { z } from "zod";

import { pushToGitHub } from "./github.js";

const tokenStore = createTokenStore();

function loadTokenFilesFromDisk(
  dirPath: string,
): Record<string, DTCGTokenFile> {
  const files: Record<string, DTCGTokenFile> = {};

  function walk(dir: string, prefix: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relativePath);
      } else if (entry.name.endsWith(".json")) {
        try {
          files[relativePath] = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        } catch (err) {
          console.error(
            `Failed to read/parse JSON file: ${fullPath} (relativePath=${relativePath}, entry=${entry.name})`,
            err,
          );
        }
      }
    }
  }

  walk(dirPath, "");
  return files;
}

const server = new McpServer({
  name: "clafoutis-studio",
  version: "0.1.0",
});

server.tool(
  "loadTokens",
  { path: z.string().describe("Directory path containing token JSON files") },
  async ({ path: dirPath }) => {
    const files = loadTokenFilesFromDisk(dirPath);
    tokenStore.getState().loadTokens(files);
    const state = tokenStore.getState();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            fileCount: state.tokenFiles.size,
            tokenCount: state.resolvedTokens.length,
            themes: state.themes,
          }),
        },
      ],
    };
  },
);

server.tool(
  "listTokens",
  { category: z.string().optional(), search: z.string().optional() },
  async ({ category, search }) => {
    let tokens = tokenStore.getState().getTokensByCategory(category);
    if (search) {
      const lower = search.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t.path.toLowerCase().includes(lower) ||
          String(t.resolvedValue).toLowerCase().includes(lower),
      );
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            tokens.map((t) => ({
              path: t.path,
              type: t.type,
              value: t.value,
              resolvedValue: t.resolvedValue,
              filePath: t.filePath,
            })),
          ),
        },
      ],
    };
  },
);

server.tool("getToken", { path: z.string() }, async ({ path: tokenPath }) => {
  const token = tokenStore
    .getState()
    .resolvedTokens.find((t) => t.path === tokenPath);
  if (!token)
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: `Token not found: ${tokenPath}` }),
        },
      ],
    };
  return { content: [{ type: "text" as const, text: JSON.stringify(token) }] };
});

server.tool(
  "updateToken",
  { path: z.string(), value: z.unknown(), description: z.string().optional() },
  async ({ path: tokenPath, value }) => {
    tokenStore.getState().updateToken(tokenPath, value);
    const updated = tokenStore
      .getState()
      .resolvedTokens.find((t) => t.path === tokenPath);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            updated,
            affectedCount: tokenStore.getState().dirtyFiles.size,
          }),
        },
      ],
    };
  },
);

server.tool(
  "addToken",
  {
    path: z.string(),
    type: z.string(),
    value: z.unknown(),
    filePath: z.string(),
    description: z.string().optional(),
  },
  async ({ path: tokenPath, type, value, filePath }) => {
    tokenStore.getState().addToken(tokenPath, type, value, filePath);
    const created = tokenStore
      .getState()
      .resolvedTokens.find((t) => t.path === tokenPath);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ created }) }],
    };
  },
);

server.tool(
  "removeToken",
  { path: z.string() },
  async ({ path: tokenPath }) => {
    const before = tokenStore
      .getState()
      .resolvedTokens.find((t) => t.path === tokenPath);
    tokenStore.getState().removeToken(tokenPath);
    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ removed: before }) },
      ],
    };
  },
);

server.tool("validateTokens", {}, async () => {
  const results = validateTokens(tokenStore.getState().tokenFiles);
  return {
    content: [{ type: "text" as const, text: JSON.stringify(results) }],
  };
});

server.tool("diffTokens", {}, async () => {
  const state = tokenStore.getState();
  const diffs = computeDiff(state.baseline, state.tokenFiles);
  return { content: [{ type: "text" as const, text: JSON.stringify(diffs) }] };
});

server.tool(
  "exportTokens",
  { outputDir: z.string().optional() },
  async ({ outputDir }) => {
    const files = exportTokens(tokenStore.getState().tokenFiles);
    const writtenFiles: string[] = [];
    if (outputDir) {
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(outputDir, filePath);
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, serializeTokenFile(content));
        writtenFiles.push(fullPath);
      }
    }
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            files: writtenFiles.length > 0 ? writtenFiles : Object.keys(files),
          }),
        },
      ],
    };
  },
);

server.tool(
  "pushTokens",
  {
    repo: z.string().describe("owner/repo format"),
    commitMessage: z.string(),
    branch: z.string().optional(),
    createPr: z.boolean().optional(),
    force: z.boolean().optional(),
  },
  async ({ repo, commitMessage, branch, createPr, force }) => {
    const repoPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
    if (!repoPattern.test(repo)) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: `Invalid repo format: "${repo}". Expected "owner/repo".`,
            }),
          },
        ],
      };
    }

    if (!force) {
      const validation = validateTokens(tokenStore.getState().tokenFiles);
      const errors = validation.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "Validation errors found",
                errors,
              }),
            },
          ],
        };
      }
    }

    const [owner, repoName] = repo.split("/") as [string, string];
    const tokenFiles = exportTokens(tokenStore.getState().tokenFiles);
    const files = Object.entries(tokenFiles).map(([fp, content]) => ({
      path: `tokens/${fp}`,
      content: serializeTokenFile(content),
    }));

    const branchName =
      branch ?? (createPr ? `studio-update-${Date.now()}` : undefined);

    const result = await pushToGitHub(owner, repoName, files, commitMessage, {
      createPr,
      branchName,
    });

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
