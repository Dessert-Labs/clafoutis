interface AvatarProps {
  initials: string;
  size: "sm" | "md" | "lg";
}

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function Avatar({ initials, size }: Readonly<AvatarProps>) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: "rgb(var(--colors-avatar-bg))",
        color: "rgb(var(--colors-avatar-text))",
      }}
    >
      {initials}
    </div>
  );
}

export function AvatarPreview() {
  return (
    <div className="space-y-4">
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Sizes
        </h4>
        <div className="flex items-center gap-3">
          <Avatar initials="SM" size="sm" />
          <Avatar initials="MD" size="md" />
          <Avatar initials="LG" size="lg" />
        </div>
      </div>
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Group
        </h4>
        <div className="flex -space-x-2">
          <Avatar initials="AJ" size="md" />
          <Avatar initials="BS" size="md" />
          <Avatar initials="CW" size="md" />
          <Avatar initials="DB" size="md" />
          <div
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xs font-medium"
            style={{
              backgroundColor: "rgb(var(--colors-surface-tertiary))",
              color: "rgb(var(--colors-text-secondary))",
            }}
          >
            +3
          </div>
        </div>
      </div>
    </div>
  );
}
