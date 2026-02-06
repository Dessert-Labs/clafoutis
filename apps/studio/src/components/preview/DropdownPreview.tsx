import { useCallback, useEffect, useRef } from "react";

interface DropdownItem {
  label: string;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
}

const items: DropdownItem[] = [
  { label: "Edit", shortcut: "Ctrl+E" },
  { label: "Duplicate", shortcut: "Ctrl+D" },
  { label: "", separator: true },
  { label: "Archive" },
  { label: "Move to..." },
  { label: "", separator: true },
  { label: "Delete", shortcut: "Del" },
];

interface DropdownPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DropdownPreview({
  open,
  onOpenChange,
}: Readonly<DropdownPreviewProps>) {
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        className="rounded-md px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: "rgb(var(--colors-button-secondary-bg))",
          color: "rgb(var(--colors-button-secondary-text))",
        }}
        onClick={() => onOpenChange(!open)}
      >
        Actions
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-10 mt-1 w-56 rounded-lg border py-1 shadow-lg"
          style={{
            backgroundColor: "rgb(var(--colors-dropdown-bg))",
            borderColor: "rgb(var(--colors-dropdown-border))",
          }}
        >
          {items.map((item, i) =>
            item.separator ? (
              <div
                key={`sep-${item.label}-${i}`}
                className="my-1 h-px"
                style={{
                  backgroundColor: "rgb(var(--colors-dropdown-separator))",
                }}
              />
            ) : (
              <button
                key={item.label}
                className="flex w-full items-center justify-between px-3 py-2 text-sm transition-colors"
                style={{
                  color: item.disabled
                    ? "rgb(var(--colors-text-disabled))"
                    : "rgb(var(--colors-dropdown-text))",
                  cursor: item.disabled ? "not-allowed" : "pointer",
                }}
                disabled={item.disabled}
                onMouseEnter={(e) => {
                  if (!item.disabled) {
                    e.currentTarget.style.backgroundColor =
                      "rgb(var(--colors-dropdown-hover))";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgb(var(--colors-dropdown-item-bg))";
                }}
                onClick={() => onOpenChange(false)}
              >
                <span>{item.label}</span>
                {item.shortcut && (
                  <span
                    className="text-xs"
                    style={{ color: "rgb(var(--colors-text-tertiary))" }}
                  >
                    {item.shortcut}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
