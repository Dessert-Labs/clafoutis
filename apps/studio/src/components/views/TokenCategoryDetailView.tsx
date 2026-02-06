import type { ResolvedToken } from "@clafoutis/studio-core";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Redo2, Save, Search, Undo2 } from "lucide-react";
import { useState } from "react";

import AddTokenDialog from "../tokens/AddTokenDialog";
import ColorTokenEditor from "../tokens/ColorTokenEditor";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TokenCategoryDetailViewProps {
  projectId: string;
  category: string;
  search: string;
  tokens: ResolvedToken[];
  canUndo: boolean;
  canRedo: boolean;
  dirtyCount: number;
  tokenFiles: string[];
  onSearchChange: (value: string) => void;
  onUpdateToken: (path: string, value: unknown) => void;
  onInputDirty: (path: string, value: unknown) => void;
  onSaveAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddToken: (
    path: string,
    type: string,
    value: unknown,
    filePath: string,
  ) => void;
}

const TokenCategoryDetailView = ({
  projectId,
  category,
  search,
  tokens,
  canUndo,
  canRedo,
  dirtyCount,
  tokenFiles,
  onSearchChange,
  onUpdateToken,
  onInputDirty,
  onSaveAll,
  onUndo,
  onRedo,
  onAddToken,
}: TokenCategoryDetailViewProps) => {
  const [localDirty, setLocalDirty] = useState<Map<string, string>>(new Map());

  return (
    <div className="flex-1 min-w-0 space-y-4 overflow-y-auto p-6">
      <div className="flex items-center gap-3">
        <Link
          to="/projects/$projectId/tokens"
          params={{ projectId }}
          className="rounded-md p-1 hover:bg-studio-bg-tertiary"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold capitalize text-studio-text">
          {category}
        </h1>
        <span className="text-sm text-studio-text-muted">
          {tokens.length} tokens
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-studio-text-muted"
          />
          <Input
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          onClick={onUndo}
        >
          <Undo2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          onClick={onRedo}
        >
          <Redo2 size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={dirtyCount === 0}
          onClick={onSaveAll}
          title={dirtyCount > 0 ? `Save All (${dirtyCount})` : "Save All"}
        >
          <Save size={16} />
          {dirtyCount > 0 && <span className="ml-1 text-xs">{dirtyCount}</span>}
        </Button>
        <AddTokenDialog
          category={category}
          tokenFiles={tokenFiles}
          onAddToken={onAddToken}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-studio-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-studio-border bg-studio-bg-secondary text-left">
              <th className="px-4 py-2 font-medium text-studio-text-muted">
                Preview
              </th>
              <th className="px-4 py-2 font-medium text-studio-text-muted">
                Path
              </th>
              <th className="px-4 py-2 font-medium text-studio-text-muted">
                Value
              </th>
              <th className="px-4 py-2 font-medium text-studio-text-muted">
                Resolved
              </th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const storedValue = String(token.value);
              const dirtyValue = localDirty.get(token.path);
              const isDirty =
                dirtyValue !== undefined && dirtyValue !== storedValue;
              const displayValue = dirtyValue ?? storedValue;

              return (
                <tr
                  key={token.path}
                  className="border-b border-studio-border last:border-0 hover:bg-studio-bg-secondary"
                >
                  <td className="px-4 py-2">
                    {token.type === "color" &&
                    typeof token.resolvedValue === "string" ? (
                      <ColorTokenEditor
                        token={token}
                        onUpdateToken={onUpdateToken}
                      />
                    ) : null}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-studio-text">
                    {token.path}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <input
                        key={token.path + storedValue}
                        className="flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-studio-text-secondary hover:border-studio-border focus:border-studio-accent focus:outline-none"
                        defaultValue={displayValue}
                        onInput={(e) => {
                          const value = (e.target as HTMLInputElement).value;
                          setLocalDirty((prev) => {
                            const next = new Map(prev);
                            if (value !== storedValue) {
                              next.set(token.path, value);
                            } else {
                              next.delete(token.path);
                            }
                            return next;
                          });
                          onInputDirty(token.path, value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (value !== storedValue) {
                            onUpdateToken(token.path, value);
                            setLocalDirty((prev) => {
                              const next = new Map(prev);
                              next.delete(token.path);
                              return next;
                            });
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = (e.target as HTMLInputElement).value;
                            if (value !== storedValue) {
                              onUpdateToken(token.path, value);
                              setLocalDirty((prev) => {
                                const next = new Map(prev);
                                next.delete(token.path);
                                return next;
                              });
                            }
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") {
                            (e.target as HTMLInputElement).value = storedValue;
                            setLocalDirty((prev) => {
                              const next = new Map(prev);
                              next.delete(token.path);
                              return next;
                            });
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                      />
                      {isDirty && (
                        <button
                          type="button"
                          onClick={(e) => {
                            const input =
                              e.currentTarget.parentElement?.querySelector(
                                "input",
                              ) as HTMLInputElement | null;
                            const value = input?.value ?? dirtyValue!;
                            onUpdateToken(token.path, value);
                            setLocalDirty((prev) => {
                              const next = new Map(prev);
                              next.delete(token.path);
                              return next;
                            });
                          }}
                          className="rounded p-0.5 text-studio-accent hover:bg-studio-bg-tertiary"
                          title="Save"
                        >
                          <Check size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-studio-text-muted">
                    {String(token.resolvedValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TokenCategoryDetailView;
