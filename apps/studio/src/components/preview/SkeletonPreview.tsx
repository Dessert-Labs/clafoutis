function Skeleton({ className = "" }: Readonly<{ className?: string }>) {
  return (
    <div
      className={`animate-pulse rounded ${className}`}
      style={{ backgroundColor: "rgb(var(--colors-skeleton-bg))" }}
    />
  );
}

export function SkeletonPreview() {
  return (
    <div className="space-y-6">
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Text Lines
        </h4>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Card Skeleton
        </h4>
        <div
          className="rounded-lg border p-4"
          style={{ borderColor: "rgb(var(--colors-border-primary))" }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>

      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Image + Text
        </h4>
        <div className="flex gap-4">
          <Skeleton className="h-20 w-20 rounded-lg" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
