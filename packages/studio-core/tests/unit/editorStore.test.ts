import { describe, expect, it } from 'vitest';

import { createEditorStore } from '../../src/store/editorStore';

describe('editorStore', () => {
  it('createShape adds a node', () => {
    const store = createEditorStore();
    const id = store.getState().createShape('RECTANGLE', 10, 20);
    expect(store.getState().nodes.has(id)).toBe(true);
    const node = store.getState().nodes.get(id)!;
    expect(node.type).toBe('RECTANGLE');
  });

  it('updateNode modifies properties', () => {
    const store = createEditorStore();
    const id = store.getState().createShape('RECTANGLE', 0, 0);
    store.getState().updateNode(id, { x: 50 } as Record<string, unknown>);
    expect((store.getState().nodes.get(id) as { x: number }).x).toBe(50);
  });

  it('deleteNodes removes node and clears selection', () => {
    const store = createEditorStore();
    const id = store.getState().createShape('RECTANGLE', 0, 0);
    store.getState().deleteNodes([id]);
    expect(store.getState().nodes.has(id)).toBe(false);
    expect(store.getState().selectedIds.size).toBe(0);
  });

  it('groupNodes creates a GROUP node', () => {
    const store = createEditorStore();
    const id1 = store.getState().createShape('RECTANGLE', 0, 0, { width: 50, height: 50 });
    const id2 = store.getState().createShape('RECTANGLE', 100, 100, { width: 50, height: 50 });
    const groupId = store.getState().groupNodes([id1, id2]);
    expect(groupId).toBeTruthy();
    const group = store.getState().nodes.get(groupId)!;
    expect(group.type).toBe('GROUP');
  });

  it('ungroupNodes restores children', () => {
    const store = createEditorStore();
    const id1 = store.getState().createShape('RECTANGLE', 10, 10);
    const id2 = store.getState().createShape('RECTANGLE', 50, 50);
    const groupId = store.getState().groupNodes([id1, id2]);
    const childIds = store.getState().ungroupNodes(groupId);
    expect(childIds).toContain(id1);
    expect(childIds).toContain(id2);
    expect(store.getState().nodes.has(groupId)).toBe(false);
  });

  it('pushHistory captures a snapshot that undo can restore', () => {
    const store = createEditorStore();
    expect(store.getState().nodes.size).toBe(0);
    store.getState().pushHistory();
    store.getState().createShape('RECTANGLE', 0, 0);
    expect(store.getState().nodes.size).toBe(1);
    store.getState().undo();
    expect(store.getState().nodes.size).toBe(0);
  });

  it('copyNodes/pasteNodes deep clones with new IDs', () => {
    const store = createEditorStore();
    const id = store.getState().createShape('RECTANGLE', 0, 0);
    store.getState().copyNodes([id]);
    const pastedIds = store.getState().pasteNodes();
    expect(pastedIds).toHaveLength(1);
    expect(pastedIds[0]).not.toBe(id);
  });

  it('exportDocument produces valid JSON', () => {
    const store = createEditorStore();
    store.getState().createShape('RECTANGLE', 10, 20);
    const doc = store.getState().exportDocument();
    expect(doc.formatVersion).toBe(1);
    expect(doc.pages).toHaveLength(1);
    expect(Object.keys(doc.nodes).length).toBe(1);
  });

  it('importDocument restores state', () => {
    const store = createEditorStore();
    store.getState().createShape('RECTANGLE', 10, 20);
    const doc = store.getState().exportDocument();
    const store2 = createEditorStore();
    store2.getState().importDocument(doc);
    expect(store2.getState().nodes.size).toBe(1);
  });
});
