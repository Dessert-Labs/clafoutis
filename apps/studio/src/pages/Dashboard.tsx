import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import DashboardView from "@/components/views/DashboardView";
import { useAlerts } from "@/contexts/AlertProvider";
import { useAuth } from "@/contexts/AuthProvider";
import { listUserRepos, parseRepoInput } from "@/lib/github-api";
import { importFromFiles } from "@/lib/local-import";
import { regeneratePreview } from "@/lib/preview-css";
import { getTokenStore } from "@/lib/studio-api";
import { TEMPLATES, type TokenTemplate } from "@/lib/templates";

export function Dashboard() {
  const {
    accessToken,
    user,
    isAuthenticated,
    login,
    logout,
    isLoading: authLoading,
  } = useAuth();
  const { addAlert } = useAlerts();
  const navigate = useNavigate();
  const [publicRepoInput, setPublicRepoInput] = useState("");
  const [publicRepoError, setPublicRepoError] = useState("");
  const [showRepos, setShowRepos] = useState(false);

  const { data: repos, isLoading: reposLoading } = useQuery({
    queryKey: ["repos"],
    queryFn: () => listUserRepos(accessToken!),
    enabled: !!accessToken && showRepos,
  });

  const handleOpenPublicRepo = useCallback(() => {
    setPublicRepoError("");
    const parsed = parseRepoInput(publicRepoInput);
    if (!parsed) {
      setPublicRepoError(
        'Enter a valid repo like "owner/repo" or a full GitHub URL',
      );
      return;
    }
    navigate({
      to: "/projects/$projectId/tokens",
      params: { projectId: `${parsed.owner}--${parsed.repo}` },
    });
  }, [publicRepoInput, navigate]);

  const handlePublicRepoInputChange = useCallback((value: string) => {
    setPublicRepoInput(value);
    setPublicRepoError("");
  }, []);

  const handleImportFiles = useCallback(async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.multiple = true;
    input.onchange = async () => {
      if (input.files) {
        try {
          await importFromFiles(input.files);
          navigate({
            to: "/projects/$projectId/tokens",
            params: { projectId: "local" },
          });
        } catch (error) {
          console.error("Failed to import files:", error);
          addAlert(
            error instanceof Error
              ? error.message
              : "Failed to import files. Please check the file format and try again.",
            "error",
          );
        }
      }
    };
    input.click();
  }, [navigate, addAlert]);

  const handleCreateFromTemplate = useCallback(
    async (template: TokenTemplate) => {
      try {
        getTokenStore().getState().loadTokens(template.files);
        await regeneratePreview(template.files);
        navigate({
          to: "/projects/$projectId/tokens",
          params: { projectId: "local" },
        });
      } catch (error) {
        console.error("Failed to create project from template:", error);
        addAlert("Failed to create project from template.", "error");
      }
    },
    [navigate, addAlert],
  );

  const handleSignInThenBrowse = useCallback(async () => {
    if (isAuthenticated) {
      setShowRepos(true);
    } else {
      await login();
    }
  }, [isAuthenticated, login]);

  return (
    <AppLayout
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={login}
      onLogout={logout}
      onOpenHelp={() =>
        document.dispatchEvent(new CustomEvent("studio:open-help"))
      }
    >
      <DashboardView
        templates={TEMPLATES}
        publicRepoInput={publicRepoInput}
        publicRepoError={publicRepoError}
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        showRepos={showRepos}
        reposLoading={reposLoading}
        repos={repos}
        onPublicRepoInputChange={handlePublicRepoInputChange}
        onOpenPublicRepo={handleOpenPublicRepo}
        onCreateFromTemplate={handleCreateFromTemplate}
        onImportFiles={handleImportFiles}
        onSignIn={handleSignInThenBrowse}
        onShowRepos={() => setShowRepos(true)}
        onOpenRepo={(owner, name) =>
          navigate({
            to: "/projects/$projectId/tokens",
            params: { projectId: `${owner}--${name}` },
          })
        }
      />
    </AppLayout>
  );
}
