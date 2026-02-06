import { Outlet } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { useKeyboardShortcuts } from "@/lib/keyboard";

import { HelpDialog } from "../shared/HelpDialog";

function ErrorFallback({
  error,
  resetErrorBoundary,
}: Readonly<{ error: unknown; resetErrorBoundary: () => void }>) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-studio-bg p-8">
      <h1 className="text-xl font-semibold text-studio-error">
        Something went wrong
      </h1>
      <pre className="max-w-lg overflow-auto rounded-md bg-studio-bg-tertiary p-4 text-sm text-studio-text-secondary">
        {message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="rounded-md bg-studio-accent px-4 py-2 text-sm text-white hover:bg-studio-accent-hover"
      >
        Try again
      </button>
    </div>
  );
}

export function RootLayout() {
  useKeyboardShortcuts();

  const [helpOpen, setHelpOpen] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");

  useEffect(() => {
    const handler = () => setHelpOpen(true);
    document.addEventListener("studio:open-help", handler);
    return () => document.removeEventListener("studio:open-help", handler);
  }, []);

  const handleHelpOpenChange = useCallback((open: boolean) => {
    setHelpOpen(open);
    if (!open) setHelpSearch("");
  }, []);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Outlet />
      <HelpDialog
        open={helpOpen}
        search={helpSearch}
        onOpenChange={handleHelpOpenChange}
        onSearchChange={setHelpSearch}
      />
    </ErrorBoundary>
  );
}
