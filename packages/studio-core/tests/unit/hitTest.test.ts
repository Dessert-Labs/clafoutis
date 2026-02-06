import { describe, expect, it } from 'vitest';

import { getResizeHandle, getRotationZone, hitTest } from '../../src/canvas/hitTest';
import type { DesignNode, SceneNode } from '../../src/types/nodes';

function makeNode(id: string, x: number, y: number, w: number, h: number): DesignNode {
  return {
    id, name: id, type: 'RECTANGLE',
    x, y, width: w, height: h,
    rotation: 0, opacity: 1, visible: true, locked: false,
    blendMode: 'NORMAL', fills: [], strokes: [], strokeWeight: 1,
    strokeAlign: 'CENTER', cornerRadius: 0, effects: [],
    parentId: null, children: [],
  } as DesignNode;
}

describe('hitTest', () => {
  it('returns node ID when click is inside bounds', () => {
    const node = makeNode('a', 10, 10, 100, 100);
    const nodes = new Map([['a', node]]);
    expect(hitTest(50, 50, ['a'], nodes)).toBe('a');
  });

  it('returns null when click is outside all nodes', () => {
    const node = makeNode('a', 10, 10, 100, 100);
    const nodes = new Map([['a', node]]);
    expect(hitTest(200, 200, ['a'], nodes)).toBeNull();
  });

  it('returns topmost node when overlapping', () => {
    const a = makeNode('a', 0, 0, 100, 100);
    const b = makeNode('b', 50, 50, 100, 100);
    const nodes = new Map([['a', a], ['b', b]]);
    expect(hitTest(75, 75, ['a', 'b'], nodes)).toBe('b');
  });
});

describe('getResizeHandle', () => {
  it('returns handle index when on corner', () => {
    const node = makeNode('a', 10, 10, 100, 100) as SceneNode;
    expect(getResizeHandle(10, 10, node)).toBe(0);
  });

  it('returns -1 when not on any handle', () => {
    const node = makeNode('a', 10, 10, 100, 100) as SceneNode;
    expect(getResizeHandle(50, 50, node)).toBe(-1);
  });
});

describe('getRotationZone', () => {
  it('returns true in margin outside bounds', () => {
    const node = makeNode('a', 10, 10, 100, 100) as SceneNode;
    expect(getRotationZone(5, 5, node)).toBe(true);
  });

  it('returns false inside bounds', () => {
    const node = makeNode('a', 10, 10, 100, 100) as SceneNode;
    expect(getRotationZone(50, 50, node)).toBe(false);
  });
});
