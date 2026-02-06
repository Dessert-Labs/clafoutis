interface ToastProps {
  variant?: "default" | "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  onClose?: () => void;
}

function Toast({
  variant = "default",
  title,
  description,
  onClose,
}: Readonly<ToastProps>) {
  const isState = variant !== "default";

  return (
    <div
      className="flex items-start gap-3 rounded-lg border p-4 shadow-md"
      style={{
        backgroundColor: isState
          ? `rgb(var(--colors-alert-${variant}-bg))`
          : "rgb(var(--colors-toast-bg))",
        borderColor: isState
          ? `rgb(var(--colors-alert-${variant}-border))`
          : "rgb(var(--colors-toast-border))",
      }}
    >
      <div className="flex-1">
        <p
          className="text-sm font-medium"
          style={{
            color: isState
              ? `rgb(var(--colors-alert-${variant}-text))`
              : "rgb(var(--colors-toast-text))",
          }}
        >
          {title}
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: "rgb(var(--colors-toast-description))" }}
        >
          {description}
        </p>
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Close toast"
          className="text-sm"
          style={{ color: "rgb(var(--colors-toast-close))" }}
          onClick={onClose}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function ToastPreview() {
  return (
    <div className="space-y-3">
      <Toast
        title="Event created"
        description="Your event has been created successfully."
        onClose={() => {}}
      />
      <Toast
        variant="info"
        title="Info"
        description="A new version is available."
        onClose={() => {}}
      />
      <Toast
        variant="success"
        title="Saved"
        description="Your changes have been saved."
        onClose={() => {}}
      />
      <Toast
        variant="warning"
        title="Warning"
        description="Your trial expires in 3 days."
        onClose={() => {}}
      />
      <Toast
        variant="error"
        title="Error"
        description="Failed to save changes. Please try again."
        onClose={() => {}}
      />
    </div>
  );
}
