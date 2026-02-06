const BASE_URL = "https://api.github.com";

function headers() {
  const token = process.env.CLAFOUTIS_REPO_TOKEN;
  if (!token)
    throw new Error("CLAFOUTIS_REPO_TOKEN environment variable is required");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

async function throwResponseError(
  res: Response,
  label: string,
): Promise<never> {
  const text = await res.text();
  let body: string;
  try {
    body = JSON.stringify(JSON.parse(text));
  } catch {
    body = text;
  }
  throw new Error(`${label}: ${res.status} - ${body}`);
}

async function getHeadSha(
  owner: string,
  repo: string,
  branch = "main",
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: headers() },
  );
  if (!res.ok) await throwResponseError(res, "Failed to get HEAD");
  const data = (await res.json()) as { object: { sha: string } };
  return data.object.sha;
}

async function getCommitTreeSha(
  owner: string,
  repo: string,
  commitSha: string,
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/commits/${commitSha}`,
    { headers: headers() },
  );
  if (!res.ok) await throwResponseError(res, "Failed to get commit");
  const data = (await res.json()) as { tree: { sha: string } };
  return data.tree.sha;
}

async function createBlob(
  owner: string,
  repo: string,
  content: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      content: Buffer.from(content).toString("base64"),
      encoding: "base64",
    }),
  });
  if (!res.ok) await throwResponseError(res, "Failed to create blob");
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

async function createTree(
  owner: string,
  repo: string,
  baseTreeSha: string,
  files: { path: string; content: string }[],
): Promise<string> {
  const tree = await Promise.all(
    files.map(async (file) => ({
      path: file.path,
      mode: "100644" as const,
      type: "blob" as const,
      sha: await createBlob(owner, repo, file.content),
    })),
  );

  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  if (!res.ok) await throwResponseError(res, "Failed to create tree");
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

async function createCommit(
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  if (!res.ok) await throwResponseError(res, "Failed to create commit");
  const data = (await res.json()) as { sha: string };
  return data.sha;
}

async function updateRef(
  owner: string,
  repo: string,
  sha: string,
  branch = "main",
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ sha }),
    },
  );
  if (!res.ok) await throwResponseError(res, "Failed to update ref");
}

async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  sha: string,
): Promise<void> {
  // Check if the branch already exists — return early if so.
  const check = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/refs/heads/${branchName}`,
    { headers: headers() },
  );
  if (check.ok) return;

  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });

  // 422 means the ref was created between our check and the POST — treat as non-fatal.
  if (res.status === 422) return;
  if (!res.ok) await throwResponseError(res, "Failed to create branch");
}

async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  head: string,
  base = "main",
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ title, head, base }),
  });
  if (!res.ok) await throwResponseError(res, "Failed to create PR");
  const data = (await res.json()) as { html_url: string };
  return data.html_url;
}

export interface PushResult {
  commitSha: string;
  prUrl?: string;
}

export async function pushToGitHub(
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message: string,
  options?: { createPr?: boolean; branchName?: string },
): Promise<PushResult> {
  const headSha = await getHeadSha(owner, repo);
  const baseTreeSha = await getCommitTreeSha(owner, repo, headSha);
  const treeSha = await createTree(owner, repo, baseTreeSha, files);
  const commitSha = await createCommit(owner, repo, message, treeSha, headSha);

  if (options?.createPr && options.branchName) {
    await createBranch(owner, repo, options.branchName, commitSha);
    const prUrl = await createPullRequest(
      owner,
      repo,
      message,
      options.branchName,
    );
    return { commitSha, prUrl };
  }

  await updateRef(owner, repo, commitSha);
  return { commitSha };
}
