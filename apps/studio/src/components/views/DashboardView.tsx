import {
  Download,
  FolderOpen,
  Github,
  Globe,
  Lock,
  Palette,
  Plus,
  Upload,
} from "lucide-react";

import type { GitHubRepo } from "@/lib/github-api";
import type { TokenTemplate } from "@/lib/templates";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Loader } from "../ui/loader";

interface DashboardViewProps {
  templates: TokenTemplate[];
  publicRepoInput: string;
  publicRepoSubfolder: string;
  publicRepoError: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  showRepos: boolean;
  reposLoading: boolean;
  repos: GitHubRepo[] | undefined;
  onPublicRepoInputChange: (value: string) => void;
  onPublicRepoSubfolderChange: (value: string) => void;
  onOpenPublicRepo: () => void;
  onCreateFromTemplate: (template: TokenTemplate) => void;
  onImportFiles: () => void;
  onSignIn: () => void;
  onShowRepos: () => void;
  onOpenRepo: (owner: string, name: string) => void;
}

const DashboardView = ({
  templates,
  publicRepoInput,
  publicRepoSubfolder,
  publicRepoError,
  isAuthenticated,
  authLoading,
  showRepos,
  reposLoading,
  repos,
  onPublicRepoInputChange,
  onPublicRepoSubfolderChange,
  onOpenPublicRepo,
  onCreateFromTemplate,
  onImportFiles,
  onSignIn,
  onShowRepos,
  onOpenRepo,
}: DashboardViewProps) => {
  const handlePublicRepoSubmit = () => {
    onOpenPublicRepo();
  };

  const handlePublicRepoInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      handlePublicRepoSubmit();
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 overflow-y-auto px-4 py-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-studio-text">
          Clafoutis Studio
        </h1>
        <p className="mt-2 text-base text-studio-text-secondary">
          Create, edit, and visualize your design tokens. Pick how you want to
          get started.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus size={18} className="text-studio-accent" />
              Create a new design system
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-studio-text-secondary">
              Start from a template with pre-built tokens. You can download the
              result as JSON files at any time.
            </p>
            <div className="flex flex-wrap gap-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onCreateFromTemplate(tpl)}
                  className="flex-1 rounded-lg border border-studio-border bg-studio-bg-secondary p-4 text-left transition-colors hover:border-studio-accent hover:bg-studio-bg-tertiary"
                >
                  <span className="flex items-center gap-2">
                    <Palette size={16} className="text-studio-accent" />
                    <span className="text-sm font-medium text-studio-text">
                      {tpl.name}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-studio-text-muted">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={18} className="text-studio-accent" />
              Open a public GitHub repo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-studio-text-secondary">
              Paste a link or enter{" "}
              <code className="rounded bg-studio-bg-tertiary px-1 py-0.5 text-xs">
                owner/repo
              </code>{" "}
              to browse tokens from any public repository. No sign-in required.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. beauwilliams/clafoutis or https://github.com/..."
                value={publicRepoInput}
                onChange={(e) => onPublicRepoInputChange(e.target.value)}
                onKeyDown={handlePublicRepoInputKeyDown}
              />
              <Input
                placeholder="Subfolder (default: tokens)"
                value={publicRepoSubfolder}
                onChange={(e) => onPublicRepoSubfolderChange(e.target.value)}
                onKeyDown={handlePublicRepoInputKeyDown}
                className="max-w-64"
              />
              <Button onClick={handlePublicRepoSubmit}>Open</Button>
            </div>
            {publicRepoError && (
              <p className="mt-2 text-xs text-studio-error">
                {publicRepoError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github size={18} />
              {isAuthenticated ? "Your GitHub repos" : "Sign in with GitHub"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GitHubSection
              isAuthenticated={isAuthenticated}
              authLoading={authLoading}
              showRepos={showRepos}
              reposLoading={reposLoading}
              repos={repos}
              onSignIn={onSignIn}
              onShowRepos={onShowRepos}
              onOpenRepo={onOpenRepo}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-center gap-6 border-t border-studio-border pt-6">
        <button
          onClick={onImportFiles}
          className="flex items-center gap-2 text-sm text-studio-text-muted transition-colors hover:text-studio-text"
        >
          <Upload size={14} />
          Import local JSON files
        </button>
        <span className="text-studio-border">|</span>
        <button
          onClick={() =>
            globalThis.open(
              "https://github.com/beauwilliams/clafoutis",
              "_blank",
            )
          }
          className="flex items-center gap-2 text-sm text-studio-text-muted transition-colors hover:text-studio-text"
        >
          <Download size={14} />
          View Clafoutis on GitHub
        </button>
      </div>
    </div>
  );
};

export default DashboardView;

interface GitHubSectionProps {
  isAuthenticated: boolean;
  authLoading: boolean;
  showRepos: boolean;
  reposLoading: boolean;
  repos: GitHubRepo[] | undefined;
  onSignIn: () => void;
  onShowRepos: () => void;
  onOpenRepo: (owner: string, name: string) => void;
}

function GitHubSection({
  isAuthenticated,
  authLoading,
  showRepos,
  reposLoading,
  repos,
  onSignIn,
  onShowRepos,
  onOpenRepo,
}: Readonly<GitHubSectionProps>) {
  if (!isAuthenticated) {
    return (
      <>
        <p className="mb-3 text-sm text-studio-text-secondary">
          Sign in to access private repos and push token changes back to GitHub
          as a pull request.
        </p>
        <Button onClick={onSignIn} disabled={authLoading}>
          <Github size={16} className="mr-2" />
          Sign in with GitHub
        </Button>
      </>
    );
  }

  if (!showRepos) {
    return (
      <>
        <p className="mb-3 text-sm text-studio-text-secondary">
          Browse your repositories, including private ones.
        </p>
        <Button onClick={onShowRepos}>
          <FolderOpen size={16} className="mr-2" />
          Browse my repos
        </Button>
      </>
    );
  }

  if (reposLoading) {
    return <Loader className="py-8" />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {repos?.map((repo) => (
        <button
          key={repo.id}
          onClick={() => onOpenRepo(repo.owner.login, repo.name)}
          className="flex items-start gap-3 rounded-lg border border-studio-border bg-studio-bg-secondary p-3 text-left transition-colors hover:border-studio-accent hover:bg-studio-bg-tertiary"
        >
          <FolderOpen
            size={16}
            className="mt-0.5 shrink-0 text-studio-accent"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-studio-text">
                {repo.full_name}
              </span>
              {repo.private && (
                <Lock size={12} className="shrink-0 text-studio-text-muted" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs text-studio-text-muted">
              {repo.description || "No description"}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
