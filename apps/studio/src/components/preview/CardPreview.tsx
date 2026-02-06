interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

function Card({
  children,
  className = "",
  interactive = false,
}: Readonly<CardProps>) {
  return (
    <div
      className={`rounded-lg border p-4 ${interactive ? "cursor-pointer transition-shadow hover:shadow-md" : ""} ${className}`}
      style={{
        backgroundColor: "rgb(var(--colors-card-bg))",
        borderColor: "rgb(var(--colors-card-border))",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className="font-medium"
      style={{ color: "rgb(var(--colors-card-header))" }}
    >
      {children}
    </div>
  );
}

function CardDescription({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <p
      className="mt-1 text-sm"
      style={{ color: "rgb(var(--colors-card-description))" }}
    >
      {children}
    </p>
  );
}

export function CardPreview() {
  return (
    <div className="space-y-3">
      <Card className="shadow-md">
        <CardHeader>Default (shadow)</CardHeader>
        <CardDescription>Card with drop shadow</CardDescription>
      </Card>

      <Card>
        <CardHeader>Bordered</CardHeader>
        <CardDescription>Card with border</CardDescription>
      </Card>

      <Card interactive>
        <CardHeader>Interactive Card</CardHeader>
        <CardDescription>
          Hover to see the shadow effect. This card could link somewhere.
        </CardDescription>
        <button
          className="mt-3 rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: "rgb(var(--colors-button-primary-bg))",
            color: "rgb(var(--colors-button-primary-text))",
          }}
        >
          Action
        </button>
      </Card>
    </div>
  );
}
