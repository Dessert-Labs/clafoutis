import { describe, expect, it } from 'vitest';

import { computeSmartGuidesWithSnap } from '../../src/canvas/smartGuides';
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

describe('computeSmartGuidesWithSnap', () => {
  it('snaps to nearby edges', () => {
    const moving = makeNode('a', 100, 100, 50, 50) as SceneNode;
    const other = makeNode('b', 98, 200, 50, 50);
    const nodes = new Map([['a', moving as DesignNode], ['b', other]]);
    const { snapX, guides } = computeSmartGuidesWithSnap('a', moving, ['a', 'b'], nodes);
    expect(Math.abs(snapX)).toBeLessThanOrEqual(5);
    expect(guides.length).toBeGreaterThan(0);
  });

  it('returns zero offset when no nearby edges', () => {
    const moving = makeNode('a', 0, 0, 50, 50) as SceneNode;
    const other = makeNode('b', 500, 500, 50, 50);
    const nodes = new Map([['a', moving as DesignNode], ['b', other]]);
    const { snapX, snapY } = computeSmartGuidesWithSnap('a', moving, ['a', 'b'], nodes);
    expect(snapX).toBe(0);
    expect(snapY).toBe(0);
  });

  it('does not snap to the moving node itself', () => {
    const moving = makeNode('a', 100, 100, 50, 50) as SceneNode;
    const nodes = new Map([['a', moving as DesignNode]]);
    const { guides } = computeSmartGuidesWithSnap('a', moving, ['a'], nodes);
    expect(guides).toHaveLength(0);
  });
});
