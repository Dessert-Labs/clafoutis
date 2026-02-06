import type { DesignNode, SceneNode } from "@clafoutis/studio-core";
import { ChevronRight, Eye, EyeOff, Lock, Unlock } from "lucide-react";

import { cn } from "@/lib/utils";

interface LayersPanelProps {
  nodes: DesignNode[];
  allNodes: Map<string, DesignNode>;
  selectedIds: Set<string>;
  onSelectNode: (id: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
}

export function LayersPanel({
  nodes,
  allNodes,
  selectedIds,
  onSelectNode,
  onToggleVisible,
  onToggleLocked,
}: Readonly<LayersPanelProps>) {
  return (
    <div className="p-2">
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-studio-text-muted">
        Layers
      </h3>
      <div className="space-y-0.5">
        {nodes.map((node) => (
          <LayerItem
            key={node.id}
            node={node}
            allNodes={allNodes}
            selectedIds={selectedIds}
            depth={0}
            onSelectNode={onSelectNode}
            onToggleVisible={onToggleVisible}
            onToggleLocked={onToggleLocked}
          />
        ))}
        {nodes.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-studio-text-muted">
            No layers
          </p>
        )}
      </div>
    </div>
  );
}

interface LayerItemProps {
  node: DesignNode;
  allNodes: Map<string, DesignNode>;
  selectedIds: Set<string>;
  depth: number;
  onSelectNode: (id: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
}

function LayerItem({
  node,
  allNodes,
  selectedIds,
  depth,
  onSelectNode,
  onToggleVisible,
  onToggleLocked,
}: Readonly<LayerItemProps>) {
  const scene = node as SceneNode;
  const isSelected = selectedIds.has(node.id);
  const hasChildren = scene.children?.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs",
          isSelected
            ? "bg-studio-accent/10 text-studio-accent"
            : "text-studio-text-secondary hover:bg-studio-bg-tertiary",
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        {hasChildren && <ChevronRight size={12} />}
        <span className="flex-1 truncate">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible(node.id, !scene.visible);
          }}
          className="opacity-50 hover:opacity-100"
        >
          {scene.visible ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLocked(node.id, !scene.locked);
          }}
          className="opacity-50 hover:opacity-100"
        >
          {scene.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>
      {hasChildren &&
        scene.children
          .map((childId) => allNodes.get(childId))
          .filter(Boolean)
          .map((child) => (
            <LayerItem
              key={child!.id}
              node={child!}
              allNodes={allNodes}
              selectedIds={selectedIds}
              depth={depth + 1}
              onSelectNode={onSelectNode}
              onToggleVisible={onToggleVisible}
              onToggleLocked={onToggleLocked}
            />
          ))}
    </div>
  );
}
