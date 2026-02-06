import { useCallback, useId, useRef } from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
}: Readonly<SliderProps>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onChange(Math.round(min + pct * (max - min)));
    },
    [onChange, min, max],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      handleInteraction(e.clientX);
      const handleMove = (ev: MouseEvent) => handleInteraction(ev.clientX);
      const handleUp = () => {
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [handleInteraction],
  );

  const pct =
    max === min
      ? 0
      : Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span
          id={labelId}
          className="text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          {label}
        </span>
        <span
          className="text-sm"
          style={{ color: "rgb(var(--colors-text-secondary))" }}
        >
          {value}
        </span>
      </div>
      <div
        ref={trackRef}
        role="slider"
        aria-labelledby={labelId}
        tabIndex={0}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="relative h-2 cursor-pointer rounded-full"
        style={{ backgroundColor: "rgb(var(--colors-slider-track))" }}
        onMouseDown={handleMouseDown}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            onChange(Math.min(max, value + 1));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            onChange(Math.max(min, value - 1));
          }
        }}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "rgb(var(--colors-slider-range))",
          }}
        />
        <div
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 shadow-sm"
          style={{
            left: `calc(${pct}% - 10px)`,
            backgroundColor: "rgb(var(--colors-slider-thumb))",
            borderColor: "rgb(var(--colors-slider-thumbBorder))",
          }}
        />
      </div>
    </div>
  );
}

interface SliderPreviewProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  brightness: number;
  onBrightnessChange: (v: number) => void;
}

export function SliderPreview({
  volume,
  onVolumeChange,
  brightness,
  onBrightnessChange,
}: Readonly<SliderPreviewProps>) {
  return (
    <div className="space-y-6">
      <Slider value={volume} onChange={onVolumeChange} label="Volume" />
      <Slider
        value={brightness}
        onChange={onBrightnessChange}
        label="Brightness"
      />
    </div>
  );
}
