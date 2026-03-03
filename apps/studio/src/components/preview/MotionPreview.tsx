import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────── Types & Hooks ─────────────────────────── */

type AnimPhase = "reset" | "playing";

/**
 * Drives a replay-able CSS transition: starts in "reset" (start position),
 * then advances to "playing" after two animation frames so the browser has
 * a paint cycle to commit the start state before the transition fires.
 */
function useReplayAnimation(): [AnimPhase, () => void] {
  const [phase, setPhase] = useState<AnimPhase>("reset");

  const replay = useCallback(() => {
    setPhase("reset");
  }, []);

  useEffect(() => {
    if (phase !== "reset") return undefined;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) setPhase("playing");
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [phase]);

  return [phase, replay];
}

/** Returns false when `--duration-fast` is absent from the document styles. */
function useMotionVarsAvailable(): boolean {
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    const val = globalThis
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--duration-fast")
      .trim();
    setAvailable(val !== "");
  }, []);
  return available;
}

/* ─────────────────────────── Shared primitives ─────────────────────────── */

const OUTLINE_STYLE: CSSProperties = {
  backgroundColor: "rgb(var(--colors-button-outline-bg, transparent))",
  color: "rgb(var(--colors-button-outline-text, #374151))",
  border: "1px solid rgb(var(--colors-button-outline-border, #d1d5db))",
};

function SectionLabel({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <h4
      className="text-sm font-semibold"
      style={{ color: "rgb(var(--colors-text-primary))" }}
    >
      {children}
    </h4>
  );
}

function Caption({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <p
      className="text-xs"
      style={{ color: "rgb(var(--colors-text-secondary, #6b7280))" }}
    >
      {children}
    </p>
  );
}

function SmallButton({
  children,
  onClick,
}: Readonly<{ children: ReactNode; onClick: () => void }>) {
  return (
    <button
      type="button"
      className="rounded px-3 py-1 text-xs font-medium"
      style={OUTLINE_STYLE}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <hr style={{ borderColor: "rgb(var(--colors-border-primary, #e5e7eb))" }} />
  );
}

/* ─────────────────────────── Missing tokens banner ─────────────────────────── */

function MissingTokensBanner() {
  return (
    <div
      className="rounded-md border px-4 py-3 text-sm"
      style={{
        backgroundColor: "rgb(var(--colors-alert-warning-bg, 255 251 235))",
        borderColor: "rgb(var(--colors-alert-warning-border, 253 230 138))",
        color: "rgb(var(--colors-alert-warning-text, 92 67 0))",
      }}
    >
      <strong className="font-semibold">Motion tokens not detected.</strong> Add{" "}
      <code className="font-mono text-xs">tokens/motion/base.json</code> and run{" "}
      <code className="font-mono text-xs">clafoutis generate</code> to enable
      animated previews.
    </div>
  );
}

/* ─────────────────────────── Duration Section ─────────────────────────── */

const DURATION_ROWS = [
  { label: "Fast", tokenVar: "--duration-fast", fallback: "100ms" },
  { label: "Normal", tokenVar: "--duration-normal", fallback: "250ms" },
  { label: "Slow", tokenVar: "--duration-slow", fallback: "400ms" },
  {
    label: "Deliberate",
    tokenVar: "--duration-deliberate",
    fallback: "700ms",
  },
] as const;

interface DurationRowProps {
  label: string;
  tokenVar: string;
  fallback: string;
  phase: AnimPhase;
  reducedMotion: boolean;
}

function DurationRow({
  label,
  tokenVar,
  fallback,
  phase,
  reducedMotion,
}: Readonly<DurationRowProps>) {
  const playing = phase === "playing";
  const dur = reducedMotion ? "0ms" : `var(${tokenVar}, ${fallback})`;
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-20 shrink-0 text-xs font-medium"
        style={{ color: "rgb(var(--colors-text-secondary, #6b7280))" }}
      >
        {label}
      </span>
      <div
        className="relative h-6 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: "rgb(var(--colors-skeleton-bg, #f1f5f9))" }}
      >
        {/* Trailing fill — fades in behind the indicator */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            right: "0",
            backgroundColor: "rgb(var(--colors-text-primary, #171717))",
            opacity: 0.1,
            transform: playing ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: playing ? `transform ${dur} linear` : "none",
          }}
        />
        {/* Leading indicator dot */}
        <div
          className="absolute top-1/2 z-10 size-4 -translate-y-1/2 rounded-full"
          style={{
            backgroundColor: "rgb(var(--colors-text-primary, #171717))",
            left: playing ? "calc(100% - 1rem)" : "0.25rem",
            transition: playing ? `left ${dur} linear` : "none",
          }}
        />
      </div>
      <span
        className="w-14 shrink-0 text-right font-mono text-xs"
        style={{ color: "rgb(var(--colors-text-secondary, #6b7280))" }}
      >
        {fallback}
      </span>
    </div>
  );
}

function DurationSection({
  reducedMotion,
}: Readonly<{ reducedMotion: boolean }>) {
  const [phase, replay] = useReplayAnimation();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Duration</SectionLabel>
        <SmallButton onClick={replay}>Replay</SmallButton>
      </div>
      <div className="space-y-3">
        {DURATION_ROWS.map((row) => (
          <DurationRow
            key={row.tokenVar}
            label={row.label}
            tokenVar={row.tokenVar}
            fallback={row.fallback}
            phase={phase}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
      <Caption>
        All indicators start simultaneously — the speed difference shows each
        token&apos;s duration.
      </Caption>
    </section>
  );
}

/* ─────────────────────────── Easing Section ─────────────────────────── */

const EASING_COLS = [
  {
    label: "Default",
    tokenVar: "--easing-default",
    fallback: "cubic-bezier(0.4, 0, 0.2, 1)",
  },
  {
    label: "Snappy",
    tokenVar: "--easing-snappy",
    fallback: "cubic-bezier(0.2, 0, 0, 1)",
  },
  {
    label: "Spring",
    tokenVar: "--easing-spring",
    fallback: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  {
    label: "Expressive",
    tokenVar: "--easing-expressive",
    fallback: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
] as const;

// Floor sits at 60% of the column height. The ball lands with its bottom
// edge on the floor: top = 60% − ball height (1.25 rem).
// Spring (Y-peak ≈ 1.275) briefly overshoots ~75% then settles.
const BALL_LANDED = "calc(60% - 1.25rem)";

interface EasingColProps {
  label: string;
  tokenVar: string;
  fallback: string;
  phase: AnimPhase;
  reducedMotion: boolean;
}

function EasingCol({
  label,
  tokenVar,
  fallback,
  phase,
  reducedMotion,
}: Readonly<EasingColProps>) {
  const playing = phase === "playing";
  const dur = reducedMotion ? "0ms" : "var(--duration-deliberate, 700ms)";
  const easing = `var(${tokenVar}, ${fallback})`;

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          height: "9rem",
          backgroundColor: "rgb(var(--colors-skeleton-bg, #f1f5f9))",
        }}
      >
        {/* Ground zone — solid surface the ball lands on */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            top: "60%",
            backgroundColor: "rgb(var(--colors-border-primary, #e5e7eb))",
          }}
        />
        {/* Floor line */}
        <div
          className="absolute inset-x-0 h-0.5"
          style={{
            top: "60%",
            backgroundColor: "rgb(var(--colors-border-primary, #d1d5db))",
          }}
        />
        {/* Ball */}
        <div
          className="absolute left-1/2 size-5 -translate-x-1/2 rounded-full"
          style={{
            backgroundColor: "rgb(var(--colors-text-primary, #171717))",
            top: playing ? BALL_LANDED : "0.5rem",
            transition: playing ? `top ${dur} ${easing}` : "none",
          }}
        />
      </div>
      <span
        className="text-center text-xs font-medium"
        style={{ color: "rgb(var(--colors-text-secondary, #6b7280))" }}
      >
        {label}
      </span>
    </div>
  );
}

function EasingSection({
  reducedMotion,
}: Readonly<{ reducedMotion: boolean }>) {
  const [phase, replay] = useReplayAnimation();
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Easing</SectionLabel>
        <SmallButton onClick={replay}>Replay</SmallButton>
      </div>
      <div className="flex gap-2">
        {EASING_COLS.map((col) => (
          <EasingCol
            key={col.tokenVar}
            label={col.label}
            tokenVar={col.tokenVar}
            fallback={col.fallback}
            phase={phase}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
      <Caption>
        Same duration — all balls drop simultaneously. Spring lightly passes the
        floor then snaps back. This is what{" "}
        <code className="font-mono">cubic-bezier</code> can do: a single
        controlled overshoot. True multi-bounce requires CSS{" "}
        <code className="font-mono">@keyframes</code> or the modern{" "}
        <code className="font-mono">linear()</code> timing function.
      </Caption>
    </section>
  );
}

/* ─────────────────────────── Semantic Presets ─────────────────────────── */

function EnterExitDemo({
  reducedMotion,
}: Readonly<{ reducedMotion: boolean }>) {
  const [visible, setVisible] = useState(true);
  const enterDur = reducedMotion
    ? "0ms"
    : "var(--motion-enter-duration, 250ms)";
  const enterEase = "var(--motion-enter-easing, cubic-bezier(0, 0, 0.2, 1))";
  const exitDur = reducedMotion ? "0ms" : "var(--motion-exit-duration, 100ms)";
  const exitEase = "var(--motion-exit-easing, cubic-bezier(0.4, 0, 1, 1))";
  const dur = visible ? enterDur : exitDur;
  const ease = visible ? enterEase : exitEase;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span
          className="text-xs font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Enter / Exit
        </span>
        <SmallButton onClick={() => setVisible((v) => !v)}>
          {visible ? "Hide" : "Show"}
        </SmallButton>
      </div>
      <div className="h-14 overflow-hidden">
        <div
          className="flex items-center rounded-lg border px-4 py-3"
          style={{
            backgroundColor: "rgb(var(--colors-surface-primary, #fff))",
            borderColor: "rgb(var(--colors-border-primary, #e5e7eb))",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-6px)",
            transition: `opacity ${dur} ${ease}, transform ${dur} ${ease}`,
          }}
        >
          <span
            className="text-sm"
            style={{ color: "rgb(var(--colors-text-primary))" }}
          >
            Notification saved &middot; just now
          </span>
        </div>
      </div>
    </div>
  );
}

function MicroDemo({ reducedMotion }: Readonly<{ reducedMotion: boolean }>) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const dur = reducedMotion ? "0ms" : "var(--motion-micro-duration, 100ms)";
  const ease = "var(--motion-micro-easing, cubic-bezier(0.4, 0, 0.2, 1))";

  let scale: string;
  if (pressed) {
    scale = "scale(0.97)";
  } else if (hovered) {
    scale = "scale(1.03)";
  } else {
    scale = "scale(1)";
  }

  return (
    <div className="space-y-2">
      <span
        className="text-xs font-medium"
        style={{ color: "rgb(var(--colors-text-primary))" }}
      >
        Micro &mdash; hover &amp; press
      </span>
      <button
        type="button"
        className="rounded-md px-5 py-2.5 text-sm font-medium"
        style={{
          backgroundColor: "rgb(var(--colors-button-primary-bg, #171717))",
          color: "rgb(var(--colors-button-primary-text, #fff))",
          transform: scale,
          transition: `transform ${dur} ${ease}`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
      >
        Save changes
      </button>
    </div>
  );
}

function ExpandDemo({ reducedMotion }: Readonly<{ reducedMotion: boolean }>) {
  const [open, setOpen] = useState(false);
  const dur = reducedMotion ? "0ms" : "var(--motion-expand-duration, 250ms)";
  const ease = "var(--motion-expand-easing, cubic-bezier(0, 0, 0.2, 1))";

  return (
    <div className="space-y-2">
      <span
        className="text-xs font-medium"
        style={{ color: "rgb(var(--colors-text-primary))" }}
      >
        Expand
      </span>
      <div
        className="overflow-hidden rounded-lg border"
        style={{ borderColor: "rgb(var(--colors-border-primary, #e5e7eb))" }}
      >
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left"
          style={{ color: "rgb(var(--colors-text-primary))" }}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="text-sm font-medium">What are motion tokens?</span>
          <span
            className="inline-block text-xs"
            style={{
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
              transition: `transform ${dur} ${ease}`,
            }}
          >
            &#x25BE;
          </span>
        </button>
        <div
          style={{
            overflow: "hidden",
            maxHeight: open ? "120px" : "0",
            transition: `max-height ${dur} ${ease}`,
          }}
        >
          <p
            className="border-t px-4 py-3 text-sm"
            style={{
              borderColor: "rgb(var(--colors-border-primary, #e5e7eb))",
              color: "rgb(var(--colors-text-secondary, #6b7280))",
            }}
          >
            Motion tokens define the timing and easing of transitions &mdash;
            giving your design system consistent, brand-aligned animation
            behaviour across all components.
          </p>
        </div>
      </div>
    </div>
  );
}

function SemanticSection({
  reducedMotion,
}: Readonly<{ reducedMotion: boolean }>) {
  return (
    <section className="space-y-6">
      <SectionLabel>Semantic Presets</SectionLabel>
      <EnterExitDemo reducedMotion={reducedMotion} />
      <MicroDemo reducedMotion={reducedMotion} />
      <ExpandDemo reducedMotion={reducedMotion} />
      <Caption>
        Semantic presets pair a duration and easing into a named role &mdash;
        use them directly in component transitions.
      </Caption>
    </section>
  );
}

/* ─────────────────────────── Reduced motion toggle ─────────────────────────── */

function ReducedMotionToggle({
  checked,
  onChange,
}: Readonly<{ checked: boolean; onChange: (v: boolean) => void }>) {
  return (
    <label
      htmlFor="motion-preview-reduced"
      className="flex cursor-pointer select-none items-center gap-2"
    >
      <input
        id="motion-preview-reduced"
        type="checkbox"
        checked={checked}
        className="h-4 w-4 cursor-pointer rounded"
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className="text-xs"
        style={{ color: "rgb(var(--colors-text-secondary, #6b7280))" }}
      >
        Simulate <code className="font-mono">prefers-reduced-motion</code>
      </span>
    </label>
  );
}

/* ─────────────────────────── Main export ─────────────────────────── */

export function MotionPreview() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const hasMotionVars = useMotionVarsAvailable();

  return (
    <div className="space-y-8">
      <ReducedMotionToggle
        checked={reducedMotion}
        onChange={setReducedMotion}
      />
      {!hasMotionVars && <MissingTokensBanner />}
      <DurationSection reducedMotion={reducedMotion} />
      <Divider />
      <EasingSection reducedMotion={reducedMotion} />
      <Divider />
      <SemanticSection reducedMotion={reducedMotion} />
    </div>
  );
}
