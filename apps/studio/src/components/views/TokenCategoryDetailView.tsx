import "vanilla-jsoneditor/themes/jse-theme-dark.css";

import type { ResolvedToken } from "@clafoutis/studio-core";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Redo2, Save, Search, Undo2 } from "lucide-react";
import { useState } from "react";
import type { Content } from "vanilla-jsoneditor";

import VanillaJSONEditor from "../json/VanillaJSONEditor";
import AddTokenDialog from "../tokens/AddTokenDialog";
import ColorTokenEditor from "../tokens/ColorTokenEditor";
import MotionTokenEditor from "../tokens/MotionTokenEditor";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

interface TokenCategoryDetailViewProps {
  projectId: string;
  category: string;
  search: string;
  tokens: ResolvedToken[];
  existingTokenPaths: string[];
  canUndo: boolean;
  canRedo: boolean;
  dirtyCount: number;
  tokenFiles: string[];
  fileTokenCounts: Record<string, number>;
  selectedTokenFile: string;
  onSearchChange: (value: string) => void;
  onSelectedTokenFileChange: (value: string) => void;
  onUpdateToken: (path: string, value: unknown, filePath: string) => void;
  onInputDirty: (path: string, value: unknown, filePath: string) => void;
  onSaveAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAddToken: (
    path: string,
    type: string,
    value: unknown,
    filePath: string,
  ) => void;
  onCopyTokenFileJSON: (filePath: string) => Promise<void>;
  onGetTokenFileJSON: (filePath: string) => Promise<string>;
  onImportTokenFileJSON: (filePath: string, jsonText: string) => Promise<void>;
}

const TokenCategoryDetailView = ({
  projectId,
  category,
  search,
  tokens,
  existingTokenPaths,
  canUndo,
  canRedo,
  dirtyCount,
  tokenFiles,
  fileTokenCounts,
  selectedTokenFile,
  onSearchChange,
  onSelectedTokenFileChange,
  onUpdateToken,
  onInputDirty,
  onSaveAll,
  onUndo,
  onRedo,
  onAddToken,
  onCopyTokenFileJSON,
  onGetTokenFileJSON,
  onImportTokenFileJSON,
}: TokenCategoryDetailViewProps) => {
  const [localDirty, setLocalDirty] = useState<Map<string, string>>(new Map());
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editorContent, setEditorContent] = useState<Content | null>(null);
  const [editorHasErrors, setEditorHasErrors] = useState(false);
  const [fileActionError, setFileActionError] = useState<string | null>(null);
  const [fileActionMessage, setFileActionMessage] = useState<string | null>(
    null,
  );
  const [isCopying, setIsCopying] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const totalCategoryTokens = Object.values(fileTokenCounts).reduce(
    (sum, count) => sum + count,
    0,
  );
  const canUseFileActions =
    tokenFiles.length > 0 &&
    selectedTokenFile.length > 0 &&
    selectedTokenFile !== "all";

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
          existingTokenPaths={existingTokenPaths}
          onAddToken={onAddToken}
        />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)] gap-4">
        <aside className="rounded-lg border border-studio-border bg-studio-bg-secondary p-3">
          <h2 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-studio-text-muted">
            Files
          </h2>
          <p className="mb-2 px-2 text-xs text-studio-text-muted">
            Counts reflect this category only.
          </p>
          <div className="space-y-1">
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${selectedTokenFile === "all" ? "bg-studio-bg-tertiary font-medium text-studio-text" : "text-studio-text-secondary hover:bg-studio-bg-tertiary hover:text-studio-text"}`}
              onClick={() => onSelectedTokenFileChange("all")}
            >
              <span>All files</span>
              <span className="text-xs text-studio-text-muted">
                {totalCategoryTokens}
              </span>
            </button>
            {tokenFiles.map((filePath) => (
              <button
                key={filePath}
                type="button"
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm ${selectedTokenFile === filePath ? "bg-studio-bg-tertiary font-medium text-studio-text" : "text-studio-text-secondary hover:bg-studio-bg-tertiary hover:text-studio-text"}`}
                onClick={() => onSelectedTokenFileChange(filePath)}
                title={filePath}
              >
                <span className="truncate">{filePath}</span>
                <span className="ml-2 shrink-0 text-xs text-studio-text-muted">
                  {fileTokenCounts[filePath] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm text-studio-text-muted">
              {selectedTokenFile === "all"
                ? `Showing ${tokens.length} tokens across all files`
                : `Showing ${tokens.length} tokens in ${selectedTokenFile}`}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canUseFileActions || isCopying}
                onClick={async () => {
                  if (!canUseFileActions) return;
                  setIsCopying(true);
                  setFileActionError(null);
                  setFileActionMessage(null);
                  try {
                    await onCopyTokenFileJSON(selectedTokenFile);
                    setFileActionMessage(
                      `Copied JSON for ${selectedTokenFile}.`,
                    );
                  } catch (error) {
                    setFileActionError(
                      error instanceof Error
                        ? error.message
                        : "Failed to copy token file JSON.",
                    );
                  } finally {
                    setIsCopying(false);
                  }
                }}
              >
                Copy JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canUseFileActions}
                onClick={async () => {
                  if (!canUseFileActions) return;
                  setFileActionError(null);
                  setFileActionMessage(null);
                  try {
                    const currentJSON =
                      await onGetTokenFileJSON(selectedTokenFile);
                    setEditorContent({ json: JSON.parse(currentJSON) });
                    setEditorHasErrors(false);
                    setShowImportDialog(true);
                  } catch (error) {
                    setFileActionError(
                      error instanceof Error
                        ? error.message
                        : "Failed to load token file JSON.",
                    );
                  }
                }}
              >
                Edit JSON
              </Button>
            </div>
          </div>
          {fileActionError ? (
            <p className="mb-2 text-sm text-studio-error">{fileActionError}</p>
          ) : null}
          {fileActionMessage ? (
            <p className="mb-2 text-sm text-studio-success">
              {fileActionMessage}
            </p>
          ) : null}

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
                        {(() => {
                          if (
                            token.type === "color" &&
                            typeof token.resolvedValue === "string"
                          ) {
                            return (
                              <ColorTokenEditor
                                token={token}
                                onUpdateToken={(path, value) =>
                                  onUpdateToken(path, value, token.filePath)
                                }
                              />
                            );
                          }
                          if (
                            token.type === "duration" ||
                            token.type === "cubicBezier"
                          ) {
                            return (
                              <MotionTokenEditor
                                token={token}
                                onUpdateToken={(path, value) =>
                                  onUpdateToken(path, value, token.filePath)
                                }
                              />
                            );
                          }
                          return null;
                        })()}
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
                              const value = (e.target as HTMLInputElement)
                                .value;
                              setLocalDirty((prev) => {
                                const next = new Map(prev);
                                if (value === storedValue) {
                                  next.delete(token.path);
                                } else {
                                  next.set(token.path, value);
                                }
                                return next;
                              });
                              onInputDirty(token.path, value, token.filePath);
                            }}
                            onBlur={(e) => {
                              const value = e.target.value;
                              if (value !== storedValue) {
                                onUpdateToken(
                                  token.path,
                                  value,
                                  token.filePath,
                                );
                                setLocalDirty((prev) => {
                                  const next = new Map(prev);
                                  next.delete(token.path);
                                  return next;
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const value = (e.target as HTMLInputElement)
                                  .value;
                                if (value !== storedValue) {
                                  onUpdateToken(
                                    token.path,
                                    value,
                                    token.filePath,
                                  );
                                  setLocalDirty((prev) => {
                                    const next = new Map(prev);
                                    next.delete(token.path);
                                    return next;
                                  });
                                }
                                (e.target as HTMLInputElement).blur();
                              }
                              if (e.key === "Escape") {
                                (e.target as HTMLInputElement).value =
                                  storedValue;
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
                                const value = input?.value ?? storedValue;
                                onUpdateToken(
                                  token.path,
                                  value,
                                  token.filePath,
                                );
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
      </div>
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="h-[92vh] max-w-[96vw] p-0">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-studio-border p-6 pb-4">
              <DialogTitle>Edit JSON for {selectedTokenFile}</DialogTitle>
              <p className="mt-2 text-sm text-studio-text-secondary">
                Edit the JSON for this file, then save to replace the token
                file.
              </p>
            </div>
            <div className="flex-1 min-h-0 p-6 pt-4">
              {editorContent ? (
                <VanillaJSONEditor
                  content={editorContent}
                  onChange={(content, hasErrors) => {
                    setEditorContent(content);
                    setEditorHasErrors(hasErrors);
                  }}
                />
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t border-studio-border p-6 pt-4">
              <div className="text-sm text-studio-error">
                {editorHasErrors
                  ? "Fix JSON validation/parsing errors before saving."
                  : ""}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImportDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={
                    editorContent === null || editorHasErrors || isImporting
                  }
                  onClick={async () => {
                    if (!canUseFileActions) return;
                    if (!editorContent) return;
                    setIsImporting(true);
                    setFileActionError(null);
                    setFileActionMessage(null);
                    try {
                      const jsonText =
                        "json" in editorContent
                          ? JSON.stringify(editorContent.json, null, 2)
                          : editorContent.text;
                      await onImportTokenFileJSON(selectedTokenFile, jsonText);
                      setFileActionMessage(
                        `Imported JSON into ${selectedTokenFile}.`,
                      );
                      setShowImportDialog(false);
                      setEditorContent(null);
                    } catch (error) {
                      setFileActionError(
                        error instanceof Error
                          ? error.message
                          : "Failed to import token file JSON.",
                      );
                    } finally {
                      setIsImporting(false);
                    }
                  }}
                >
                  Save JSON
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokenCategoryDetailView;
