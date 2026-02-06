import type { ReactNode } from "react";

interface BadgeProps {
  variant:
    | "default"
    | "secondary"
    | "outline"
    | "info"
    | "success"
    | "warning"
    | "error";
  children: ReactNode;
}

function Badge({ variant, children }: Readonly<BadgeProps>) {
  const isOutline = variant === "outline";

  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `rgb(var(--colors-badge-${variant}-bg))`,
        color: `rgb(var(--colors-badge-${variant}-text))`,
        ...(isOutline && {
          border: "1px solid",
          borderColor: `rgb(var(--colors-badge-outline-border))`,
        }),
      }}
    >
      {children}
    </span>
  );
}

export function BadgePreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  );
}
