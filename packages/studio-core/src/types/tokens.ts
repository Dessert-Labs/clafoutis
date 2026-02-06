export type DTCGTokenType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "strokeStyle"
  | "border"
  | "transition"
  | "shadow"
  | "gradient"
  | "typography"
  | "fontStyle";

export interface DTCGToken {
  $type: DTCGTokenType;
  $value: unknown;
  $description?: string;
}

export type DTCGGroup = {
  [key: string]: DTCGToken | DTCGGroup;
};

export type DTCGTokenFile = DTCGGroup;

export interface ResolvedToken {
  path: string;
  type: DTCGTokenType;
  value: unknown;
  resolvedValue: unknown;
  filePath: string;
  reference?: string;
  description?: string;
}

export interface TokenDiff {
  path: string;
  type: "added" | "modified" | "removed";
  before?: unknown;
  after?: unknown;
}

export type ValidationCode =
  | "BROKEN_REF"
  | "CIRCULAR_REF"
  | "TYPE_MISMATCH"
  | "INVALID_VALUE"
  | "DUPLICATE_PATH";

export interface ValidationResult {
  path: string;
  severity: "error" | "warning";
  message: string;
  code: ValidationCode;
}

export interface TokenSnapshot {
  files: Map<string, DTCGTokenFile>;
  timestamp: number;
}

export interface TokenGroupNode {
  name: string;
  path: string;
  children: TokenGroupNode[];
  tokenCount: number;
}
