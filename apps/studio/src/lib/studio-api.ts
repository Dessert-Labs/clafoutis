import type {
  CanvasDocument,
  DesignNode,
  NodeType,
} from "@clafoutis/studio-core";
import {
  createEditorStore,
  createTokenStore,
  validateTokens,
} from "@clafoutis/studio-core";

const editorStore = createEditorStore();
const tokenStore = createTokenStore();

export function getEditorStore() {
  return editorStore;
}

export function getTokenStore() {
  return tokenStore;
}

export function mountStudioAPI() {
  const editor = editorStore;
  const tokens = tokenStore;

  (window as unknown as Record<string, unknown>).studioAPI = {
    createShape: (opts: {
      type: string;
      x: number;
      y: number;
      width?: number;
      height?: number;
    }) => {
      return editor
        .getState()
        .createShape(opts.type as NodeType, opts.x, opts.y, {
          width: opts.width,
          height: opts.height,
        } as Partial<DesignNode>);
    },

    createText: (opts: {
      x: number;
      y: number;
      characters?: string;
      fontSize?: number;
    }) => {
      return editor.getState().createTextNode(opts.x, opts.y, opts);
    },

    updateNode: (id: string, props: Record<string, unknown>) => {
      editor.getState().updateNode(id, props);
    },

    deleteNodes: (ids: string[]) => {
      editor.getState().deleteNodes(ids);
    },

    listNodes: () => {
      return Object.fromEntries(editor.getState().nodes);
    },

    selectNodes: (ids: string[]) => {
      editor.getState().setSelectedIds(new Set(ids));
    },

    exportDocument: () => {
      return editor.getState().exportDocument();
    },

    importDocument: (json: CanvasDocument) => {
      editor.getState().importDocument(json);
    },

    listTokens: (opts?: { category?: string }) => {
      return tokens.getState().getTokensByCategory(opts?.category);
    },

    getToken: (path: string) => {
      return tokens.getState().resolvedTokens.find((t) => t.path === path);
    },

    updateToken: (path: string, value: unknown) => {
      tokens.getState().updateToken(path, value);
    },

    addToken: (opts: {
      path: string;
      type: string;
      value: unknown;
      filePath: string;
    }) => {
      tokens
        .getState()
        .addToken(opts.path, opts.type, opts.value, opts.filePath);
    },

    removeToken: (path: string) => {
      tokens.getState().removeToken(path);
    },

    validateTokens: () => {
      return validateTokens(tokens.getState().tokenFiles);
    },

    getDiff: () => {
      return tokens.getState().getDiff();
    },

    undoCanvas: () => editor.getState().undo(),
    redoCanvas: () => editor.getState().redo(),
    undoToken: () => tokens.getState().undoTokenChange(),
    redoToken: () => tokens.getState().redoTokenChange(),

    getState: () => ({
      editor: editor.getState(),
      tokens: tokens.getState(),
    }),
  };
}
