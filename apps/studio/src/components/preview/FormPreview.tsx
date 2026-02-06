interface InputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

function Input({
  label,
  id,
  type = "text",
  placeholder,
  disabled = false,
  error,
}: Readonly<InputProps>) {
  const baseStyle: React.CSSProperties = disabled
    ? {
        backgroundColor: "rgb(var(--colors-input-disabled-bg))",
        borderColor: "rgb(var(--colors-input-disabled-border))",
        color: "rgb(var(--colors-input-disabled-text))",
        cursor: "not-allowed",
      }
    : {
        backgroundColor: "rgb(var(--colors-input-bg))",
        borderColor: error
          ? "rgb(var(--colors-state-error-primary))"
          : "rgb(var(--colors-input-border))",
        color: "rgb(var(--colors-input-text))",
      };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium"
        style={{ color: "rgb(var(--colors-text-secondary))" }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-md border px-3 py-2 text-sm placeholder:opacity-50 focus:outline-none focus:ring-2"
        style={
          {
            ...baseStyle,
            "--tw-ring-color": "rgb(var(--colors-input-focus))",
          } as React.CSSProperties
        }
      />
      {error && (
        <span
          className="text-sm"
          style={{ color: "rgb(var(--colors-state-error-primary))" }}
        >
          {error}
        </span>
      )}
    </div>
  );
}

export function FormPreview() {
  return (
    <div className="space-y-4">
      <Input
        label="Email"
        id="preview-email"
        type="email"
        placeholder="you@example.com"
      />

      <Input
        label="Password"
        id="preview-password"
        type="password"
        placeholder="Enter password"
        error="Password is required"
      />

      <Input
        label="Disabled"
        id="preview-disabled"
        placeholder="Cannot edit"
        disabled
      />

      <div className="flex flex-col gap-1">
        <label
          htmlFor="preview-role"
          className="text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-secondary))" }}
        >
          Role
        </label>
        <select
          id="preview-role"
          className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{
            borderColor: "rgb(var(--colors-input-border))",
            backgroundColor: "rgb(var(--colors-input-bg))",
            color: "rgb(var(--colors-input-text))",
          }}
        >
          <option>Designer</option>
          <option>Developer</option>
          <option>Manager</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="preview-remember"
          type="checkbox"
          className="rounded"
          defaultChecked
        />
        <label
          htmlFor="preview-remember"
          className="text-sm"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Remember me
        </label>
      </div>
    </div>
  );
}
