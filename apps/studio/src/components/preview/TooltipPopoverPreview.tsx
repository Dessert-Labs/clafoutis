import { useCallback, useEffect, useRef, useState } from "react";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

function Tooltip({ content, children }: Readonly<TooltipProps>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
      >
        {children}
      </div>
      {visible && (
        <div
          className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded px-2 py-1 text-xs shadow-md"
          style={{
            backgroundColor: "rgb(var(--colors-tooltip-bg))",
            color: "rgb(var(--colors-tooltip-text))",
          }}
        >
          {content}
          <div
            className="absolute left-1/2 top-full -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: "4px solid rgb(var(--colors-tooltip-bg))",
            }}
          />
        </div>
      )}
    </div>
  );
}

interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

function Popover({
  open,
  onOpenChange,
  trigger,
  children,
}: Readonly<PopoverProps>) {
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
      <div
        role="button"
        tabIndex={0}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpenChange(!open);
        }}
      >
        {trigger}
      </div>
      {open && (
        <div
          className="absolute left-0 top-full z-10 mt-2 w-64 rounded-lg border p-4 shadow-lg"
          style={{
            backgroundColor: "rgb(var(--colors-popover-bg))",
            borderColor: "rgb(var(--colors-popover-border))",
            color: "rgb(var(--colors-popover-text))",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface TooltipPopoverPreviewProps {
  popoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
}

export function TooltipPopoverPreview({
  popoverOpen,
  onPopoverOpenChange,
}: Readonly<TooltipPopoverPreviewProps>) {
  return (
    <div className="space-y-6">
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Tooltips
        </h4>
        <div className="flex gap-4">
          <Tooltip content="This is a tooltip">
            <button
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "rgb(var(--colors-button-secondary-bg))",
                color: "rgb(var(--colors-button-secondary-text))",
              }}
            >
              Hover me
            </button>
          </Tooltip>
          <Tooltip content="Another tooltip with more info">
            <button
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "rgb(var(--colors-button-outline-bg))",
                color: "rgb(var(--colors-button-outline-text))",
                border: "1px solid",
                borderColor: "rgb(var(--colors-button-outline-border))",
              }}
            >
              Or me
            </button>
          </Tooltip>
        </div>
      </div>

      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Popover
        </h4>
        <Popover
          open={popoverOpen}
          onOpenChange={onPopoverOpenChange}
          trigger={
            <button
              className="rounded-md px-3 py-1.5 text-sm font-medium"
              style={{
                backgroundColor: "rgb(var(--colors-button-secondary-bg))",
                color: "rgb(var(--colors-button-secondary-text))",
              }}
            >
              Open Popover
            </button>
          }
        >
          <p className="mb-2 text-sm font-medium">Popover Title</p>
          <p
            className="text-xs"
            style={{ color: "rgb(var(--colors-text-secondary))" }}
          >
            This is a popover with some content. It closes when you click
            outside.
          </p>
        </Popover>
      </div>
    </div>
  );
}
