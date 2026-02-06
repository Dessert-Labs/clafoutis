import type { ToolType } from "@clafoutis/studio-core";
import {
  Circle,
  Hand,
  Minus,
  MousePointer,
  Pen,
  Plus,
  Redo2,
  Square,
  Star,
  Type,
  Undo2,
  ZoomIn,
} from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

const tools: { type: ToolType; icon: React.ElementType; label: string }[] = [
  { type: "SELECT", icon: MousePointer, label: "Select (V)" },
  { type: "FRAME", icon: Square, label: "Frame (F)" },
  { type: "RECTANGLE", icon: Square, label: "Rectangle (R)" },
  { type: "ELLIPSE", icon: Circle, label: "Ellipse (O)" },
  { type: "LINE", icon: Minus, label: "Line (L)" },
  { type: "STAR", icon: Star, label: "Star" },
  { type: "PEN", icon: Pen, label: "Pen (P)" },
  { type: "TEXT", icon: Type, label: "Text (T)" },
  { type: "HAND", icon: Hand, label: "Hand (H)" },
  { type: "ZOOM", icon: ZoomIn, label: "Zoom (Z)" },
];

interface ToolbarProps {
  activeTool: ToolType;
  onSetTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export function Toolbar({
  activeTool,
  onSetTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
}: Readonly<ToolbarProps>) {
  return (
    <div className="flex h-10 items-center gap-1 bg-studio-bg-secondary px-2">
      {tools.map(({ type, icon: Icon, label }) => (
        <button
          key={type}
          title={label}
          onClick={() => onSetTool(type)}
          className={cn(
            "rounded p-1.5 transition-colors",
            activeTool === type
              ? "bg-studio-accent text-white"
              : "text-studio-text-secondary hover:bg-studio-bg-tertiary",
          )}
        >
          <Icon size={16} />
        </button>
      ))}

      <div className="mx-2 h-5 w-px bg-studio-border" />

      <button
        title="Undo (Cmd+Z)"
        onClick={onUndo}
        className="rounded p-1.5 text-studio-text-secondary hover:bg-studio-bg-tertiary"
      >
        <Undo2 size={16} />
      </button>
      <button
        title="Redo (Cmd+Shift+Z)"
        onClick={onRedo}
        className="rounded p-1.5 text-studio-text-secondary hover:bg-studio-bg-tertiary"
      >
        <Redo2 size={16} />
      </button>

      <div className="mx-2 h-5 w-px bg-studio-border" />

      <button
        title="Zoom In"
        onClick={onZoomIn}
        className="rounded p-1.5 text-studio-text-secondary hover:bg-studio-bg-tertiary"
      >
        <Plus size={16} />
      </button>
      <button
        title="Zoom Out"
        onClick={onZoomOut}
        className="rounded p-1.5 text-studio-text-secondary hover:bg-studio-bg-tertiary"
      >
        <Minus size={16} />
      </button>
    </div>
  );
}
