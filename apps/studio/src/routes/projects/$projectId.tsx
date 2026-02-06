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
import { useAuth } from "@/contexts/AuthProvider";
import {
  getGenerationStatus,
  onGenerationStatusChange,
} from "@/lib/preview-css";
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
      "tokens",
      accessTokenRef.current,
    )
      .then((result) => {
        if (cancelled) return;
        const count = getTokenStore().getState().resolvedTokens.length;
        setTokenCount(count);
        setFileCount(result.fileCount);
        setLoadState("loaded");
        loadedProjectRef.current = projectId;
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

  return (
    <AppLayout
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={login}
      onLogout={logout}
      onOpenHelp={handleOpenHelp}
    >
      <div className="flex flex-1 overflow-hidden">
        <ProjectSidebar projectId={projectId} />
        <ProjectGate
          loadState={loadState}
          error={loadError}
          tokenCount={tokenCount}
          fileCount={fileCount}
          projectId={projectId}
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
