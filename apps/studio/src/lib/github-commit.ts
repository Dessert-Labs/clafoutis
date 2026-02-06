const BASE_URL = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

async function getHeadSha(
  token: string,
  owner: string,
  repo: string,
  branch = "main",
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) throw new Error(`Failed to get HEAD: ${res.status}`);
  const data = await res.json();
  return data.object.sha;
}

async function getCommitTreeSha(
  token: string,
  owner: string,
  repo: string,
  commitSha: string,
): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/commits/${commitSha}`,
    {
      headers: headers(token),
    },
  );
  if (!res.ok) throw new Error(`Failed to get commit: ${res.status}`);
  const data = await res.json();
  return data.tree.sha;
}

async function createBlob(
  token: string,
  owner: string,
  repo: string,
  content: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/blobs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      content: btoa(unescape(encodeURIComponent(content))),
      encoding: "base64",
    }),
  });
  if (!res.ok) throw new Error(`Failed to create blob: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

async function createTree(
  token: string,
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
      sha: await createBlob(token, owner, repo, file.content),
    })),
  );

  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ base_tree: baseTreeSha, tree }),
  });
  if (!res.ok) throw new Error(`Failed to create tree: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

async function createCommit(
  token: string,
  owner: string,
  repo: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ message, tree: treeSha, parents: [parentSha] }),
  });
  if (!res.ok) throw new Error(`Failed to create commit: ${res.status}`);
  const data = await res.json();
  return data.sha;
}

async function updateRef(
  token: string,
  owner: string,
  repo: string,
  sha: string,
  branch = "main",
): Promise<void> {
  const res = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ sha }),
    },
  );
  if (!res.ok) throw new Error(`Failed to update ref: ${res.status}`);
}

async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  sha: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
  });
  if (!res.ok) throw new Error(`Failed to create branch: ${res.status}`);
}

async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base = "main",
): Promise<string> {
  const res = await fetch(`${BASE_URL}/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({ title, head, base }),
  });
  if (!res.ok) throw new Error(`Failed to create PR: ${res.status}`);
  const data = await res.json();
  return data.html_url;
}

export interface PushResult {
  commitSha: string;
  prUrl?: string;
}

export async function pushTokenChanges(
  token: string,
  owner: string,
  repo: string,
  files: { path: string; content: string }[],
  message: string,
  options?: { createPr?: boolean; branchName?: string },
): Promise<PushResult> {
  const headSha = await getHeadSha(token, owner, repo);
  const baseTreeSha = await getCommitTreeSha(token, owner, repo, headSha);
  const treeSha = await createTree(token, owner, repo, baseTreeSha, files);
  const commitSha = await createCommit(
    token,
    owner,
    repo,
    message,
    treeSha,
    headSha,
  );

  if (options?.createPr && options.branchName) {
    await createBranch(token, owner, repo, options.branchName, commitSha);
    const prUrl = await createPullRequest(
      token,
      owner,
      repo,
      message,
      options.branchName,
    );
    return { commitSha, prUrl };
  }

  await updateRef(token, owner, repo, commitSha);
  return { commitSha };
}
