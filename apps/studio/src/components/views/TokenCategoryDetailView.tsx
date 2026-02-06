import type { ResolvedToken } from "@clafoutis/studio-core";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Redo2, Search, Undo2 } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface TokenCategoryDetailViewProps {
  projectId: string;
  category: string;
  search: string;
  tokens: ResolvedToken[];
  canUndo: boolean;
  canRedo: boolean;
  onSearchChange: (value: string) => void;
  onUpdateToken: (path: string, value: unknown) => void;
  onUndo: () => void;
  onRedo: () => void;
}

const TokenCategoryDetailView = ({
  projectId,
  category,
  search,
  tokens,
  canUndo,
  canRedo,
  onSearchChange,
  onUpdateToken,
  onUndo,
  onRedo,
}: TokenCategoryDetailViewProps) => (
  <div className="space-y-4 overflow-y-auto p-6">
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
      <Button variant="ghost" size="icon" disabled={!canUndo} onClick={onUndo}>
        <Undo2 size={16} />
      </Button>
      <Button variant="ghost" size="icon" disabled={!canRedo} onClick={onRedo}>
        <Redo2 size={16} />
      </Button>
      <Button size="sm">
        <Plus size={14} className="mr-1" />
        Add Token
      </Button>
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
          {tokens.map((token) => (
            <tr
              key={token.path}
              className="border-b border-studio-border last:border-0 hover:bg-studio-bg-secondary"
            >
              <td className="px-4 py-2">
                {token.type === "color" &&
                  typeof token.resolvedValue === "string" && (
                    <div
                      className="h-6 w-6 rounded border border-studio-border"
                      style={{ backgroundColor: token.resolvedValue as string }}
                    />
                  )}
              </td>
              <td className="px-4 py-2 font-mono text-xs text-studio-text">
                {token.path}
              </td>
              <td className="px-4 py-2">
                <input
                  className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-studio-text-secondary hover:border-studio-border focus:border-studio-accent focus:outline-none"
                  defaultValue={String(token.value)}
                  onBlur={(e) => {
                    if (e.target.value !== String(token.value)) {
                      onUpdateToken(token.path, e.target.value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      (e.target as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      (e.target as HTMLInputElement).value = String(
                        token.value,
                      );
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                />
              </td>
              <td className="px-4 py-2 font-mono text-xs text-studio-text-muted">
                {String(token.resolvedValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TokenCategoryDetailView;
