import { createFileRoute, Outlet, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import {
  type LoadState,
  parseProjectId,
  ProjectGate,
} from "@/components/layout/ProjectGate";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthProvider";
import { clearDraft, loadDraft } from "@/lib/persistence";
import {
  getGenerationStatus,
  onGenerationStatusChange,
  regeneratePreview,
} from "@/lib/preview-css";
import { getProjectTokensPath } from "@/lib/project-metadata";
import { getEditorStore, getTokenStore } from "@/lib/studio-api";
import { loadTokensFromGitHub } from "@/lib/token-loader";

function ProjectLayoutRoute() {
  const { projectId } = useParams({ from: "/projects/$projectId" });
  const { accessToken, user, isAuthenticated, login, logout } = useAuth();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const [discardingChanges, setDiscardingChanges] = useState(false);
  const loadedProjectRef = useRef<string | null>(null);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const [genStatus, setGenStatus] = useState(getGenerationStatus());
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const unsubscribe = onGenerationStatusChange(setGenStatus);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const store = getEditorStore();
    return store.subscribe((state) =>
      setZoom(Math.round(state.camera.zoom * 100)),
    );
  }, []);

  useEffect(() => {
    if (loadedProjectRef.current === projectId) return;

    const parsed = parseProjectId(projectId);
    const tokensPath = getProjectTokensPath(projectId);
    if (!parsed) {
      const count = getTokenStore().getState().resolvedTokens.length;
      setTokenCount(count);
      setFileCount(null);
      setLoadState("loaded");
      loadedProjectRef.current = projectId;
      return;
    }

    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    setTokenCount(null);
    setFileCount(null);

    loadTokensFromGitHub(
      parsed.owner,
      parsed.repo,
      tokensPath,
      accessTokenRef.current,
    )
      .then(async (result) => {
        if (cancelled) return;
        const count = getTokenStore().getState().resolvedTokens.length;
        setTokenCount(count);
        setFileCount(result.fileCount);
        setLoadState("loaded");
        loadedProjectRef.current = projectId;

        try {
          const draft = await loadDraft(projectId);
          if (draft && !cancelled) {
            const store = getTokenStore();
            store.getState().loadTokens(draft.tokenFiles);
            await regeneratePreview(draft.tokenFiles);
            const draftTokenCount = store.getState().resolvedTokens.length;
            setTokenCount(draftTokenCount);
            setFileCount(Object.keys(draft.tokenFiles).length);
          }
        } catch {
          // Draft check is best-effort; ignore failures
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : "Failed to load tokens",
        );
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, retryCounter]);

  const handleRetry = useCallback(() => {
    loadedProjectRef.current = null;
    setRetryCounter((prev) => prev + 1);
    setLoadState("idle");
    setLoadError(null);
  }, []);

  const handleOpenHelp = useCallback(() => {
    document.dispatchEvent(new CustomEvent("studio:open-help"));
  }, []);

  const isRemoteProject = parseProjectId(projectId) !== null;
  const handleDiscardChanges = useCallback(async () => {
    if (!isRemoteProject || discardingChanges) return;
    setDiscardingChanges(true);
    try {
      await clearDraft(projectId);
      loadedProjectRef.current = null;
      setRetryCounter((prev) => prev + 1);
      setLoadState("idle");
      setLoadError(null);
    } finally {
      setDiscardingChanges(false);
    }
  }, [projectId, isRemoteProject, discardingChanges]);

  return (
    <AppLayout
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={login}
      onLogout={logout}
      onOpenHelp={handleOpenHelp}
      headerActions={
        isRemoteProject ? (
          <Button
            size="sm"
            onClick={handleDiscardChanges}
            disabled={discardingChanges}
          >
            Discard Changes
          </Button>
        ) : null
      }
    >
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar projectId={projectId} />
        <ProjectGate
          loadState={loadState}
          error={loadError}
          tokenCount={tokenCount}
          fileCount={fileCount}
          projectId={projectId}
          tokensPath={getProjectTokensPath(projectId)}
          onRetry={handleRetry}
        >
          <Outlet />
        </ProjectGate>
      </div>
      <StatusBar genStatus={genStatus} zoom={zoom} />
    </AppLayout>
  );
}

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayoutRoute,
});
