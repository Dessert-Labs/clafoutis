interface DialogPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DialogPreview({
  open,
  onOpenChange,
}: Readonly<DialogPreviewProps>) {
  return (
    <div>
      <button
        className="rounded-md px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "rgb(var(--colors-button-primary-bg))",
          color: "rgb(var(--colors-button-primary-text))",
        }}
        onClick={() => onOpenChange(true)}
      >
        Open Dialog
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            role="button"
            tabIndex={0}
            className="absolute inset-0"
            style={{ backgroundColor: "rgb(var(--colors-dialog-overlay))" }}
            onClick={() => onOpenChange(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onOpenChange(false);
            }}
          />

          {/* Dialog */}
          <div
            className="relative z-10 w-full max-w-md rounded-lg border p-6 shadow-lg"
            style={{
              backgroundColor: "rgb(var(--colors-dialog-bg))",
              borderColor: "rgb(var(--colors-dialog-border))",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "rgb(var(--colors-dialog-title))" }}
            >
              Dialog Title
            </h3>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgb(var(--colors-dialog-description))" }}
            >
              This is a dialog component. It overlays the page with a
              semi-transparent backdrop and presents focused content.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "rgb(var(--colors-button-ghost-bg))",
                  color: "rgb(var(--colors-button-ghost-text))",
                }}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </button>
              <button
                className="rounded-md px-4 py-2 text-sm font-medium"
                style={{
                  backgroundColor: "rgb(var(--colors-button-primary-bg))",
                  color: "rgb(var(--colors-button-primary-text))",
                }}
                onClick={() => onOpenChange(false)}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
