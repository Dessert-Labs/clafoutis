import type { ResolvedToken } from "@clafoutis/studio-core";
import * as Popover from "@radix-ui/react-popover";
import { useEffect, useRef, useState } from "react";

import { Input } from "../ui/input";

interface MotionTokenEditorProps {
  token: ResolvedToken;
  onUpdateToken: (path: string, value: unknown) => void;
}

// ---------------------------------------------------------------------------
// Duration helpers
// ---------------------------------------------------------------------------

const MS_PATTERN = /^(\d+(?:\.\d+)?)ms$/;
const S_PATTERN = /^(\d+(?:\.\d+)?)s$/;

function parseDurationMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const ms = MS_PATTERN.exec(value);
  if (ms) return Number.parseFloat(ms[1]);
  const s = S_PATTERN.exec(value);
  if (s) return Number.parseFloat(s[1]) * 1000;
  return null;
}

function clampDurationMs(ms: number): number {
  return Math.max(0, Math.min(5000, ms));
}

// ---------------------------------------------------------------------------
// CubicBezier helpers
// ---------------------------------------------------------------------------

function parseCubicBezier(
  value: unknown,
): [number, number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 4) return null;
  if (!value.every((v) => typeof v === "number" && Number.isFinite(v)))
    return null;
  return value as [number, number, number, number];
}

function cubicBezierPoint(
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number,
): number {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
}

/** Samples N points along a cubic bezier curve for SVG path rendering. */
function sampleBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
  steps = 60,
): string {
  const pad = 12;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cubicBezierPoint(t, 0, x1, x2, 1) * w + pad;
    // SVG y is inverted: 0 = top, h = bottom
    const y = (1 - cubicBezierPoint(t, 0, y1, y2, 1)) * h + pad;
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }

  return (
    `M ${points[0]} ` +
    points
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ")
  );
}

// ---------------------------------------------------------------------------
// Motion preview: a box that slides across a track
// ---------------------------------------------------------------------------

function MotionPreview({
  durationMs,
  easing,
}: Readonly<{
  durationMs: number;
  easing: string;
}>) {
  const [playing, setPlaying] = useState(false);

  const replay = () => {
    setPlaying(false);
    // Allow a frame to reset before restarting
    requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
  };

  useEffect(() => {
    setPlaying(true);
  }, []);

  return (
    <button
      type="button"
      onClick={replay}
      className="group relative w-full overflow-hidden rounded-md border border-studio-border bg-studio-bg-secondary"
      style={{ height: 36 }}
      aria-label="Replay animation preview"
      title="Click to replay"
    >
      {/* Track line */}
      <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-studio-border" />
      {/* Animated dot */}
      <div
        className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-studio-accent shadow-sm"
        style={
          playing
            ? {
                left: "calc(100% - 28px)",
                transition: `left ${durationMs}ms ${easing}`,
              }
            : {
                left: 12,
                transition: "none",
              }
        }
      />
      {/* Hover hint */}
      <span className="absolute inset-0 flex items-center justify-center text-xs text-studio-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
        Click to replay
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Duration editor sub-component
// ---------------------------------------------------------------------------

function DurationEditor({
  token,
  onCommit,
}: Readonly<{
  token: ResolvedToken;
  onCommit: (value: string) => void;
}>) {
  const resolvedMs = parseDurationMs(token.resolvedValue) ?? 250;
  const [textValue, setTextValue] = useState(String(token.value));
  const [sliderMs, setSliderMs] = useState(resolvedMs);
  const [previewKey, setPreviewKey] = useState(0);

  // Sync if token changes externally
  useEffect(() => {
    setTextValue(String(token.value));
    setSliderMs(parseDurationMs(token.resolvedValue) ?? 250);
  }, [token.value, token.resolvedValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const ms = Number(e.target.value);
    setSliderMs(ms);
    setTextValue(`${ms}ms`);
    setPreviewKey((k) => k + 1);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    const ms = parseDurationMs(e.target.value);
    if (ms !== null) {
      setSliderMs(clampDurationMs(ms));
      setPreviewKey((k) => k + 1);
    }
  };

  const handleCommit = () => {
    if (textValue !== String(token.value)) {
      onCommit(textValue);
    }
  };

  const isReference =
    typeof token.value === "string" && token.value.startsWith("{");

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="duration-value"
          className="mb-1 block text-xs font-medium text-studio-text"
        >
          Duration
        </label>
        <Input
          id="duration-value"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleCommit}
          placeholder="250ms or {duration.normal}"
          className="text-xs font-mono"
        />
        {isReference && (
          <p className="mt-1 text-xs text-studio-text-muted">
            Resolved:{" "}
            <span className="font-mono">{String(token.resolvedValue)}</span>
          </p>
        )}
      </div>

      {!isReference && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label
              htmlFor="duration-slider"
              className="text-xs font-medium text-studio-text"
            >
              Adjust
            </label>
            <span className="text-xs tabular-nums text-studio-text-muted">
              {sliderMs}ms
            </span>
          </div>
          <input
            id="duration-slider"
            type="range"
            min={0}
            max={2000}
            step={10}
            value={sliderMs}
            onChange={handleSliderChange}
            onMouseUp={handleCommit}
            className="w-full accent-studio-accent"
          />
          <div className="flex justify-between text-xs text-studio-text-muted">
            <span>0ms</span>
            <span>2000ms</span>
          </div>
        </div>
      )}

      <div>
        <p className="mb-1 text-xs font-medium text-studio-text">Preview</p>
        <MotionPreview key={previewKey} durationMs={sliderMs} easing="ease" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CubicBezier editor sub-component
// ---------------------------------------------------------------------------

const SVG_W = 200;
const SVG_H = 150;
const PAD = 16;

function BezierCurvePreview({
  x1,
  y1,
  x2,
  y2,
}: Readonly<{ x1: number; y1: number; x2: number; y2: number }>) {
  const w = SVG_W - PAD * 2;
  const h = SVG_H - PAD * 2;

  const p1x = x1 * w + PAD;
  const p1y = (1 - y1) * h + PAD;
  const p2x = x2 * w + PAD;
  const p2y = (1 - y2) * h + PAD;

  const curvePath = sampleBezierPath(x1, y1, x2, y2, SVG_W, SVG_H);

  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      className="w-full rounded-md border border-studio-border bg-studio-bg-secondary"
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
    >
      {/* Grid */}
      <line
        x1={PAD}
        y1={PAD}
        x2={PAD}
        y2={SVG_H - PAD}
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={1}
      />
      <line
        x1={PAD}
        y1={SVG_H - PAD}
        x2={SVG_W - PAD}
        y2={SVG_H - PAD}
        stroke="currentColor"
        strokeOpacity={0.12}
        strokeWidth={1}
      />
      <line
        x1={PAD}
        y1={PAD}
        x2={SVG_W - PAD}
        y2={PAD}
        stroke="currentColor"
        strokeOpacity={0.06}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={SVG_W - PAD}
        y1={PAD}
        x2={SVG_W - PAD}
        y2={SVG_H - PAD}
        stroke="currentColor"
        strokeOpacity={0.06}
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* Control point handles */}
      <line
        x1={PAD}
        y1={SVG_H - PAD}
        x2={p1x}
        y2={p1y}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeDasharray="3 2"
      />
      <line
        x1={SVG_W - PAD}
        y1={PAD}
        x2={p2x}
        y2={p2y}
        stroke="currentColor"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeDasharray="3 2"
      />

      {/* Control points */}
      <circle
        cx={p1x}
        cy={p1y}
        r={4}
        fill="var(--studio-accent)"
        opacity={0.7}
      />
      <circle
        cx={p2x}
        cy={p2y}
        r={4}
        fill="var(--studio-accent)"
        opacity={0.7}
      />

      {/* Curve */}
      <path
        d={curvePath}
        fill="none"
        stroke="var(--studio-accent)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Start / end anchors */}
      <circle
        cx={PAD}
        cy={SVG_H - PAD}
        r={3}
        fill="currentColor"
        opacity={0.5}
      />
      <circle
        cx={SVG_W - PAD}
        cy={PAD}
        r={3}
        fill="currentColor"
        opacity={0.5}
      />
    </svg>
  );
}

function CubicBezierEditor({
  token,
  onCommit,
}: Readonly<{
  token: ResolvedToken;
  onCommit: (value: unknown) => void;
}>) {
  const parsedValue = parseCubicBezier(token.resolvedValue);
  const [x1, y1, x2, y2] = parsedValue ?? [0.4, 0, 0.2, 1];
  const [textValue, setTextValue] = useState(() => {
    if (typeof token.value === "string") return token.value;
    if (Array.isArray(token.value)) return JSON.stringify(token.value);
    return "";
  });
  const [preview, setPreview] = useState<[number, number, number, number]>([
    x1,
    y1,
    x2,
    y2,
  ]);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    if (typeof token.value === "string") setTextValue(token.value);
    else if (Array.isArray(token.value))
      setTextValue(JSON.stringify(token.value));
  }, [token.value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextValue(e.target.value);
    try {
      const parsed = JSON.parse(e.target.value);
      const bezier = parseCubicBezier(parsed);
      if (bezier) {
        setPreview(bezier);
        setPreviewKey((k) => k + 1);
      }
    } catch {
      // Keep current preview while user is typing
    }
  };

  const handleCommit = () => {
    const isRef = textValue.startsWith("{");
    if (isRef) {
      if (textValue !== String(token.value)) onCommit(textValue);
      return;
    }
    try {
      const parsed = JSON.parse(textValue);
      const bezier = parseCubicBezier(parsed);
      if (bezier && JSON.stringify(bezier) !== JSON.stringify(token.value)) {
        onCommit(bezier);
      }
    } catch {
      // Invalid JSON — don't commit
    }
  };

  const easingCSS = `cubic-bezier(${preview.join(", ")})`;
  const isReference =
    typeof token.value === "string" && token.value.startsWith("{");

  return (
    <div className="space-y-3">
      <div>
        <label
          htmlFor="cubic-bezier-value"
          className="mb-1 block text-xs font-medium text-studio-text"
        >
          Cubic Bezier
        </label>
        <Input
          id="cubic-bezier-value"
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleCommit}
          placeholder="[0.4, 0, 0.2, 1] or {easing.default}"
          className="text-xs font-mono"
        />
        {isReference ? (
          <p className="mt-1 text-xs text-studio-text-muted">
            Resolved:{" "}
            <span className="font-mono">
              {JSON.stringify(token.resolvedValue)}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-studio-text-muted font-mono">
            {easingCSS}
          </p>
        )}
      </div>

      {!isReference && (
        <BezierCurvePreview
          x1={preview[0]}
          y1={preview[1]}
          x2={preview[2]}
          y2={preview[3]}
        />
      )}

      <div>
        <p className="mb-1 text-xs font-medium text-studio-text">Preview</p>
        <MotionPreview key={previewKey} durationMs={400} easing={easingCSS} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main MotionTokenEditor
// ---------------------------------------------------------------------------

export default function MotionTokenEditor({
  token,
  onUpdateToken,
}: Readonly<MotionTokenEditorProps>) {
  const [open, setOpen] = useState(false);
  const pendingValueRef = useRef<unknown>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open && pendingValueRef.current !== null) {
      onUpdateToken(token.path, pendingValueRef.current);
      pendingValueRef.current = null;
    }
    setOpen(newOpen);
  };

  const handleCommit = (value: unknown) => {
    pendingValueRef.current = value;
    onUpdateToken(token.path, value);
    pendingValueRef.current = null;
  };

  const isDuration = token.type === "duration";
  const isBezier = token.type === "cubicBezier";

  let triggerLabel: string;
  if (isDuration) {
    triggerLabel = String(token.resolvedValue ?? token.value);
  } else if (isBezier && Array.isArray(token.resolvedValue)) {
    triggerLabel = `(${(token.resolvedValue as number[]).join(", ")})`;
  } else {
    triggerLabel = String(token.value);
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded border border-studio-border bg-studio-bg-secondary px-2 py-1 text-xs font-mono text-studio-text hover:border-studio-accent hover:bg-studio-bg-tertiary transition-colors"
          aria-label={`Edit ${token.type} token ${token.path}`}
        >
          {isDuration && (
            <span className="inline-block h-2 w-2 rounded-full bg-studio-accent opacity-70" />
          )}
          {isBezier && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              className="text-studio-accent opacity-70"
            >
              <path
                d="M 1 10 C 3 10 4 2 6 2 C 8 2 9 10 11 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          )}
          {triggerLabel}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="z-50 w-64 rounded-lg border border-studio-border bg-studio-bg p-4 shadow-lg"
          sideOffset={5}
          align="start"
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-studio-text">
                {token.path}
              </div>
              <div className="text-xs text-studio-text-muted capitalize">
                {token.type}
              </div>
            </div>
          </div>

          {isDuration && (
            <DurationEditor token={token} onCommit={handleCommit} />
          )}
          {isBezier && (
            <CubicBezierEditor token={token} onCommit={handleCommit} />
          )}

          <div className="mt-3 flex justify-end">
            <Popover.Close asChild>
              <button
                type="button"
                className="rounded-md border border-studio-border bg-studio-bg-secondary px-3 py-1 text-xs text-studio-text hover:bg-studio-bg-tertiary"
              >
                Done
              </button>
            </Popover.Close>
          </div>

          <Popover.Arrow className="fill-studio-border" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
