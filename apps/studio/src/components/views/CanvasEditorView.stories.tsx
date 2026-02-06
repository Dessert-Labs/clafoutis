import type { DesignNode } from "@clafoutis/studio-core";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { createRef } from "react";

import CanvasEditorView from "./CanvasEditorView";

const meta = {
  title: "Views/CanvasEditorView",
  component: CanvasEditorView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof CanvasEditorView>;

export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};

const mockNodes = [
  {
    id: "1",
    type: "RECTANGLE",
    name: "Background",
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    rotation: 0,
    opacity: 1,
    cornerRadius: 0,
    visible: true,
    locked: false,
    fills: [{ type: "SOLID", color: { r: 0.95, g: 0.95, b: 0.95, a: 1 } }],
    strokes: [],
    effects: [],
    blendMode: "NORMAL",
  },
  {
    id: "2",
    type: "RECTANGLE",
    name: "Card",
    x: 50,
    y: 50,
    width: 300,
    height: 200,
    rotation: 0,
    opacity: 1,
    cornerRadius: 8,
    visible: true,
    locked: false,
    fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
    strokes: [],
    effects: [],
    blendMode: "NORMAL",
  },
  {
    id: "3",
    type: "RECTANGLE",
    name: "Title Box",
    x: 70,
    y: 80,
    width: 260,
    height: 30,
    rotation: 0,
    opacity: 1,
    cornerRadius: 0,
    visible: true,
    locked: false,
    fills: [],
    strokes: [],
    effects: [],
    blendMode: "NORMAL",
  },
] as unknown as DesignNode[];

export const Default: Story = {
  args: {
    canvasRef: createRef<HTMLCanvasElement>(),
    activeTool: "SELECT",
    pageNodes: mockNodes,
    allNodes: new Map(mockNodes.map((n) => [n.id, n])),
    selectedIds: new Set<string>(),
    selectedNode: null,
    onSetTool: noop,
    onUndo: noop,
    onRedo: noop,
    onZoomIn: noop,
    onZoomOut: noop,
    onSelectNode: noop,
    onToggleVisible: noop,
    onToggleLocked: noop,
    onUpdateProp: noop,
  },
};

export const WithSelection: Story = {
  args: {
    ...Default.args,
    selectedIds: new Set(["2"]),
    selectedNode: mockNodes[1],
  },
};

export const EmptyCanvas: Story = {
  args: {
    ...Default.args,
    pageNodes: [],
    selectedIds: new Set<string>(),
    selectedNode: null,
  },
};

export const DrawingMode: Story = {
  args: {
    ...Default.args,
    activeTool: "RECTANGLE",
  },
};
