import { useEffect } from "react";

import { getEditorStore, getTokenStore } from "./studio-api";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  context?: "canvas" | "tokens" | "global";
  description: string;
}

const shortcuts: Shortcut[] = [
  {
    key: "z",
    ctrl: true,
    handler: () => {
      getEditorStore().getState().undo();
    },
    context: "global",
    description: "Undo",
  },
  {
    key: "z",
    ctrl: true,
    shift: true,
    handler: () => {
      getEditorStore().getState().redo();
    },
    context: "global",
    description: "Redo",
  },
  {
    key: "y",
    ctrl: true,
    handler: () => {
      getEditorStore().getState().redo();
    },
    context: "global",
    description: "Redo",
  },

  {
    key: "v",
    handler: () => {
      getEditorStore().getState().setActiveTool("SELECT");
    },
    context: "canvas",
    description: "Select tool",
  },
  {
    key: "f",
    handler: () => {
      getEditorStore().getState().setActiveTool("FRAME");
    },
    context: "canvas",
    description: "Frame tool",
  },
  {
    key: "r",
    handler: () => {
      getEditorStore().getState().setActiveTool("RECTANGLE");
    },
    context: "canvas",
    description: "Rectangle tool",
  },
  {
    key: "o",
    handler: () => {
      getEditorStore().getState().setActiveTool("ELLIPSE");
    },
    context: "canvas",
    description: "Ellipse tool",
  },
  {
    key: "l",
    handler: () => {
      getEditorStore().getState().setActiveTool("LINE");
    },
    context: "canvas",
    description: "Line tool",
  },
  {
    key: "t",
    handler: () => {
      getEditorStore().getState().setActiveTool("TEXT");
    },
    context: "canvas",
    description: "Text tool",
  },
  {
    key: "p",
    handler: () => {
      getEditorStore().getState().setActiveTool("PEN");
    },
    context: "canvas",
    description: "Pen tool",
  },
  {
    key: "h",
    handler: () => {
      getEditorStore().getState().setActiveTool("HAND");
    },
    context: "canvas",
    description: "Hand tool",
  },
  {
    key: "z",
    handler: () => {
      getEditorStore().getState().setActiveTool("ZOOM");
    },
    context: "canvas",
    description: "Zoom tool",
  },

  {
    key: "Delete",
    handler: () => {
      const state = getEditorStore().getState();
      state.deleteNodes(Array.from(state.selectedIds));
    },
    context: "canvas",
    description: "Delete selected",
  },
  {
    key: "Backspace",
    handler: () => {
      const state = getEditorStore().getState();
      state.deleteNodes(Array.from(state.selectedIds));
    },
    context: "canvas",
    description: "Delete selected",
  },

  {
    key: "a",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      const state = getEditorStore().getState();
      const pageNodes = state.getCurrentPageNodes();
      state.setSelectedIds(new Set(pageNodes.map((n) => n.id)));
    },
    context: "canvas",
    description: "Select all",
  },

  {
    key: "d",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      const state = getEditorStore().getState();
      state.duplicateNodes(Array.from(state.selectedIds));
    },
    context: "canvas",
    description: "Duplicate",
  },

  {
    key: "g",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      const state = getEditorStore().getState();
      state.groupNodes(Array.from(state.selectedIds));
    },
    context: "canvas",
    description: "Group",
  },

  {
    key: "g",
    ctrl: true,
    shift: true,
    handler: (e) => {
      e.preventDefault();
      const state = getEditorStore().getState();
      const selected = Array.from(state.selectedIds);
      if (selected.length === 1) state.ungroupNodes(selected[0]);
    },
    context: "canvas",
    description: "Ungroup",
  },

  {
    key: "c",
    ctrl: true,
    handler: () => {
      const state = getEditorStore().getState();
      state.copyNodes(Array.from(state.selectedIds));
    },
    context: "canvas",
    description: "Copy",
  },

  {
    key: "v",
    ctrl: true,
    handler: () => {
      getEditorStore().getState().pasteNodes();
    },
    context: "canvas",
    description: "Paste",
  },

  {
    key: "0",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      getEditorStore().getState().zoomToPercent(100);
    },
    context: "canvas",
    description: "Zoom to 100%",
  },

  {
    key: "1",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      getEditorStore().getState().zoomToFit();
    },
    context: "canvas",
    description: "Zoom to fit",
  },

  {
    key: "2",
    ctrl: true,
    handler: (e) => {
      e.preventDefault();
      getEditorStore().getState().zoomToSelection();
    },
    context: "canvas",
    description: "Zoom to selection",
  },

  {
    key: "?",
    handler: () => {
      document.dispatchEvent(new CustomEvent("studio:open-help"));
    },
    context: "global",
    description: "Open help",
  },
];

export function getShortcuts() {
  return shortcuts;
}

function getActiveContext(): "canvas" | "tokens" | "global" {
  const path = window.location.pathname;
  if (path.includes("/canvas")) return "canvas";
  if (path.includes("/tokens")) return "tokens";
  return "global";
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;
      const context = getActiveContext();

      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (isCtrl && (e.key === "z" || e.key === "y")) {
          // Let the browser's native undo/redo handle it; bail out
          // so the editor shortcut loop below is never reached.
          e.preventDefault();
          return;
        } else {
          return;
        }
      }

      for (const shortcut of shortcuts) {
        if (
          shortcut.context &&
          shortcut.context !== context &&
          shortcut.context !== "global"
        )
          continue;
        if (shortcut.key.toLowerCase() !== e.key.toLowerCase()) continue;
        if (!!shortcut.ctrl !== isCtrl) continue;
        if (!!shortcut.shift !== isShift) continue;
        if (!!shortcut.alt !== e.altKey) continue;

        shortcut.handler(e);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}

export function useTokenKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCtrl = e.metaKey || e.ctrlKey;
      if (isCtrl && e.key === "z" && !e.shiftKey) {
        getTokenStore().getState().undoTokenChange();
      } else if (isCtrl && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        getTokenStore().getState().redoTokenChange();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
