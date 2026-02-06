import type {
  Camera,
  DesignNode,
  GradientPaint,
  Paint,
  RGBA,
  SceneNode,
  SmartGuide,
  TextNode,
} from "../types/nodes";

export function rgbaToCSS(color: RGBA): string {
  return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
}

export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function applyFill(
  ctx: CanvasRenderingContext2D,
  paint: Paint,
  node: SceneNode,
): void {
  if (paint.visible === false) return;

  if (paint.type === "SOLID") {
    ctx.fillStyle = rgbaToCSS(paint.color);
  } else if (paint.type === "LINEAR" || paint.type === "RADIAL") {
    const gp = paint as GradientPaint;
    let gradient: CanvasGradient;
    if (gp.type === "LINEAR") {
      gradient = ctx.createLinearGradient(0, 0, node.width, node.height);
    } else {
      gradient = ctx.createRadialGradient(
        node.width / 2,
        node.height / 2,
        0,
        node.width / 2,
        node.height / 2,
        Math.max(node.width, node.height) / 2,
      );
    }
    for (const stop of gp.gradientStops) {
      gradient.addColorStop(stop.position, rgbaToCSS(stop.color));
    }
    ctx.fillStyle = gradient;
  }
}

export function applyStroke(
  ctx: CanvasRenderingContext2D,
  paint: Paint,
  strokeWeight: number,
): void {
  if (paint.visible === false) return;
  if (paint.type === "SOLID") {
    ctx.strokeStyle = rgbaToCSS(paint.color);
  }
  ctx.lineWidth = strokeWeight;
}

function renderPolygon(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pointCount: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < pointCount; i++) {
    const angle = (Math.PI * 2 * i) / pointCount - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function renderStar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  pointCount: number,
  innerRadius: number,
): void {
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(cx, cy);
  const innerR = outerR * innerRadius;
  ctx.beginPath();
  for (let i = 0; i < pointCount * 2; i++) {
    const angle = (Math.PI * i) / pointCount - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function renderNode(
  ctx: CanvasRenderingContext2D,
  node: DesignNode,
  allNodes: Map<string, DesignNode>,
): void {
  const scene = node as SceneNode;
  if (!scene.visible) return;

  ctx.save();
  ctx.globalAlpha *= scene.opacity;
  ctx.translate(scene.x, scene.y);

  if (scene.rotation) {
    ctx.translate(scene.width / 2, scene.height / 2);
    ctx.rotate((scene.rotation * Math.PI) / 180);
    ctx.translate(-scene.width / 2, -scene.height / 2);
  }

  if (scene.clipContent) {
    const cornerRadius =
      scene.cornerRadius !== undefined && scene.cornerRadius !== null
        ? scene.cornerRadius
        : 0;
    drawRoundedRect(ctx, 0, 0, scene.width, scene.height, cornerRadius);
    ctx.clip();
  }

  switch (node.type) {
    case "RECTANGLE":
    case "FRAME":
    case "COMPONENT":
    case "INSTANCE":
    case "IMAGE": {
      for (const fill of scene.fills) {
        applyFill(ctx, fill, scene);
        drawRoundedRect(
          ctx,
          0,
          0,
          scene.width,
          scene.height,
          scene.cornerRadius,
        );
        ctx.fill();
      }
      for (const stroke of scene.strokes) {
        applyStroke(ctx, stroke, scene.strokeWeight);
        drawRoundedRect(
          ctx,
          0,
          0,
          scene.width,
          scene.height,
          scene.cornerRadius,
        );
        ctx.stroke();
      }
      break;
    }

    case "ELLIPSE": {
      for (const fill of scene.fills) {
        applyFill(ctx, fill, scene);
        ctx.beginPath();
        ctx.ellipse(
          scene.width / 2,
          scene.height / 2,
          scene.width / 2,
          scene.height / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      for (const stroke of scene.strokes) {
        applyStroke(ctx, stroke, scene.strokeWeight);
        ctx.beginPath();
        ctx.ellipse(
          scene.width / 2,
          scene.height / 2,
          scene.width / 2,
          scene.height / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
      break;
    }

    case "LINE": {
      for (const stroke of scene.strokes) {
        applyStroke(ctx, stroke, scene.strokeWeight);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(scene.width, scene.height);
        ctx.stroke();
      }
      break;
    }

    case "POLYGON": {
      const pointCount =
        (node as unknown as { pointCount: number }).pointCount || 3;
      for (const fill of scene.fills) {
        applyFill(ctx, fill, scene);
        renderPolygon(ctx, scene.width, scene.height, pointCount);
        ctx.fill();
      }
      for (const stroke of scene.strokes) {
        applyStroke(ctx, stroke, scene.strokeWeight);
        renderPolygon(ctx, scene.width, scene.height, pointCount);
        ctx.stroke();
      }
      break;
    }

    case "STAR": {
      const starNode = node as unknown as {
        pointCount: number;
        innerRadius: number;
      };
      const pc = starNode.pointCount || 5;
      const ir = starNode.innerRadius || 0.5;
      for (const fill of scene.fills) {
        applyFill(ctx, fill, scene);
        renderStar(ctx, scene.width, scene.height, pc, ir);
        ctx.fill();
      }
      for (const stroke of scene.strokes) {
        applyStroke(ctx, stroke, scene.strokeWeight);
        renderStar(ctx, scene.width, scene.height, pc, ir);
        ctx.stroke();
      }
      break;
    }

    case "TEXT": {
      const textNode = node as TextNode;
      const fill = scene.fills[0];
      if (fill && fill.type === "SOLID") {
        ctx.fillStyle = rgbaToCSS(fill.color);
      }
      const fontSize = textNode.fontSize || 16;
      const fontWeight = textNode.fontWeight || 400;
      const fontFamily = textNode.fontFamily || "Inter";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = (textNode.textAlign?.toLowerCase() ||
        "left") as CanvasTextAlign;
      ctx.textBaseline = "top";

      const x =
        textNode.textAlign === "CENTER"
          ? scene.width / 2
          : textNode.textAlign === "RIGHT"
            ? scene.width
            : 0;
      ctx.fillText(textNode.characters || "", x, 0);
      break;
    }

    case "VECTOR": {
      const vectorNode = node as unknown as {
        pathData: string;
        windingRule: string;
      };
      if (vectorNode.pathData) {
        const path2d = new Path2D(vectorNode.pathData);
        for (const fill of scene.fills) {
          applyFill(ctx, fill, scene);
          ctx.fill(
            path2d,
            vectorNode.windingRule === "EVENODD" ? "evenodd" : "nonzero",
          );
        }
        for (const stroke of scene.strokes) {
          applyStroke(ctx, stroke, scene.strokeWeight);
          ctx.stroke(path2d);
        }
      }
      break;
    }
  }

  for (const childId of scene.children) {
    const child = allNodes.get(childId);
    if (child) renderNode(ctx, child, allNodes);
  }

  ctx.restore();
}

export function renderDotGrid(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  gridSize = 20,
): void {
  const dotSize = 1;
  const startX = Math.floor(-camera.x / camera.zoom / gridSize) * gridSize;
  const startY = Math.floor(-camera.y / camera.zoom / gridSize) * gridSize;
  const endX = startX + canvasWidth / camera.zoom + gridSize;
  const endY = startY + canvasHeight / camera.zoom + gridSize;

  ctx.fillStyle = "#ddd";
  for (let x = startX; x < endX; x += gridSize) {
    for (let y = startY; y < endY; y += gridSize) {
      ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize);
    }
  }
}

export function renderSelectionBox(
  ctx: CanvasRenderingContext2D,
  node: SceneNode,
): void {
  ctx.save();
  ctx.translate(node.x, node.y);
  if (node.rotation) {
    ctx.translate(node.width / 2, node.height / 2);
    ctx.rotate((node.rotation * Math.PI) / 180);
    ctx.translate(-node.width / 2, -node.height / 2);
  }

  ctx.strokeStyle = "#0d99ff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, node.width, node.height);

  const handleSize = 8;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#0d99ff";
  ctx.lineWidth = 1.5;

  const handles = [
    [0, 0],
    [node.width / 2, 0],
    [node.width, 0],
    [0, node.height / 2],
    [node.width, node.height / 2],
    [0, node.height],
    [node.width / 2, node.height],
    [node.width, node.height],
  ];

  for (const [hx, hy] of handles) {
    ctx.fillRect(
      hx - handleSize / 2,
      hy - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx.strokeRect(
      hx - handleSize / 2,
      hy - handleSize / 2,
      handleSize,
      handleSize,
    );
  }

  ctx.restore();
}

export function renderSmartGuides(
  ctx: CanvasRenderingContext2D,
  guides: SmartGuide[],
): void {
  ctx.save();
  ctx.strokeStyle = "#ff00ff";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  for (const guide of guides) {
    ctx.beginPath();
    if (guide.axis === "x") {
      ctx.moveTo(guide.position, guide.start);
      ctx.lineTo(guide.position, guide.end);
    } else {
      ctx.moveTo(guide.start, guide.position);
      ctx.lineTo(guide.end, guide.position);
    }
    ctx.stroke();
  }

  ctx.restore();
}

export function renderDimensionLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const label = `${Math.round(width)} × ${Math.round(height)}`;
  ctx.save();
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const metrics = ctx.measureText(label);
  const paddingX = 6;
  const paddingY = 3;
  const labelWidth = metrics.width + paddingX * 2;
  const labelHeight = 18;
  const labelX = x + width / 2 - labelWidth / 2;
  const labelY = y + height + 8;

  ctx.fillStyle = "#0d99ff";
  drawRoundedRect(ctx, labelX, labelY, labelWidth, labelHeight, 4);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.fillText(label, x + width / 2, labelY + paddingY);
  ctx.restore();
}

export function renderMarquee(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void {
  const x = Math.min(startX, endX);
  const y = Math.min(startY, endY);
  const w = Math.abs(endX - startX);
  const h = Math.abs(endY - startY);

  ctx.save();
  ctx.fillStyle = "rgba(13, 153, 255, 0.1)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#0d99ff";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
