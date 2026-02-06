import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";

import { Button } from "../ui/button";
import { Loader } from "../ui/loader";

export type LoadState = "idle" | "loading" | "loaded" | "error";

interface ProjectGateProps {
  loadState: LoadState;
  error: string | null;
  tokenCount: number | null;
  fileCount: number | null;
  projectId: string;
  onRetry: () => void;
  children: React.ReactNode;
}

export function parseProjectId(
  projectId: string,
): { owner: string; repo: string } | null {
  if (projectId === "local") return null;
  const parts = projectId.split("--");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  return { owner: parts[0], repo: parts[1] };
}

export function ProjectGate({
  loadState,
  error,
  tokenCount,
  fileCount,
  projectId,
  onRetry,
  children,
}: Readonly<ProjectGateProps>) {
  if (loadState === "loading") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-12">
        <Loader />
        <p className="text-sm text-studio-text-secondary">
          Loading tokens from GitHub...
        </p>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12">
        <div className="flex items-center gap-2 text-studio-error">
          <AlertTriangle size={20} />
          <span className="font-medium">Failed to load project</span>
        </div>
        <p className="max-w-md text-center text-sm text-studio-text-secondary">
          {error}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} className="mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  if (loadState === "loaded" && tokenCount === 0) {
    const parsed = parseProjectId(projectId);
    let message: string;
    if (!parsed) {
      message =
        "No tokens are loaded. Go back and import token files or open a repo.";
    } else if (fileCount && fileCount > 0) {
      message =
        `Loaded ${fileCount} file${fileCount === 1 ? "" : "s"} from ${parsed.owner}/${parsed.repo} but 0 tokens resolved. ` +
        "Each token must include both $type and $value per the DTCG spec.";
    } else {
      message =
        `No token files were found in the tokens/ directory of ${parsed.owner}/${parsed.repo}. ` +
        "Make sure the repo has a tokens/ folder with .json files following the DTCG format.";
    }

    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-12">
        <div className="flex items-center gap-2 text-studio-warning">
          <AlertTriangle size={20} />
          <span className="font-medium">No tokens found</span>
        </div>
        <p className="max-w-md text-center text-sm text-studio-text-secondary">
          {message}
        </p>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={14} className="mr-2" />
          Reload
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
