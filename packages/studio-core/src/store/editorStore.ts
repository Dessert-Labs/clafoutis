import { nanoid } from "nanoid";
import { createStore } from "zustand/vanilla";

import type {
  BooleanOperationNode,
  Camera,
  CanvasDocument,
  ColorStyle,
  ComponentNode,
  DesignNode,
  EffectStyle,
  HistoryEntry,
  InstanceNode,
  PageData,
  Paint,
  SceneNode,
  SmartGuide,
  TextStyle,
  Toast,
  ToolType,
} from "../types/nodes";

const HISTORY_LIMIT = 100;
const DUPLICATE_OFFSET = 20;

function createDefaultPage(): PageData {
  return { id: nanoid(), name: "Page 1", children: [] };
}

function createDefaultSceneProps(
  overrides: Partial<SceneNode> = {},
): Omit<SceneNode, "id" | "name" | "type"> {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    blendMode: "NORMAL",
    fills: [],
    strokes: [],
    strokeWeight: 1,
    strokeAlign: "CENTER",
    cornerRadius: 0,
    effects: [],
    parentId: null,
    children: [],
    ...overrides,
  };
}

function deepCloneNode(node: DesignNode): DesignNode {
  return JSON.parse(JSON.stringify(node));
}

function cloneNodesMap(
  nodes: Map<string, DesignNode>,
): Map<string, DesignNode> {
  const clone = new Map<string, DesignNode>();
  for (const [id, node] of nodes) {
    clone.set(id, deepCloneNode(node));
  }
  return clone;
}

export interface EditorState {
  nodes: Map<string, DesignNode>;
  pages: PageData[];
  currentPageId: string | null;
  documentName: string;

  selectedIds: Set<string>;
  hoveredId: string | null;

  activeTool: ToolType;
  camera: Camera;

  showLeftPanel: boolean;
  showRightPanel: boolean;
  smartGuides: SmartGuide[];
  clipboard: DesignNode[];
  toasts: Toast[];

  history: HistoryEntry[];
  historyIndex: number;

  isDrawing: boolean;
  drawStart: { x: number; y: number } | null;

  components: Map<string, ComponentNode>;
  colorStyles: ColorStyle[];
  textStyles: TextStyle[];
  effectStyles: EffectStyle[];
  snapToGrid: boolean;
  gridSize: number;

  getNode: (id: string) => DesignNode | undefined;
  getSelectedNodes: () => DesignNode[];
  getCurrentPageNodes: () => DesignNode[];
  getChildNodes: (parentId: string) => DesignNode[];

  addNode: (node: DesignNode, parentId?: string) => void;
  updateNode: (id: string, updates: Partial<DesignNode>) => void;
  deleteNodes: (ids: string[]) => void;

  createShape: (
    type: DesignNode["type"],
    x: number,
    y: number,
    opts?: Partial<SceneNode>,
  ) => string;
  createTextNode: (
    x: number,
    y: number,
    opts?: Partial<SceneNode & { characters?: string }>,
  ) => string;

  duplicateNodes: (ids: string[]) => string[];
  groupNodes: (ids: string[]) => string;
  ungroupNodes: (groupId: string) => string[];
  moveNodes: (ids: string[], dx: number, dy: number) => void;

  reorderNode: (id: string, newIndex: number) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  copyNodes: (ids: string[]) => void;
  pasteNodes: () => string[];

  addPage: (name?: string) => string;
  setCurrentPage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  deletePage: (pageId: string) => void;

  setActiveTool: (tool: ToolType) => void;
  setCamera: (camera: Partial<Camera>) => void;
  setShowLeftPanel: (show: boolean) => void;
  setShowRightPanel: (show: boolean) => void;
  setSmartGuides: (guides: SmartGuide[]) => void;
  setSelectedIds: (ids: Set<string> | string[]) => void;
  setHoveredId: (id: string | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  setDrawStart: (point: { x: number; y: number } | null) => void;

  addToast: (message: string, type?: Toast["type"]) => string;
  removeToast: (id: string) => void;

  exportDocument: () => CanvasDocument;
  importDocument: (doc: CanvasDocument) => void;

  createComponent: (ids: string[]) => string;
  createInstance: (componentId: string, x: number, y: number) => string;
  detachInstance: (instanceId: string) => void;
  updateComponentMaster: (
    componentId: string,
    updates: Partial<SceneNode>,
  ) => void;

  applyBooleanOperation: (
    ids: string[],
    operation: BooleanOperationNode["booleanOperation"],
  ) => string;

  alignNodes: (
    ids: string[],
    alignment: "LEFT" | "CENTER" | "RIGHT" | "TOP" | "MIDDLE" | "BOTTOM",
  ) => void;
  distributeNodes: (ids: string[], axis: "HORIZONTAL" | "VERTICAL") => void;

  zoomToFit: () => void;
  zoomToSelection: () => void;
  zoomToPercent: (percent: number) => void;

  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  setAutoLayout: (id: string, settings: SceneNode["autoLayout"]) => void;
  removeAutoLayout: (id: string) => void;

  createColorStyle: (name: string, paint: Paint) => string;
  createTextStyle: (
    name: string,
    props: Omit<TextStyle, "id" | "name">,
  ) => string;
  createEffectStyle: (name: string, effects: EffectStyle["effects"]) => string;
  applyStyle: (nodeId: string, styleId: string) => void;
  updateStyle: (
    styleId: string,
    updates: Partial<ColorStyle | TextStyle | EffectStyle>,
  ) => void;

  flattenNode: (id: string) => void;
}

export const createEditorStore = (initialState?: Partial<EditorState>) => {
  const defaultPage = createDefaultPage();

  return createStore<EditorState>((set, get) => ({
    nodes: new Map(),
    pages: [defaultPage],
    currentPageId: defaultPage.id,
    documentName: "Untitled",
    selectedIds: new Set(),
    hoveredId: null,
    activeTool: "SELECT",
    camera: { x: 0, y: 0, zoom: 1 },
    showLeftPanel: true,
    showRightPanel: true,
    smartGuides: [],
    clipboard: [],
    toasts: [],
    history: [],
    historyIndex: -1,
    isDrawing: false,
    drawStart: null,
    components: new Map(),
    colorStyles: [],
    textStyles: [],
    effectStyles: [],
    snapToGrid: false,
    gridSize: 8,
    ...initialState,

    getNode: (id) => get().nodes.get(id),

    getSelectedNodes: () => {
      const { nodes, selectedIds } = get();
      return Array.from(selectedIds)
        .map((id) => nodes.get(id))
        .filter(Boolean) as DesignNode[];
    },

    getCurrentPageNodes: () => {
      const { nodes, pages, currentPageId } = get();
      const page = pages.find((p) => p.id === currentPageId);
      if (!page) return [];
      return page.children
        .map((id) => nodes.get(id))
        .filter(Boolean) as DesignNode[];
    },

    getChildNodes: (parentId) => {
      const { nodes } = get();
      const parent = nodes.get(parentId);
      if (!parent) return [];
      return (parent as SceneNode).children
        .map((id) => nodes.get(id))
        .filter(Boolean) as DesignNode[];
    },

    addNode: (node, parentId) => {
      const { nodes, pages, currentPageId } = get();
      const newNodes = new Map(nodes);
      newNodes.set(node.id, node);

      if (parentId) {
        const parent = newNodes.get(parentId);
        if (parent) {
          const updated = deepCloneNode(parent) as SceneNode;
          updated.children = [...updated.children, node.id];
          newNodes.set(parentId, updated as DesignNode);
        }
      } else {
        const newPages = pages.map((p) =>
          p.id === currentPageId
            ? { ...p, children: [...p.children, node.id] }
            : p,
        );
        set({ nodes: newNodes, pages: newPages });
        return;
      }
      set({ nodes: newNodes });
    },

    updateNode: (id, updates) => {
      const { nodes } = get();
      const node = nodes.get(id);
      if (!node) return;
      const newNodes = new Map(nodes);
      newNodes.set(id, { ...deepCloneNode(node), ...updates } as DesignNode);
      set({ nodes: newNodes });
    },

    deleteNodes: (ids) => {
      const { nodes, pages, currentPageId } = get();
      const toDelete = new Set(ids);

      const collectChildren = (nodeId: string) => {
        const node = nodes.get(nodeId);
        if (!node) return;
        toDelete.add(nodeId);
        for (const childId of (node as SceneNode).children || []) {
          collectChildren(childId);
        }
      };
      ids.forEach(collectChildren);

      const newNodes = new Map(nodes);
      for (const id of toDelete) {
        newNodes.delete(id);
      }

      for (const [, node] of newNodes) {
        const scene = node as SceneNode;
        if (scene.children?.some((cid) => toDelete.has(cid))) {
          const updated = deepCloneNode(node) as SceneNode;
          updated.children = updated.children.filter(
            (cid) => !toDelete.has(cid),
          );
          newNodes.set(node.id, updated as DesignNode);
        }
      }

      const newPages = pages.map((p) =>
        p.id === currentPageId
          ? { ...p, children: p.children.filter((cid) => !toDelete.has(cid)) }
          : p,
      );

      set({
        nodes: newNodes,
        pages: newPages,
        selectedIds: new Set(),
      });
    },

    createShape: (type, x, y, opts = {}) => {
      const id = nanoid();
      const defaultFill: Paint[] = [
        { type: "SOLID", color: { r: 0.85, g: 0.85, b: 0.85, a: 1 } },
      ];

      const node = {
        ...createDefaultSceneProps({
          x,
          y,
          fills: defaultFill,
          ...opts,
        }),
        id,
        name: type.charAt(0) + type.slice(1).toLowerCase(),
        type,
      } as DesignNode;

      get().addNode(node);
      set({ selectedIds: new Set([id]) });
      return id;
    },

    createTextNode: (x, y, opts = {}) => {
      const id = nanoid();
      const { characters = "Text", ...rest } = opts as Partial<
        SceneNode & { characters: string }
      >;
      const node: DesignNode = {
        ...createDefaultSceneProps({
          x,
          y,
          width: 200,
          height: 24,
          fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0, a: 1 } }],
          ...rest,
        }),
        id,
        name: "Text",
        type: "TEXT",
        characters,
        fontFamily: "Inter",
        fontWeight: 400,
        fontSize: 16,
        lineHeight: "AUTO" as const,
        letterSpacing: 0,
        textAlign: "LEFT" as const,
        textDecoration: "NONE" as const,
        textCase: "ORIGINAL" as const,
      } as DesignNode;

      get().addNode(node);
      set({ selectedIds: new Set([id]) });
      return id;
    },

    duplicateNodes: (ids) => {
      const { nodes } = get();
      const newIds: string[] = [];
      for (const id of ids) {
        const node = nodes.get(id);
        if (!node || (node as SceneNode).locked) continue;
        const clone = deepCloneNode(node);
        clone.id = nanoid();
        (clone as SceneNode).x += DUPLICATE_OFFSET;
        (clone as SceneNode).y += DUPLICATE_OFFSET;
        clone.name = `${node.name} copy`;
        get().addNode(clone);
        newIds.push(clone.id);
      }
      set({ selectedIds: new Set(newIds) });
      return newIds;
    },

    groupNodes: (ids) => {
      if (ids.length === 0) return "";
      const { nodes, pages, currentPageId } = get();
      const groupId = nanoid();
      const children = ids
        .map((id) => nodes.get(id))
        .filter(Boolean) as DesignNode[];
      if (children.length === 0) return "";

      let minX = Infinity,
        minY = Infinity;
      for (const child of children) {
        const s = child as SceneNode;
        if (s.x < minX) minX = s.x;
        if (s.y < minY) minY = s.y;
      }

      const newNodes = new Map(nodes);
      for (const child of children) {
        const updated = deepCloneNode(child) as SceneNode;
        updated.x -= minX;
        updated.y -= minY;
        updated.parentId = groupId;
        newNodes.set(child.id, updated as DesignNode);
      }

      let maxW = 0,
        maxH = 0;
      for (const child of children) {
        const s = child as SceneNode;
        const right = s.x - minX + s.width;
        const bottom = s.y - minY + s.height;
        if (right > maxW) maxW = right;
        if (bottom > maxH) maxH = bottom;
      }

      const group: DesignNode = {
        ...createDefaultSceneProps({
          x: minX,
          y: minY,
          width: maxW,
          height: maxH,
        }),
        id: groupId,
        name: "Group",
        type: "GROUP",
        children: ids,
      } as DesignNode;
      newNodes.set(groupId, group);

      const newPages = pages.map((p) => {
        if (p.id !== currentPageId) return p;
        const filtered = p.children.filter((cid) => !ids.includes(cid));
        const firstIdx = p.children.findIndex((cid) => ids.includes(cid));
        filtered.splice(firstIdx >= 0 ? firstIdx : filtered.length, 0, groupId);
        return { ...p, children: filtered };
      });

      set({
        nodes: newNodes,
        pages: newPages,
        selectedIds: new Set([groupId]),
      });
      return groupId;
    },

    ungroupNodes: (groupId) => {
      const { nodes, pages, currentPageId } = get();
      const group = nodes.get(groupId) as SceneNode | undefined;
      if (!group || group.type !== "GROUP") return [];

      const newNodes = new Map(nodes);
      const childIds = [...group.children];

      for (const childId of childIds) {
        const child = newNodes.get(childId);
        if (!child) continue;
        const updated = deepCloneNode(child) as SceneNode;
        updated.x += group.x;
        updated.y += group.y;
        updated.parentId = group.parentId;
        newNodes.set(childId, updated as DesignNode);
      }

      newNodes.delete(groupId);

      const newPages = pages.map((p) => {
        if (p.id !== currentPageId) return p;
        const idx = p.children.indexOf(groupId);
        if (idx === -1) return p;
        const newChildren = [...p.children];
        newChildren.splice(idx, 1, ...childIds);
        return { ...p, children: newChildren };
      });

      set({ nodes: newNodes, pages: newPages, selectedIds: new Set(childIds) });
      return childIds;
    },

    moveNodes: (ids, dx, dy) => {
      const { nodes } = get();
      const newNodes = new Map(nodes);
      for (const id of ids) {
        const node = nodes.get(id);
        if (!node || (node as SceneNode).locked) continue;
        const updated = deepCloneNode(node) as SceneNode;
        updated.x += dx;
        updated.y += dy;
        newNodes.set(id, updated as DesignNode);
      }
      set({ nodes: newNodes });
    },

    reorderNode: (id, newIndex) => {
      const { pages, currentPageId, nodes } = get();
      const node = nodes.get(id) as SceneNode | undefined;
      if (!node) return;
      const parentId = node.parentId;

      if (parentId) {
        const parent = nodes.get(parentId) as SceneNode | undefined;
        if (!parent) return;
        const children = [...parent.children];
        const oldIdx = children.indexOf(id);
        if (oldIdx === -1) return;
        children.splice(oldIdx, 1);
        children.splice(newIndex, 0, id);
        get().updateNode(parentId, { children } as Partial<DesignNode>);
      } else {
        const newPages = pages.map((p) => {
          if (p.id !== currentPageId) return p;
          const children = [...p.children];
          const oldIdx = children.indexOf(id);
          if (oldIdx === -1) return p;
          children.splice(oldIdx, 1);
          children.splice(newIndex, 0, id);
          return { ...p, children };
        });
        set({ pages: newPages });
      }
    },

    bringForward: (id) => {
      const { pages, currentPageId, nodes } = get();
      const node = nodes.get(id) as SceneNode | undefined;
      if (!node) return;
      const parentId = node.parentId;

      const getChildren = () => {
        if (parentId) {
          const parent = nodes.get(parentId) as SceneNode | undefined;
          return parent?.children || [];
        }
        const page = pages.find((p) => p.id === currentPageId);
        return page?.children || [];
      };

      const children = getChildren();
      const idx = children.indexOf(id);
      if (idx === -1 || idx === children.length - 1) return;
      get().reorderNode(id, idx + 1);
    },

    sendBackward: (id) => {
      const { pages, currentPageId, nodes } = get();
      const node = nodes.get(id) as SceneNode | undefined;
      if (!node) return;
      const parentId = node.parentId;

      const getChildren = () => {
        if (parentId) {
          const parent = nodes.get(parentId) as SceneNode | undefined;
          return parent?.children || [];
        }
        const page = pages.find((p) => p.id === currentPageId);
        return page?.children || [];
      };

      const children = getChildren();
      const idx = children.indexOf(id);
      if (idx <= 0) return;
      get().reorderNode(id, idx - 1);
    },

    bringToFront: (id) => {
      const { pages, currentPageId, nodes } = get();
      const node = nodes.get(id) as SceneNode | undefined;
      if (!node) return;
      const parentId = node.parentId;

      const getChildren = () => {
        if (parentId) {
          const parent = nodes.get(parentId) as SceneNode | undefined;
          return parent?.children || [];
        }
        const page = pages.find((p) => p.id === currentPageId);
        return page?.children || [];
      };

      get().reorderNode(id, getChildren().length - 1);
    },

    sendToBack: (id) => {
      get().reorderNode(id, 0);
    },

    pushHistory: () => {
      const { nodes, pages, currentPageId, history, historyIndex } = get();
      const entry: HistoryEntry = {
        nodes: cloneNodesMap(nodes),
        pages: JSON.parse(JSON.stringify(pages)),
        currentPageId: currentPageId ?? pages[0]?.id ?? "",
        timestamp: Date.now(),
      };
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(entry);
      if (newHistory.length > HISTORY_LIMIT) {
        newHistory.shift();
      }
      set({ history: newHistory, historyIndex: newHistory.length - 1 });
    },

    undo: () => {
      const { history, historyIndex } = get();
      if (historyIndex < 0) return;
      const entry = history[historyIndex];
      if (!entry) return;
      set({
        nodes: cloneNodesMap(entry.nodes),
        pages: JSON.parse(JSON.stringify(entry.pages)),
        currentPageId: entry.currentPageId,
        historyIndex: historyIndex - 1,
      });
    },

    redo: () => {
      const { history, historyIndex } = get();
      if (historyIndex >= history.length - 1) return;
      const entry = history[historyIndex + 1];
      if (!entry) return;
      set({
        nodes: cloneNodesMap(entry.nodes),
        pages: JSON.parse(JSON.stringify(entry.pages)),
        currentPageId: entry.currentPageId,
        historyIndex: historyIndex + 1,
      });
    },

    copyNodes: (ids) => {
      const { nodes } = get();
      const copies = ids
        .map((id) => nodes.get(id))
        .filter(Boolean)
        .map((n) => deepCloneNode(n!));
      set({ clipboard: copies });
    },

    pasteNodes: () => {
      const { clipboard } = get();
      if (clipboard.length === 0) return [];
      const newIds: string[] = [];
      for (const original of clipboard) {
        const clone = deepCloneNode(original);
        clone.id = nanoid();
        (clone as SceneNode).x += DUPLICATE_OFFSET;
        (clone as SceneNode).y += DUPLICATE_OFFSET;
        get().addNode(clone);
        newIds.push(clone.id);
      }
      set({ selectedIds: new Set(newIds) });
      return newIds;
    },

    addPage: (name) => {
      const id = nanoid();
      const page: PageData = {
        id,
        name: name || `Page ${get().pages.length + 1}`,
        children: [],
      };
      set({ pages: [...get().pages, page], currentPageId: id });
      return id;
    },

    setCurrentPage: (pageId) => {
      set({ currentPageId: pageId, selectedIds: new Set() });
    },

    renamePage: (pageId, name) => {
      set({
        pages: get().pages.map((p) => (p.id === pageId ? { ...p, name } : p)),
      });
    },

    deletePage: (pageId) => {
      const { pages, nodes, currentPageId } = get();
      if (pages.length <= 1) return;
      const page = pages.find((p) => p.id === pageId);
      if (!page) return;

      const newNodes = new Map(nodes);
      const deleteRecursive = (id: string) => {
        const node = newNodes.get(id);
        if (node) {
          for (const childId of (node as SceneNode).children || []) {
            deleteRecursive(childId);
          }
          newNodes.delete(id);
        }
      };
      page.children.forEach(deleteRecursive);

      const newPages = pages.filter((p) => p.id !== pageId);
      const newCurrentId =
        currentPageId === pageId ? newPages[0].id : currentPageId;
      set({
        pages: newPages,
        nodes: newNodes,
        currentPageId: newCurrentId,
        selectedIds: new Set(),
      });
    },

    setActiveTool: (tool) => set({ activeTool: tool }),
    setCamera: (camera) => set({ camera: { ...get().camera, ...camera } }),
    setShowLeftPanel: (show) => set({ showLeftPanel: show }),
    setShowRightPanel: (show) => set({ showRightPanel: show }),
    setSmartGuides: (guides) => set({ smartGuides: guides }),
    setSelectedIds: (ids) =>
      set({ selectedIds: ids instanceof Set ? ids : new Set(ids) }),
    setHoveredId: (id) => set({ hoveredId: id }),
    setIsDrawing: (drawing) => set({ isDrawing: drawing }),
    setDrawStart: (point) => set({ drawStart: point }),

    addToast: (message, type = "info") => {
      const id = nanoid();
      set({ toasts: [...get().toasts, { id, message, type }] });
      return id;
    },

    removeToast: (id) => {
      set({ toasts: get().toasts.filter((t) => t.id !== id) });
    },

    exportDocument: () => {
      const { nodes, pages, documentName } = get();
      const nodesObj: Record<string, DesignNode> = {};
      for (const [id, node] of nodes) {
        nodesObj[id] = deepCloneNode(node);
      }
      return {
        formatVersion: 1,
        name: documentName,
        pages: JSON.parse(JSON.stringify(pages)),
        nodes: nodesObj,
      };
    },

    importDocument: (doc) => {
      const nodesMap = new Map<string, DesignNode>();
      for (const [id, node] of Object.entries(doc.nodes)) {
        nodesMap.set(id, node);
      }
      const hasPages = doc.pages && doc.pages.length > 0;
      set({
        documentName: doc.name,
        pages: doc.pages || [],
        currentPageId: hasPages ? doc.pages[0].id : null,
        nodes: nodesMap,
        selectedIds: new Set(),
        history: [],
        historyIndex: -1,
      });
    },

    createComponent: (ids) => {
      if (ids.length === 0) return "";
      const groupId = get().groupNodes(ids);
      const { nodes } = get();
      const group = nodes.get(groupId);
      if (!group) return "";

      const componentId = nanoid();
      const component: ComponentNode = {
        ...(deepCloneNode(group) as SceneNode),
        type: "COMPONENT",
        componentId,
      } as ComponentNode;
      component.id = groupId;

      const newNodes = new Map(nodes);
      newNodes.set(groupId, component);

      const newComponents = new Map(get().components);
      newComponents.set(componentId, component);

      set({ nodes: newNodes, components: newComponents });
      return groupId;
    },

    createInstance: (componentId, x, y) => {
      const { components } = get();
      const master = components.get(componentId);
      if (!master) return "";

      const id = nanoid();
      const instance: InstanceNode = {
        ...(deepCloneNode(master) as SceneNode),
        id,
        type: "INSTANCE",
        componentId,
        x,
        y,
        name: `${master.name} (instance)`,
        overrides: {},
      } as InstanceNode;

      get().addNode(instance);
      set({ selectedIds: new Set([id]) });
      return id;
    },

    detachInstance: (instanceId) => {
      const { nodes } = get();
      const instance = nodes.get(instanceId) as InstanceNode | undefined;
      if (!instance || instance.type !== "INSTANCE") return;

      const detached = deepCloneNode(instance) as SceneNode;
      (detached as DesignNode).type = "FRAME";
      const newNodes = new Map(nodes);
      newNodes.set(instanceId, detached as DesignNode);
      set({ nodes: newNodes });
    },

    updateComponentMaster: (componentId, updates) => {
      const { components, nodes } = get();
      const master = components.get(componentId);
      if (!master) return;

      const updated = { ...deepCloneNode(master), ...updates } as ComponentNode;
      const newComponents = new Map(components);
      newComponents.set(componentId, updated);

      const newNodes = new Map(nodes);
      newNodes.set(master.id, updated);

      for (const [id, node] of newNodes) {
        if (
          (node as InstanceNode).type === "INSTANCE" &&
          (node as InstanceNode).componentId === componentId
        ) {
          const inst = node as InstanceNode;
          const synced = {
            ...deepCloneNode(updated),
            ...inst.overrides,
            id,
            type: "INSTANCE" as const,
            componentId,
            overrides: inst.overrides,
          } as DesignNode;
          newNodes.set(id, synced);
        }
      }

      set({ nodes: newNodes, components: newComponents });
    },

    applyBooleanOperation: (ids, operation) => {
      if (ids.length < 2) return "";
      const { nodes, pages, currentPageId } = get();
      const boolId = nanoid();
      const children = ids
        .map((id) => nodes.get(id))
        .filter(Boolean) as DesignNode[];
      if (children.length < 2) return "";

      let minX = Infinity,
        minY = Infinity;
      for (const c of children) {
        const s = c as SceneNode;
        if (s.x < minX) minX = s.x;
        if (s.y < minY) minY = s.y;
      }

      let maxW = 0,
        maxH = 0;
      for (const c of children) {
        const s = c as SceneNode;
        const right = s.x - minX + s.width;
        const bottom = s.y - minY + s.height;
        if (right > maxW) maxW = right;
        if (bottom > maxH) maxH = bottom;
      }

      const newNodes = new Map(nodes);
      for (const child of children) {
        const updated = deepCloneNode(child) as SceneNode;
        updated.x -= minX;
        updated.y -= minY;
        updated.parentId = boolId;
        newNodes.set(child.id, updated as DesignNode);
      }

      const boolNode: BooleanOperationNode = {
        ...createDefaultSceneProps({
          x: minX,
          y: minY,
          width: maxW,
          height: maxH,
        }),
        id: boolId,
        name: operation.charAt(0) + operation.slice(1).toLowerCase(),
        type: "BOOLEAN_OPERATION",
        booleanOperation: operation,
        children: ids,
      } as BooleanOperationNode;
      newNodes.set(boolId, boolNode);

      const newPages = pages.map((p) => {
        if (p.id !== currentPageId) return p;
        const filtered = p.children.filter((cid) => !ids.includes(cid));
        const firstIdx = p.children.findIndex((cid) => ids.includes(cid));
        filtered.splice(firstIdx >= 0 ? firstIdx : filtered.length, 0, boolId);
        return { ...p, children: filtered };
      });

      set({ nodes: newNodes, pages: newPages, selectedIds: new Set([boolId]) });
      return boolId;
    },

    alignNodes: (ids, alignment) => {
      const { nodes } = get();
      const targets = ids
        .map((id) => nodes.get(id))
        .filter(Boolean) as SceneNode[];
      if (targets.length < 2) return;

      const bounds = {
        minX: Math.min(...targets.map((n) => n.x)),
        maxX: Math.max(...targets.map((n) => n.x + n.width)),
        minY: Math.min(...targets.map((n) => n.y)),
        maxY: Math.max(...targets.map((n) => n.y + n.height)),
      };

      const newNodes = new Map(nodes);
      for (const node of targets) {
        const updated = deepCloneNode(node as DesignNode) as SceneNode;
        switch (alignment) {
          case "LEFT":
            updated.x = bounds.minX;
            break;
          case "CENTER":
            updated.x =
              bounds.minX + (bounds.maxX - bounds.minX) / 2 - updated.width / 2;
            break;
          case "RIGHT":
            updated.x = bounds.maxX - updated.width;
            break;
          case "TOP":
            updated.y = bounds.minY;
            break;
          case "MIDDLE":
            updated.y =
              bounds.minY +
              (bounds.maxY - bounds.minY) / 2 -
              updated.height / 2;
            break;
          case "BOTTOM":
            updated.y = bounds.maxY - updated.height;
            break;
        }
        newNodes.set(node.id, updated as DesignNode);
      }
      set({ nodes: newNodes });
    },

    distributeNodes: (ids, axis) => {
      const { nodes } = get();
      const targets = ids
        .map((id) => nodes.get(id))
        .filter(Boolean) as SceneNode[];
      if (targets.length < 3) return;

      const sorted = [...targets].sort((a, b) =>
        axis === "HORIZONTAL" ? a.x - b.x : a.y - b.y,
      );

      const totalSize = sorted.reduce(
        (sum, n) => sum + (axis === "HORIZONTAL" ? n.width : n.height),
        0,
      );
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const totalSpan =
        axis === "HORIZONTAL"
          ? last.x + last.width - first.x
          : last.y + last.height - first.y;
      const gap = (totalSpan - totalSize) / (sorted.length - 1);

      const newNodes = new Map(nodes);
      let pos = axis === "HORIZONTAL" ? first.x : first.y;
      for (const node of sorted) {
        const updated = deepCloneNode(node as DesignNode) as SceneNode;
        if (axis === "HORIZONTAL") {
          updated.x = pos;
          pos += updated.width + gap;
        } else {
          updated.y = pos;
          pos += updated.height + gap;
        }
        newNodes.set(node.id, updated as DesignNode);
      }
      set({ nodes: newNodes });
    },

    zoomToFit: () => {
      const { nodes, pages, currentPageId } = get();
      const page = pages.find((p) => p.id === currentPageId);
      if (!page || page.children.length === 0) return;

      const allNodes = page.children
        .map((id) => nodes.get(id))
        .filter(Boolean) as SceneNode[];
      if (allNodes.length === 0) return;

      const minX = Math.min(...allNodes.map((n) => n.x));
      const minY = Math.min(...allNodes.map((n) => n.y));
      const maxX = Math.max(...allNodes.map((n) => n.x + n.width));
      const maxY = Math.max(...allNodes.map((n) => n.y + n.height));

      const padding = 50;
      const contentW = maxX - minX + padding * 2;
      const contentH = maxY - minY + padding * 2;

      const zoom = Math.min(1, 800 / contentW, 600 / contentH);
      set({ camera: { x: -(minX - padding), y: -(minY - padding), zoom } });
    },

    zoomToSelection: () => {
      const selected = get().getSelectedNodes() as SceneNode[];
      if (selected.length === 0) return;

      const minX = Math.min(...selected.map((n) => n.x));
      const minY = Math.min(...selected.map((n) => n.y));
      const maxX = Math.max(...selected.map((n) => n.x + n.width));
      const maxY = Math.max(...selected.map((n) => n.y + n.height));

      const padding = 50;
      const contentW = maxX - minX + padding * 2;
      const contentH = maxY - minY + padding * 2;

      const zoom = Math.min(2, 800 / contentW, 600 / contentH);
      set({ camera: { x: -(minX - padding), y: -(minY - padding), zoom } });
    },

    zoomToPercent: (percent) => {
      set({ camera: { ...get().camera, zoom: percent / 100 } });
    },

    toggleSnapToGrid: () => set({ snapToGrid: !get().snapToGrid }),
    setGridSize: (size) => set({ gridSize: size }),

    setAutoLayout: (id, settings) => {
      get().updateNode(id, { autoLayout: settings } as Partial<DesignNode>);
    },

    removeAutoLayout: (id) => {
      get().updateNode(id, { autoLayout: undefined } as Partial<DesignNode>);
    },

    createColorStyle: (name, paint) => {
      const id = nanoid();
      set({ colorStyles: [...get().colorStyles, { id, name, paint }] });
      return id;
    },

    createTextStyle: (name, props) => {
      const id = nanoid();
      set({ textStyles: [...get().textStyles, { id, name, ...props }] });
      return id;
    },

    createEffectStyle: (name, effects) => {
      const id = nanoid();
      set({ effectStyles: [...get().effectStyles, { id, name, effects }] });
      return id;
    },

    applyStyle: (nodeId, styleId) => {
      const { colorStyles, textStyles, effectStyles } = get();
      const colorStyle = colorStyles.find((s) => s.id === styleId);
      if (colorStyle) {
        get().updateNode(nodeId, {
          fills: [colorStyle.paint],
        } as Partial<DesignNode>);
        return;
      }
      const textStyle = textStyles.find((s) => s.id === styleId);
      if (textStyle) {
        get().updateNode(nodeId, {
          fontFamily: textStyle.fontFamily,
          fontWeight: textStyle.fontWeight,
          fontSize: textStyle.fontSize,
          lineHeight: textStyle.lineHeight,
          letterSpacing: textStyle.letterSpacing,
        } as Partial<DesignNode>);
        return;
      }
      const effectStyle = effectStyles.find((s) => s.id === styleId);
      if (effectStyle) {
        get().updateNode(nodeId, {
          effects: effectStyle.effects,
        } as Partial<DesignNode>);
      }
    },

    updateStyle: (styleId, updates) => {
      const { colorStyles, textStyles, effectStyles } = get();
      if (colorStyles.find((s) => s.id === styleId)) {
        set({
          colorStyles: colorStyles.map((s) =>
            s.id === styleId ? ({ ...s, ...updates } as ColorStyle) : s,
          ),
        });
      } else if (textStyles.find((s) => s.id === styleId)) {
        set({
          textStyles: textStyles.map((s) =>
            s.id === styleId ? ({ ...s, ...updates } as TextStyle) : s,
          ),
        });
      } else if (effectStyles.find((s) => s.id === styleId)) {
        set({
          effectStyles: effectStyles.map((s) =>
            s.id === styleId ? ({ ...s, ...updates } as EffectStyle) : s,
          ),
        });
      }
    },

    flattenNode: (id) => {
      const { nodes } = get();
      const node = nodes.get(id);
      if (!node) return;
      const scene = node as SceneNode;
      if (scene.children.length === 0) return;

      const newNodes = new Map(nodes);
      const flattened: DesignNode = {
        ...createDefaultSceneProps({
          x: scene.x,
          y: scene.y,
          width: scene.width,
          height: scene.height,
          fills: scene.fills,
          strokes: scene.strokes,
          effects: scene.effects,
        }),
        id,
        name: scene.name,
        type: "VECTOR",
        pathData: "",
        windingRule: "NONZERO",
      } as DesignNode;
      newNodes.set(id, flattened);

      const deleteChildren = (parentId: string) => {
        const parent = nodes.get(parentId) as SceneNode | undefined;
        if (!parent) return;
        for (const childId of parent.children) {
          deleteChildren(childId);
          newNodes.delete(childId);
        }
      };
      deleteChildren(id);

      set({ nodes: newNodes });
    },
  }));
};

export type EditorStore = ReturnType<typeof createEditorStore>;
