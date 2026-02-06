const BASE_URL = "https://api.github.com";

function headers(token?: string | null) {
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: { login: string };
  description: string | null;
  updated_at: string;
  default_branch: string;
  private: boolean;
}

export interface GitHubContent {
  name: string;
  path: string;
  type: "file" | "dir";
  sha: string;
  content?: string;
  encoding?: string;
}

export interface GitHubTreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
}

export async function getAuthenticatedUser(token: string): Promise<GitHubUser> {
  const res = await fetch(`${BASE_URL}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch(`${BASE_URL}/user/repos?per_page=100&sort=updated`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

/** Fetches a single repo's metadata. Works without auth for public repos. */
export async function getRepo(
  owner: string,
  repo: string,
  token?: string | null,
): Promise<GitHubRepo> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

/** Fetches directory/file contents. Works without auth for public repos. */
export async function getRepoContents(
  owner: string,
  repo: string,
  path: string,
  token?: string | null,
): Promise<GitHubContent | GitHubContent[]> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getRepoTree(
  owner: string,
  repo: string,
  treeSha: string,
  token?: string | null,
): Promise<{ tree: GitHubTreeEntry[] }> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

export async function getRef(
  owner: string,
  repo: string,
  ref = "heads/main",
  token?: string | null,
): Promise<{ object: { sha: string } }> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/ref/${ref}`, {
    headers: headers(token),
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

/** Parses "owner/repo" or a full GitHub URL into { owner, repo }. */
export function parseRepoInput(
  input: string,
): { owner: string; repo: string } | null {
  const trimmed = input.trim();

  const urlMatch = trimmed.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (urlMatch)
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") };

  const slashMatch = trimmed.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (slashMatch) return { owner: slashMatch[1], repo: slashMatch[2] };

  return null;
}
