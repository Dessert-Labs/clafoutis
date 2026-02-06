interface ProgressBarProps {
  variant: "primary" | "success" | "error" | "warning";
  value: number;
  label: string;
}

function ProgressBar({ variant, value, label }: Readonly<ProgressBarProps>) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          {label}
        </span>
        <span
          className="text-xs"
          style={{ color: "rgb(var(--colors-text-secondary))" }}
        >
          {value}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{
          backgroundColor: `rgb(var(--colors-progress-${variant}-bg))`,
        }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${value}%`,
            backgroundColor: `rgb(var(--colors-progress-${variant}-fill))`,
          }}
        />
      </div>
    </div>
  );
}

export function ProgressPreview() {
  return (
    <div className="space-y-4">
      <ProgressBar variant="primary" value={65} label="Upload progress" />
      <ProgressBar variant="success" value={100} label="Complete" />
      <ProgressBar variant="warning" value={80} label="Storage used" />
      <ProgressBar variant="error" value={30} label="Failed" />
    </div>
  );
}
