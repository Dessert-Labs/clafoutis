import type { TokenDiff } from "@clafoutis/studio-core";
import { Github } from "lucide-react";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface PublishViewProps {
  isLocal: boolean;
  isAuthenticated: boolean;
  diffs: TokenDiff[];
  message: string;
  branchName: string;
  pushing: boolean;
  error: string;
  result: { sha?: string; prUrl?: string } | null;
  onMessageChange: (value: string) => void;
  onBranchNameChange: (value: string) => void;
  onPush: () => void;
  onLogin: () => void;
}

const PublishView = ({
  isLocal,
  isAuthenticated,
  diffs,
  message,
  branchName,
  pushing,
  error,
  result,
  onMessageChange,
  onBranchNameChange,
  onPush,
  onLogin,
}: PublishViewProps) => (
  <div className="space-y-6 overflow-y-auto p-6">
    <h1 className="text-2xl font-bold text-studio-text">Publish Changes</h1>

    {isLocal && (
      <Card className="border-studio-warning/30">
        <CardContent className="py-4 text-sm text-studio-text-secondary">
          This is a local project. To publish, open the tokens from a GitHub
          repo instead.
        </CardContent>
      </Card>
    )}

    {!isAuthenticated && !isLocal && (
      <Card className="border-studio-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github size={18} />
            Sign in to publish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-studio-text-secondary">
            Publishing creates a new branch and pull request on the repo. You
            need to sign in with GitHub to push changes.
          </p>
          <Button onClick={onLogin}>
            <Github size={16} className="mr-2" />
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    )}

    {diffs.length === 0 ? (
      <p className="text-studio-text-secondary">No changes to publish.</p>
    ) : (
      <>
        <div className="overflow-hidden rounded-lg border border-studio-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-studio-border bg-studio-bg-secondary">
                <th className="px-4 py-2 text-left font-medium text-studio-text-muted">
                  Token
                </th>
                <th className="px-4 py-2 text-left font-medium text-studio-text-muted">
                  Change
                </th>
                <th className="px-4 py-2 text-left font-medium text-studio-text-muted">
                  Before
                </th>
                <th className="px-4 py-2 text-left font-medium text-studio-text-muted">
                  After
                </th>
              </tr>
            </thead>
            <tbody>
              {diffs.map((diff) => (
                <tr
                  key={diff.path}
                  className="border-b border-studio-border last:border-0"
                >
                  <td className="px-4 py-2 font-mono text-xs">{diff.path}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        diff.type === "added"
                          ? "text-studio-success"
                          : diff.type === "removed"
                            ? "text-studio-error"
                            : "text-studio-warning"
                      }
                    >
                      {diff.type}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-studio-text-muted">
                    {diff.before !== undefined ? String(diff.before) : "-"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-studio-text-muted">
                    {diff.after !== undefined ? String(diff.after) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isAuthenticated && !isLocal && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-studio-text">
                Branch name
              </label>
              <Input
                value={branchName}
                onChange={(e) => onBranchNameChange(e.target.value)}
                placeholder="studio/my-changes"
              />
              <p className="mt-1 text-xs text-studio-text-muted">
                A new branch will be created and a PR opened against the default
                branch.
              </p>
            </div>

            <div>
              <label
                htmlFor="commit-message"
                className="mb-1 block text-sm font-medium text-studio-text"
              >
                Commit message
              </label>
              <Textarea
                id="commit-message"
                placeholder="Commit message"
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
              />
            </div>

            <Button onClick={onPush} disabled={pushing || !branchName.trim()}>
              {pushing ? "Creating PR..." : "Create branch & PR"}
            </Button>

            {error && (
              <div className="rounded-md border border-studio-error bg-red-50 p-4 text-sm text-studio-error">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-md border border-studio-success bg-green-50 p-4 text-sm">
                <p className="font-medium text-studio-success">
                  Pull request created!
                </p>
                {result.sha && (
                  <p className="text-studio-text-muted">
                    Commit: {result.sha.slice(0, 7)}
                  </p>
                )}
                {result.prUrl && (
                  <a
                    href={result.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-studio-accent underline"
                  >
                    View PR
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </>
    )}
  </div>
);

export default PublishView;
