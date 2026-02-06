import type { DesignNode, SceneNode, SmartGuide } from "../types/nodes";

const SNAP_THRESHOLD = 5;

interface Edge {
  axis: "x" | "y";
  position: number;
  start: number;
  end: number;
}

function getEdges(node: SceneNode): Edge[] {
  return [
    { axis: "x", position: node.x, start: node.y, end: node.y + node.height },
    {
      axis: "x",
      position: node.x + node.width / 2,
      start: node.y,
      end: node.y + node.height,
    },
    {
      axis: "x",
      position: node.x + node.width,
      start: node.y,
      end: node.y + node.height,
    },
    { axis: "y", position: node.y, start: node.x, end: node.x + node.width },
    {
      axis: "y",
      position: node.y + node.height / 2,
      start: node.x,
      end: node.x + node.width,
    },
    {
      axis: "y",
      position: node.y + node.height,
      start: node.x,
      end: node.x + node.width,
    },
  ];
}

/** Computes smart guides and snap offsets for a moving node against other nodes. */
export function computeSmartGuidesWithSnap(
  movingId: string,
  movingNode: SceneNode,
  nodeIds: string[],
  nodes: Map<string, DesignNode>,
): { guides: SmartGuide[]; snapX: number; snapY: number } {
  const guides: SmartGuide[] = [];
  let snapX = 0;
  let snapY = 0;
  let foundX = false;
  let foundY = false;

  const movingEdges = getEdges(movingNode);

  for (const id of nodeIds) {
    if (id === movingId) continue;
    const other = nodes.get(id) as SceneNode | undefined;
    if (!other || !other.visible) continue;

    const otherEdges = getEdges(other);

    for (const mEdge of movingEdges) {
      for (const oEdge of otherEdges) {
        if (mEdge.axis !== oEdge.axis) continue;
        const diff = oEdge.position - mEdge.position;
        if (Math.abs(diff) <= SNAP_THRESHOLD) {
          guides.push({
            axis: oEdge.axis,
            position: oEdge.position,
            start: Math.min(mEdge.start, oEdge.start),
            end: Math.max(mEdge.end, oEdge.end),
          });

          if (oEdge.axis === "x" && !foundX) {
            snapX = diff;
            foundX = true;
          }
          if (oEdge.axis === "y" && !foundY) {
            snapY = diff;
            foundY = true;
          }
        }
      }
    }
  }

  return { guides, snapX, snapY };
}

/** Computes snap offsets during a resize operation. */
export function computeResizeSnap(
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number,
  handleIndex: number,
  nodeIds: string[],
  nodes: Map<string, DesignNode>,
  excludeId: string,
): { snapX: number; snapY: number } {
  let snapX = 0;
  let snapY = 0;

  const corners = [
    [nodeX, nodeY],
    [nodeX + nodeW / 2, nodeY],
    [nodeX + nodeW, nodeY],
    [nodeX, nodeY + nodeH / 2],
    [nodeX + nodeW, nodeY + nodeH / 2],
    [nodeX, nodeY + nodeH],
    [nodeX + nodeW / 2, nodeY + nodeH],
    [nodeX + nodeW, nodeY + nodeH],
  ];

  const activeCorner = corners[handleIndex];
  if (!activeCorner) return { snapX, snapY };

  for (const id of nodeIds) {
    if (id === excludeId) continue;
    const other = nodes.get(id) as SceneNode | undefined;
    if (!other || !other.visible) continue;

    const edges = getEdges(other);
    for (const edge of edges) {
      if (edge.axis === "x") {
        const diff = edge.position - activeCorner[0];
        if (Math.abs(diff) <= SNAP_THRESHOLD && snapX === 0) {
          snapX = diff;
        }
      } else {
        const diff = edge.position - activeCorner[1];
        if (Math.abs(diff) <= SNAP_THRESHOLD && snapY === 0) {
          snapY = diff;
        }
      }
    }
  }

  return { snapX, snapY };
}
