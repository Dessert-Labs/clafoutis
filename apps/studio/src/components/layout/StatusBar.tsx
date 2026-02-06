interface StatusBarProps {
  genStatus: "idle" | "generating" | "error";
  zoom: number;
}

export function StatusBar({ genStatus, zoom }: Readonly<StatusBarProps>) {
  return (
    <div className="flex h-7 items-center justify-between border-t border-studio-border bg-studio-bg-secondary px-3 text-xs text-studio-text-muted">
      <div className="flex items-center gap-3">
        {genStatus === "generating" && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-studio-accent" />
            Generating...
          </span>
        )}
        {genStatus === "error" && (
          <span className="text-studio-error">Generation error</span>
        )}
        {genStatus === "idle" && <span>Ready</span>}
      </div>
      <div>{zoom}%</div>
    </div>
  );
}
