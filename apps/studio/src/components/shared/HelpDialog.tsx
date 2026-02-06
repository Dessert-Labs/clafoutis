import { getShortcuts } from "@/lib/keyboard";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

const tips = [
  "Hold Space and drag to pan the canvas",
  "Alt+drag to duplicate a shape",
  "Click a token value to edit inline",
  "Use the reference picker to link tokens instead of typing paths",
  "Cmd+Z works for both canvas and token edits",
  "Right-click anything for more options",
  "Drag and drop local files onto the Dashboard to import tokens",
];

interface HelpDialogProps {
  open: boolean;
  search: string;
  onOpenChange: (open: boolean) => void;
  onSearchChange: (search: string) => void;
}

function formatKey(s: {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}) {
  const parts: string[] = [];
  if (s.ctrl) parts.push("Cmd");
  if (s.shift) parts.push("Shift");
  if (s.alt) parts.push("Alt");
  parts.push(s.key.length === 1 ? s.key.toUpperCase() : s.key);
  return parts.join("+");
}

export function HelpDialog({
  open,
  search,
  onOpenChange,
  onSearchChange,
}: Readonly<HelpDialogProps>) {
  const shortcuts = getShortcuts();
  const lowerSearch = search.toLowerCase();

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.description.toLowerCase().includes(lowerSearch) ||
      s.key.toLowerCase().includes(lowerSearch),
  );

  const filteredTips = tips.filter((t) =>
    t.toLowerCase().includes(lowerSearch),
  );

  const grouped = {
    canvas: filteredShortcuts.filter((s) => s.context === "canvas"),
    tokens: filteredShortcuts.filter((s) => s.context === "tokens"),
    global: filteredShortcuts.filter(
      (s) => s.context === "global" || !s.context,
    ),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogTitle>Keyboard Shortcuts & Tips</DialogTitle>
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="mt-3"
        />

        {Object.entries(grouped).map(([context, items]) =>
          items.length > 0 ? (
            <div key={context} className="mt-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-studio-text-muted">
                {context}
              </h4>
              <div className="space-y-1">
                {items.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 text-sm"
                  >
                    <span className="text-studio-text-secondary">
                      {s.description}
                    </span>
                    <kbd className="rounded bg-studio-bg-tertiary px-2 py-0.5 font-mono text-xs text-studio-text">
                      {formatKey(s)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ) : null,
        )}

        {filteredTips.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-studio-text-muted">
              Tips & Tricks
            </h4>
            <ul className="space-y-1 text-sm text-studio-text-secondary">
              {filteredTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 text-studio-accent">&#8226;</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
