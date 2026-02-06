import type { DesignNode, ToolType } from "@clafoutis/studio-core";
import {
  renderDotGrid,
  renderNode,
  renderSelectionBox,
  renderSmartGuides,
} from "@clafoutis/studio-core";
import { useCallback, useEffect, useRef, useState } from "react";

import CanvasEditorView from "@/components/views/CanvasEditorView";
import { getEditorStore } from "@/lib/studio-api";

export function CanvasEditor() {
  const store = getEditorStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [activeTool, setActiveTool] = useState<ToolType>(
    store.getState().activeTool,
  );
  const [pageNodes, setPageNodes] = useState<DesignNode[]>([]);
  const [allNodes, setAllNodes] = useState<Map<string, DesignNode>>(new Map());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<DesignNode | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = store.getState();
    const { camera, nodes, smartGuides } = state;
    const currentPageNodes = state.getCurrentPageNodes();

    canvas.width = canvas.offsetWidth * globalThis.devicePixelRatio;
    canvas.height = canvas.offsetHeight * globalThis.devicePixelRatio;
    ctx.scale(globalThis.devicePixelRatio, globalThis.devicePixelRatio);

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    renderDotGrid(ctx, camera, canvas.offsetWidth, canvas.offsetHeight);

    for (const node of currentPageNodes) {
      renderNode(ctx, node, nodes);
    }

    for (const sel of state.getSelectedNodes()) {
      renderSelectionBox(ctx, sel as Parameters<typeof renderSelectionBox>[1]);
    }

    renderSmartGuides(ctx, smartGuides);
    ctx.restore();
  }, [store]);

  useEffect(() => {
    const unsub = store.subscribe((state) => {
      setActiveTool(state.activeTool);
      setPageNodes(state.getCurrentPageNodes());
      setAllNodes(state.nodes);
      setSelectedIds(new Set(state.selectedIds));
      const nodes = state.getSelectedNodes();
      setSelectedNode(nodes.length === 1 ? nodes[0] : null);
      requestAnimationFrame(render);
    });
    render();
    return unsub;
  }, [store, render]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      const state = store.getState();
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - state.camera.x) / state.camera.zoom;
      const y = (e.clientY - rect.top - state.camera.y) / state.camera.zoom;

      if (state.activeTool === "HAND") {
        state.setIsDrawing(true);
        state.setDrawStart({
          x: e.clientX - state.camera.x,
          y: e.clientY - state.camera.y,
        });
        return;
      }

      if (state.activeTool === "SELECT") {
        const page = state.pages.find((p) => p.id === state.currentPageId);
        if (!page) return;

        let hit: string | null = null;
        for (let i = page.children.length - 1; i >= 0; i--) {
          const node = state.nodes.get(page.children[i]);
          if (!node) continue;
          const s = node as {
            x: number;
            y: number;
            width: number;
            height: number;
            visible: boolean;
          };
          if (
            s.visible &&
            x >= s.x &&
            x <= s.x + s.width &&
            y >= s.y &&
            y <= s.y + s.height
          ) {
            hit = node.id;
            break;
          }
        }

        if (hit) {
          state.setSelectedIds(new Set([hit]));
          state.setIsDrawing(true);
          state.setDrawStart({ x, y });
        } else {
          state.setSelectedIds(new Set());
        }
        return;
      }

      if (
        ["RECTANGLE", "ELLIPSE", "FRAME", "LINE"].includes(state.activeTool)
      ) {
        state.pushHistory();
        state.createShape(
          state.activeTool as Parameters<typeof state.createShape>[0],
          x,
          y,
          { width: 0, height: 0 },
        );
        state.setIsDrawing(true);
        state.setDrawStart({ x, y });
      }

      if (state.activeTool === "TEXT") {
        state.pushHistory();
        state.createTextNode(x, y);
        state.setActiveTool("SELECT");
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const state = store.getState();
      if (!state.isDrawing || !state.drawStart) return;

      if (state.activeTool === "HAND") {
        state.setCamera({
          x: e.clientX - state.drawStart.x,
          y: e.clientY - state.drawStart.y,
        });
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - state.camera.x) / state.camera.zoom;
      const y = (e.clientY - rect.top - state.camera.y) / state.camera.zoom;

      if (state.activeTool === "SELECT" && state.selectedIds.size > 0) {
        const dx = x - state.drawStart.x;
        const dy = y - state.drawStart.y;
        state.moveNodes(Array.from(state.selectedIds), dx, dy);
        state.setDrawStart({ x, y });
        return;
      }

      const selected = Array.from(state.selectedIds);
      if (selected.length === 1) {
        const w = x - state.drawStart.x;
        const h = y - state.drawStart.y;
        state.updateNode(selected[0], {
          width: Math.abs(w),
          height: Math.abs(h),
        } as Record<string, unknown>);
      }
    };

    const handleMouseUp = () => {
      const state = store.getState();
      state.setIsDrawing(false);
      state.setDrawStart(null);
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = store.getState();
      if (e.ctrlKey || e.metaKey) {
        const delta = -e.deltaY * 0.001;
        const newZoom = Math.max(0.1, Math.min(5, state.camera.zoom + delta));
        state.setCamera({ zoom: newZoom });
      } else {
        state.setCamera({
          x: state.camera.x - e.deltaX,
          y: state.camera.y - e.deltaY,
        });
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, [store]);

  const handleSetTool = useCallback(
    (tool: ToolType) => store.getState().setActiveTool(tool),
    [store],
  );
  const handleUndo = useCallback(() => store.getState().undo(), [store]);
  const handleRedo = useCallback(() => store.getState().redo(), [store]);
  const handleZoomIn = useCallback(() => {
    const z = store.getState().camera.zoom;
    store.getState().setCamera({ zoom: Math.min(5, z + 0.1) });
  }, [store]);
  const handleZoomOut = useCallback(() => {
    const z = store.getState().camera.zoom;
    store.getState().setCamera({ zoom: Math.max(0.1, z - 0.1) });
  }, [store]);

  const handleSelectNode = useCallback(
    (id: string) => store.getState().setSelectedIds(new Set([id])),
    [store],
  );
  const handleToggleVisible = useCallback(
    (id: string, visible: boolean) => {
      store.getState().updateNode(id, { visible } as Partial<DesignNode>);
    },
    [store],
  );
  const handleToggleLocked = useCallback(
    (id: string, locked: boolean) => {
      store.getState().updateNode(id, { locked } as Partial<DesignNode>);
    },
    [store],
  );
  const handleUpdateProp = useCallback(
    (id: string, key: string, value: unknown) => {
      store.getState().updateNode(id, { [key]: value } as Partial<DesignNode>);
    },
    [store],
  );

  return (
    <CanvasEditorView
      canvasRef={canvasRef}
      activeTool={activeTool}
      pageNodes={pageNodes}
      allNodes={allNodes}
      selectedIds={selectedIds}
      selectedNode={selectedNode}
      onSetTool={handleSetTool}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onSelectNode={handleSelectNode}
      onToggleVisible={handleToggleVisible}
      onToggleLocked={handleToggleLocked}
      onUpdateProp={handleUpdateProp}
    />
  );
}
