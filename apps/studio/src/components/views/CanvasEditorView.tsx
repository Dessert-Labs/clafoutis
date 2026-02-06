import type { DesignNode, ToolType } from "@clafoutis/studio-core";
import React from "react";

import { Canvas } from "../canvas/Canvas";
import { LayersPanel } from "../panels/LayersPanel";
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { Toolbar } from "../panels/Toolbar";

interface CanvasEditorViewProps {
  canvasRef: React.Ref<HTMLCanvasElement>;
  activeTool: ToolType;
  pageNodes: DesignNode[];
  allNodes: Map<string, DesignNode>;
  selectedIds: Set<string>;
  selectedNode: DesignNode | null;
  onSetTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSelectNode: (id: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onToggleLocked: (id: string, locked: boolean) => void;
  onUpdateProp: (id: string, key: string, value: unknown) => void;
}

const CanvasEditorView = ({
  canvasRef,
  activeTool,
  pageNodes,
  allNodes,
  selectedIds,
  selectedNode,
  onSetTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onSelectNode,
  onToggleVisible,
  onToggleLocked,
  onUpdateProp,
}: CanvasEditorViewProps) => (
  <div className="flex flex-1 flex-col overflow-hidden">
    <div className="border-b border-studio-border">
      <Toolbar
        activeTool={activeTool}
        onSetTool={onSetTool}
        onUndo={onUndo}
        onRedo={onRedo}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
      />
    </div>
    <div className="flex flex-1 overflow-hidden">
      <div className="w-60 overflow-y-auto border-r border-studio-border">
        <LayersPanel
          nodes={pageNodes}
          allNodes={allNodes}
          selectedIds={selectedIds}
          onSelectNode={onSelectNode}
          onToggleVisible={onToggleVisible}
          onToggleLocked={onToggleLocked}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <Canvas ref={canvasRef} />
      </div>
      <div className="w-72 overflow-y-auto border-l border-studio-border">
        <PropertiesPanel
          selectedNode={selectedNode}
          onUpdateProp={onUpdateProp}
        />
      </div>
    </div>
  </div>
);

export default CanvasEditorView;
