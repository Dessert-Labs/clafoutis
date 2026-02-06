import type { CSSProperties } from "react";

const variantStyles: Record<string, CSSProperties> = {
  primary: {
    backgroundColor: "rgb(var(--colors-button-primary-bg))",
    color: "rgb(var(--colors-button-primary-text))",
  },
  secondary: {
    backgroundColor: "rgb(var(--colors-button-secondary-bg))",
    color: "rgb(var(--colors-button-secondary-text))",
  },
  outline: {
    backgroundColor: "rgb(var(--colors-button-outline-bg))",
    color: "rgb(var(--colors-button-outline-text))",
    border: "1px solid",
    borderColor: "rgb(var(--colors-button-outline-border))",
  },
  ghost: {
    backgroundColor: "rgb(var(--colors-button-ghost-bg))",
    color: "rgb(var(--colors-button-ghost-text))",
  },
  accent: {
    backgroundColor: "rgb(var(--colors-button-accent-bg))",
    color: "rgb(var(--colors-button-accent-text))",
  },
  success: {
    backgroundColor: "rgb(var(--colors-button-success-bg))",
    color: "rgb(var(--colors-button-success-text))",
  },
  error: {
    backgroundColor: "rgb(var(--colors-button-error-bg))",
    color: "rgb(var(--colors-button-error-text))",
  },
  warning: {
    backgroundColor: "rgb(var(--colors-button-warning-bg))",
    color: "rgb(var(--colors-button-warning-text))",
  },
  info: {
    backgroundColor: "rgb(var(--colors-button-info-bg))",
    color: "rgb(var(--colors-button-info-text))",
  },
  link: {
    backgroundColor: "rgb(var(--colors-button-link-bg))",
    color: "rgb(var(--colors-button-link-text))",
    textDecoration: "underline",
  },
};

const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

export function ButtonPreview() {
  return (
    <div className="space-y-4">
      <div>
        <h4
          className="mb-2 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Sizes
        </h4>
        <div className="flex flex-wrap items-center gap-2">
          {["sm", "md", "lg"].map((size) => (
            <button
              key={size}
              className={`rounded-md font-medium transition-all ${sizeClasses[size]}`}
              style={variantStyles.primary}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4
          className="mb-2 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Variants
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(variantStyles).map(([name, style]) => (
            <button
              key={name}
              className="rounded-md px-4 py-2 text-sm font-medium transition-all"
              style={style}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
