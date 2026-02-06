import type { DTCGTokenFile } from "@clafoutis/studio-core";
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
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthProvider";
import { clearDraft, loadDraft } from "@/lib/persistence";
import {
  getGenerationStatus,
  onGenerationStatusChange,
  regeneratePreview,
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
  const [draftConflict, setDraftConflict] = useState<{
    savedAt: number;
    tokenFiles: Record<string, DTCGTokenFile>;
  } | null>(null);

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
            setDraftConflict({
              savedAt: draft.savedAt,
              tokenFiles: draft.tokenFiles,
            });
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

  const handleRestoreDraft = useCallback(async () => {
    if (!draftConflict) return;
    const store = getTokenStore();
    store.getState().loadTokens(draftConflict.tokenFiles);
    const files = store.getState().exportAsJSON();
    await regeneratePreview(files);
    const count = store.getState().resolvedTokens.length;
    setTokenCount(count);
    setDraftConflict(null);
  }, [draftConflict]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft(projectId);
    setDraftConflict(null);
  }, [projectId]);

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

      <Dialog
        open={draftConflict !== null}
        onOpenChange={(open) => {
          if (!open) handleDiscardDraft();
        }}
      >
        <DialogContent>
          <DialogTitle>Unsaved Draft Found</DialogTitle>
          <p className="mt-2 text-sm text-studio-text-secondary">
            You have unsaved edits from{" "}
            <strong>
              {draftConflict
                ? new Date(draftConflict.savedAt).toLocaleString()
                : ""}
            </strong>
            . Would you like to restore your draft or discard it and keep the
            latest data from GitHub?
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleDiscardDraft}>
              Discard
            </Button>
            <Button size="sm" onClick={handleRestoreDraft}>
              Restore Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

export const Route = createFileRoute("/projects/$projectId")({
  component: ProjectLayoutRoute,
});
