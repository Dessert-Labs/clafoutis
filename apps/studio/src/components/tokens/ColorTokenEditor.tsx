import type { ResolvedToken } from "@clafoutis/studio-core";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useState } from "react";

import { Input } from "../ui/input";

interface ColorTokenEditorProps {
  token: ResolvedToken;
  onUpdateToken: (path: string, value: unknown) => void;
}

/**
 * Popover color editor for color tokens.
 * Opens on swatch click, provides native color picker and text input.
 * Commits the value to the store when the popover closes.
 */
export default function ColorTokenEditor({
  token,
  onUpdateToken,
}: ColorTokenEditorProps) {
  const [open, setOpen] = useState(false);
  const [colorValue, setColorValue] = useState(String(token.value));
  const [textValue, setTextValue] = useState(String(token.value));

  useEffect(() => {
    if (!open) {
      setColorValue(String(token.value));
      setTextValue(String(token.value));
    }
  }, [token.value, open]);

  /**
   * Extracts a hex color from a value string for the native color input.
   * Handles hex, rgba, and falls back to the resolved value or black.
   */
  const getHexFromValue = (value: string): string => {
    if (value.startsWith("#")) return value;
    if (value.startsWith("rgba")) {
      const match = value.match(
        /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
      );
      if (match) {
        const r = parseInt(match[1], 10);
        const g = parseInt(match[2], 10);
        const b = parseInt(match[3], 10);
        return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
      }
    }
    if (
      typeof token.resolvedValue === "string" &&
      token.resolvedValue.startsWith("#")
    ) {
      return token.resolvedValue;
    }
    return "#000000";
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setColorValue(hex);
    setTextValue(hex);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    if (e.target.value.startsWith("#")) {
      setColorValue(e.target.value);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open && textValue !== String(token.value)) {
      onUpdateToken(token.path, textValue);
    }
    setOpen(newOpen);
  };

  const resolvedColor =
    typeof token.resolvedValue === "string" ? token.resolvedValue : "#000000";

  const liveColor = textValue.startsWith("#") ? textValue : resolvedColor;

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="h-6 w-6 rounded border border-studio-border cursor-pointer hover:ring-2 hover:ring-studio-accent transition-all"
          style={{ backgroundColor: resolvedColor }}
          aria-label={`Edit color ${token.path}`}
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-64 rounded-lg border border-studio-border bg-studio-bg p-4 shadow-lg"
          sideOffset={5}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="h-8 w-8 rounded border border-studio-border shrink-0"
                style={{ backgroundColor: liveColor }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-studio-text truncate">
                  {token.path}
                </div>
                <div className="text-xs text-studio-text-muted truncate">
                  {textValue}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-studio-text">
                Color
              </label>
              <input
                type="color"
                value={getHexFromValue(colorValue)}
                onChange={handleColorChange}
                className="h-8 w-full cursor-pointer rounded border border-studio-border"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-studio-text">
                Value
              </label>
              <Input
                value={textValue}
                onChange={handleTextChange}
                placeholder="#ff0000 or {colors.slate.100}"
                className="text-xs"
              />
              <p className="mt-1 text-xs text-studio-text-muted">
                Enter hex, rgba, or token reference
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Popover.Close asChild>
                <button
                  type="button"
                  className="rounded-md border border-studio-border bg-studio-bg-secondary px-3 py-1 text-xs text-studio-text hover:bg-studio-bg-tertiary"
                >
                  Done
                </button>
              </Popover.Close>
            </div>
          </div>
          <Popover.Arrow className="fill-studio-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
