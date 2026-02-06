export type NodeType =
  | "FRAME"
  | "GROUP"
  | "RECTANGLE"
  | "ELLIPSE"
  | "LINE"
  | "POLYGON"
  | "STAR"
  | "TEXT"
  | "VECTOR"
  | "BOOLEAN_OPERATION"
  | "IMAGE"
  | "COMPONENT"
  | "INSTANCE";

export type BlendMode =
  | "NORMAL"
  | "MULTIPLY"
  | "SCREEN"
  | "OVERLAY"
  | "DARKEN"
  | "LIGHTEN"
  | "COLOR_DODGE"
  | "COLOR_BURN"
  | "HARD_LIGHT"
  | "SOFT_LIGHT"
  | "DIFFERENCE"
  | "EXCLUSION"
  | "HUE"
  | "SATURATION"
  | "COLOR"
  | "LUMINOSITY";

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface GradientStop {
  position: number;
  color: RGBA;
}

export interface SolidPaint {
  type: "SOLID";
  color: RGBA;
  blendMode?: BlendMode;
  visible?: boolean;
}

export interface GradientPaint {
  type: "LINEAR" | "RADIAL" | "ANGULAR" | "DIAMOND";
  gradientStops: GradientStop[];
  gradientTransform?: [number, number, number, number, number, number];
  blendMode?: BlendMode;
  visible?: boolean;
}

export interface ImagePaint {
  type: "IMAGE";
  imageRef: string;
  scaleMode: "FILL" | "FIT" | "CROP" | "TILE";
  blendMode?: BlendMode;
  visible?: boolean;
}

export type Paint = SolidPaint | GradientPaint | ImagePaint;

export interface DropShadowEffect {
  type: "DROP_SHADOW";
  color: RGBA;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}

export interface InnerShadowEffect {
  type: "INNER_SHADOW";
  color: RGBA;
  offset: { x: number; y: number };
  radius: number;
  spread?: number;
  visible?: boolean;
  blendMode?: BlendMode;
}

export interface LayerBlurEffect {
  type: "LAYER_BLUR";
  radius: number;
  visible?: boolean;
}

export interface BackgroundBlurEffect {
  type: "BACKGROUND_BLUR";
  radius: number;
  visible?: boolean;
}

export type Effect =
  | DropShadowEffect
  | InnerShadowEffect
  | LayerBlurEffect
  | BackgroundBlurEffect;

export type ConstraintType = "MIN" | "MAX" | "CENTER" | "STRETCH" | "SCALE";

export interface Constraints {
  horizontal: ConstraintType;
  vertical: ConstraintType;
}

export interface AutoLayout {
  layoutMode: "HORIZONTAL" | "VERTICAL";
  primaryAxisSizingMode: "FIXED" | "HUG";
  counterAxisSizingMode: "FIXED" | "HUG";
  primaryAxisAlignItems: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems: "MIN" | "CENTER" | "MAX";
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
}

export interface ColorStyle {
  id: string;
  name: string;
  paint: Paint;
}

export interface TextStyle {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number | "AUTO";
  letterSpacing: number;
}

export interface EffectStyle {
  id: string;
  name: string;
  effects: Effect[];
}

export interface ExportSetting {
  format: "PNG" | "SVG" | "JPG" | "PDF";
  constraint?: { type: "SCALE" | "WIDTH" | "HEIGHT"; value: number };
  suffix?: string;
}

export type ToolType =
  | "SELECT"
  | "FRAME"
  | "RECTANGLE"
  | "ELLIPSE"
  | "LINE"
  | "POLYGON"
  | "STAR"
  | "PEN"
  | "TEXT"
  | "HAND"
  | "ZOOM";

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface SmartGuide {
  axis: "x" | "y";
  position: number;
  start: number;
  end: number;
}

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
}

export interface SceneNode extends BaseNode {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode: BlendMode;
  fills: Paint[];
  strokes: Paint[];
  strokeWeight: number;
  strokeAlign: "CENTER" | "INSIDE" | "OUTSIDE";
  cornerRadius: number;
  constraints?: Constraints;
  effects: Effect[];
  parentId: string | null;
  children: string[];
  clipContent?: boolean;
  autoLayout?: AutoLayout;
  exportSettings?: ExportSetting[];
  tokenBindings?: Record<string, string>;
}

export interface FrameNode extends SceneNode {
  type: "FRAME";
}

export interface GroupNode extends SceneNode {
  type: "GROUP";
}

export interface RectangleNode extends SceneNode {
  type: "RECTANGLE";
}

export interface EllipseNode extends SceneNode {
  type: "ELLIPSE";
}

export interface LineNode extends SceneNode {
  type: "LINE";
}

export interface PolygonNode extends SceneNode {
  type: "POLYGON";
  pointCount: number;
}

export interface StarNode extends SceneNode {
  type: "STAR";
  pointCount: number;
  innerRadius: number;
}

export interface TextNode extends SceneNode {
  type: "TEXT";
  characters: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number | "AUTO";
  letterSpacing: number;
  textAlign: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
  textDecoration: "NONE" | "UNDERLINE" | "STRIKETHROUGH";
  textCase: "ORIGINAL" | "UPPER" | "LOWER" | "TITLE";
}

export interface VectorNode extends SceneNode {
  type: "VECTOR";
  pathData: string;
  windingRule: "NONZERO" | "EVENODD";
}

export interface BooleanOperationNode extends SceneNode {
  type: "BOOLEAN_OPERATION";
  booleanOperation: "UNION" | "SUBTRACT" | "INTERSECT" | "EXCLUDE";
}

export interface ImageNode extends SceneNode {
  type: "IMAGE";
  imageRef: string;
  scaleMode: "FILL" | "FIT" | "CROP" | "TILE";
}

export interface ComponentNode extends SceneNode {
  type: "COMPONENT";
  componentId: string;
}

export interface InstanceNode extends SceneNode {
  type: "INSTANCE";
  componentId: string;
  overrides: Record<string, Partial<SceneNode>>;
}

export type DesignNode =
  | FrameNode
  | GroupNode
  | RectangleNode
  | EllipseNode
  | LineNode
  | PolygonNode
  | StarNode
  | TextNode
  | VectorNode
  | BooleanOperationNode
  | ImageNode
  | ComponentNode
  | InstanceNode;

export interface PageData {
  id: string;
  name: string;
  children: string[];
}

export interface HistoryEntry {
  nodes: Map<string, DesignNode>;
  pages: PageData[];
  currentPageId: string;
  timestamp: number;
}

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export interface CanvasDocument {
  formatVersion: number;
  name: string;
  pages: PageData[];
  nodes: Record<string, DesignNode>;
}
