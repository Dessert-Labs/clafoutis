const spacings = [
  { name: "1", value: "0.25rem" },
  { name: "2", value: "0.5rem" },
  { name: "3", value: "0.75rem" },
  { name: "4", value: "1rem" },
  { name: "5", value: "1.25rem" },
  { name: "6", value: "1.5rem" },
  { name: "8", value: "2rem" },
  { name: "10", value: "2.5rem" },
  { name: "12", value: "3rem" },
];

export function SpacingPreview() {
  return (
    <div className="space-y-3">
      {spacings.map(({ name, value }) => (
        <div key={name} className="flex items-center gap-4">
          <span
            className="w-8 text-right font-mono text-sm"
            style={{ color: "rgb(var(--colors-text-secondary))" }}
          >
            {name}
          </span>
          <div
            className="h-4 rounded"
            style={{
              width: value,
              backgroundColor: "rgb(var(--colors-button-primary-bg) / 0.5)",
            }}
          />
          <span
            className="text-xs"
            style={{ color: "rgb(var(--colors-text-secondary))" }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}
