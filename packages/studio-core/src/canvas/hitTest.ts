import type { DesignNode, SceneNode } from "../types/nodes";

const LINE_HIT_THRESHOLD = 5;
const HANDLE_SIZE = 8;
const ROTATION_MARGIN = 15;

function pointInRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  return px >= x && px <= x + w && py >= y && py <= y + h;
}

function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Returns the ID of the topmost node at the given point, or null. */
export function hitTest(
  x: number,
  y: number,
  nodeIds: string[],
  nodes: Map<string, DesignNode>,
): string | null {
  for (let i = nodeIds.length - 1; i >= 0; i--) {
    const node = nodes.get(nodeIds[i]);
    if (!node) continue;
    const scene = node as SceneNode;
    if (!scene.visible || scene.locked) continue;

    if (scene.children && scene.children.length > 0) {
      const childHit = hitTest(x - scene.x, y - scene.y, scene.children, nodes);
      if (childHit) return childHit;
    }

    if (node.type === "LINE") {
      const dist = distToSegment(
        x,
        y,
        scene.x,
        scene.y,
        scene.x + scene.width,
        scene.y + scene.height,
      );
      if (dist <= LINE_HIT_THRESHOLD) return node.id;
    } else if (pointInRect(x, y, scene.x, scene.y, scene.width, scene.height)) {
      return node.id;
    }
  }
  return null;
}

/** Returns resize handle index (0-7) if the point is on a handle, or -1. */
export function getResizeHandle(x: number, y: number, node: SceneNode): number {
  const handles = [
    [node.x, node.y],
    [node.x + node.width / 2, node.y],
    [node.x + node.width, node.y],
    [node.x, node.y + node.height / 2],
    [node.x + node.width, node.y + node.height / 2],
    [node.x, node.y + node.height],
    [node.x + node.width / 2, node.y + node.height],
    [node.x + node.width, node.y + node.height],
  ];

  const half = HANDLE_SIZE / 2;
  for (let i = 0; i < handles.length; i++) {
    if (
      pointInRect(
        x,
        y,
        handles[i][0] - half,
        handles[i][1] - half,
        HANDLE_SIZE,
        HANDLE_SIZE,
      )
    ) {
      return i;
    }
  }
  return -1;
}

/** Returns true if the point is in the rotation zone (outside the node bounds but within margin). */
export function getRotationZone(
  x: number,
  y: number,
  node: SceneNode,
): boolean {
  const outer = pointInRect(
    x,
    y,
    node.x - ROTATION_MARGIN,
    node.y - ROTATION_MARGIN,
    node.width + ROTATION_MARGIN * 2,
    node.height + ROTATION_MARGIN * 2,
  );
  const inner = pointInRect(x, y, node.x, node.y, node.width, node.height);
  return outer && !inner;
}

/** Returns the world-space position of a node, accounting for parent transforms. */
export function getNodeWorldPosition(
  nodeId: string,
  nodes: Map<string, DesignNode>,
): { x: number; y: number } {
  const node = nodes.get(nodeId) as SceneNode | undefined;
  if (!node) return { x: 0, y: 0 };

  let x = node.x;
  let y = node.y;
  let parentId = node.parentId;

  while (parentId) {
    const parent = nodes.get(parentId) as SceneNode | undefined;
    if (!parent) break;
    x += parent.x;
    y += parent.y;
    parentId = parent.parentId;
  }

  return { x, y };
}
