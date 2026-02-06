import type { Paint, ResolvedToken, SolidPaint } from "@clafoutis/studio-core";
import { bridgeColorToPaint } from "@clafoutis/studio-core";
import * as Popover from "@radix-ui/react-popover";
import { useMemo, useRef, useState, useSyncExternalStore } from "react";

import { getTokenStore } from "@/lib/studio-api";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface FillEditorProps {
  readonly fills: Paint[];
  readonly onUpdateFills: (fills: Paint[]) => void;
}

export function FillEditor({ fills, onUpdateFills }: FillEditorProps) {
  const store = getTokenStore();
  const cachedRef = useRef<ResolvedToken[]>([]);
  const prevLenRef = useRef(-1);
  const prevThemeRef = useRef("");
  const prevTokensRef = useRef<ResolvedToken[] | null>(null);

  const colorTokens = useSyncExternalStore(store.subscribe, () => {
    const state = store.getState();
    const theme = state.activeTheme;
    const tokens = state.resolvedTokens;

    if (
      tokens !== prevTokensRef.current ||
      tokens.length !== prevLenRef.current ||
      theme !== prevThemeRef.current
    ) {
      prevTokensRef.current = tokens;
      prevLenRef.current = tokens.length;
      prevThemeRef.current = theme;
      cachedRef.current = state.getTokensByCategory("colors");
    }

    return cachedRef.current;
  });

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTokens = useMemo(() => {
    if (!search) return colorTokens;
    const lower = search.toLowerCase();
    return colorTokens.filter(
      (t) =>
        t.path.toLowerCase().includes(lower) ||
        String(t.resolvedValue).toLowerCase().includes(lower),
    );
  }, [colorTokens, search]);

  const handleSelectToken = (token: ResolvedToken) => {
    const paint = bridgeColorToPaint(token);
    if (paint) {
      const newFill: SolidPaint = {
        ...paint,
        tokenPath: token.path,
      };
      onUpdateFills([newFill]);
      setOpen(false);
      setSearch("");
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
    const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
    const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
    const newFill: SolidPaint = {
      type: "SOLID",
      color: { r, g, b, a: 1 },
    };
    onUpdateFills([newFill]);
  };

  const currentFill = fills[0] as SolidPaint | undefined;
  const currentColor =
    currentFill?.type === "SOLID"
      ? `rgb(${Math.round(currentFill.color.r * 255)}, ${Math.round(currentFill.color.g * 255)}, ${Math.round(currentFill.color.b * 255)})`
      : "#cccccc";

  return (
    <div>
      <Label className="text-xs text-studio-text-muted">Fill</Label>
      <div className="mt-1 flex items-center gap-2">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="h-8 w-16 rounded border border-studio-border cursor-pointer hover:ring-2 hover:ring-studio-accent transition-all"
              style={{ backgroundColor: currentColor }}
              aria-label="Select fill color"
            />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-50 w-80 rounded-lg border border-studio-border bg-studio-bg p-4 shadow-lg"
              sideOffset={5}
            >
              <div className="space-y-3">
                <div>
                  <Label className="mb-1 block text-xs font-medium text-studio-text">
                    Design Tokens
                  </Label>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tokens..."
                    className="mb-2 text-xs"
                  />
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filteredTokens.length === 0 ? (
                      <div className="py-4 text-center text-xs text-studio-text-muted">
                        No tokens found
                      </div>
                    ) : (
                      filteredTokens.map((token) => {
                        const resolvedColor =
                          typeof token.resolvedValue === "string"
                            ? token.resolvedValue
                            : "#000000";
                        const isSelected =
                          currentFill?.tokenPath === token.path;
                        return (
                          <button
                            key={token.path}
                            type="button"
                            onClick={() => handleSelectToken(token)}
                            className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors ${
                              isSelected
                                ? "bg-studio-accent text-white"
                                : "text-studio-text hover:bg-studio-bg-secondary"
                            }`}
                          >
                            <div
                              className="h-4 w-4 rounded border border-studio-border shrink-0"
                              style={{ backgroundColor: resolvedColor }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-mono">
                                {token.path}
                              </div>
                              <div className="truncate text-studio-text-muted">
                                {typeof token.resolvedValue === "string"
                                  ? token.resolvedValue
                                  : JSON.stringify(token.resolvedValue)}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-studio-border pt-3">
                  <Label className="mb-1 block text-xs font-medium text-studio-text">
                    Custom Color
                  </Label>
                  <input
                    type="color"
                    value={
                      currentFill?.type === "SOLID"
                        ? `#${[
                            currentFill.color.r,
                            currentFill.color.g,
                            currentFill.color.b,
                          ]
                            .map((c) => Math.round(c * 255))
                            .map((c) => c.toString(16).padStart(2, "0"))
                            .join("")}`
                        : "#cccccc"
                    }
                    onChange={handleColorChange}
                    className="h-8 w-full cursor-pointer rounded border border-studio-border"
                  />
                </div>
              </div>
              <Popover.Arrow className="fill-studio-border" />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        {currentFill?.tokenPath &&
          (() => {
            const token = colorTokens.find(
              (t) => t.path === currentFill.tokenPath,
            );
            let resolvedValue = "";
            if (token?.resolvedValue) {
              if (typeof token.resolvedValue === "string") {
                resolvedValue = token.resolvedValue;
              } else {
                resolvedValue = JSON.stringify(token.resolvedValue);
              }
            }
            return (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-studio-text truncate">
                  {currentFill.tokenPath}
                </div>
                <div className="text-xs text-studio-text-muted truncate">
                  {resolvedValue}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
}
