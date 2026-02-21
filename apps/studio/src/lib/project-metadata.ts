interface ProjectMetadata {
  tokensPath?: string;
}

type ProjectMetadataStore = Record<string, ProjectMetadata>;

const STORAGE_KEY = "studio-project-metadata";
const DEFAULT_TOKENS_PATH = "tokens";

function readStore(): ProjectMetadataStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as ProjectMetadataStore;
  } catch {
    return {};
  }
}

function writeStore(store: ProjectMetadataStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // best-effort persistence
  }
}

function normalizeTokensPath(pathValue: string): string {
  const trimmed = pathValue.trim().replace(/^\/+|\/+$/g, "");
  return trimmed || DEFAULT_TOKENS_PATH;
}

export function setProjectTokensPath(
  projectId: string,
  tokensPath: string,
): void {
  const store = readStore();
  store[projectId] = {
    ...store[projectId],
    tokensPath: normalizeTokensPath(tokensPath),
  };
  writeStore(store);
}

export function getProjectTokensPath(projectId: string): string {
  const store = readStore();
  const tokensPath = store[projectId]?.tokensPath;
  return typeof tokensPath === "string" && tokensPath.trim()
    ? normalizeTokensPath(tokensPath)
    : DEFAULT_TOKENS_PATH;
}
