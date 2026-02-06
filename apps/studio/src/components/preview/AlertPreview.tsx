interface AlertProps {
  variant: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
}

function Alert({ variant, title, message }: Readonly<AlertProps>) {
  return (
    <div
      className="rounded-md border-l-4 p-4"
      style={{
        borderLeftColor: `rgb(var(--colors-alert-${variant}-border))`,
        backgroundColor: `rgb(var(--colors-alert-${variant}-bg))`,
      }}
    >
      <p
        className="font-semibold"
        style={{ color: `rgb(var(--colors-alert-${variant}-text))` }}
      >
        {title}
      </p>
      <p
        className="text-sm"
        style={{ color: `rgb(var(--colors-alert-${variant}-text))` }}
      >
        {message}
      </p>
    </div>
  );
}

export function AlertPreview() {
  return (
    <div className="space-y-3">
      <Alert
        variant="info"
        title="Information"
        message="This is an informational alert using primary colors."
      />
      <Alert
        variant="success"
        title="Success"
        message="Your changes have been saved successfully."
      />
      <Alert
        variant="warning"
        title="Warning"
        message="Please review your input before proceeding."
      />
      <Alert
        variant="error"
        title="Error"
        message="Something went wrong. Please try again."
      />
    </div>
  );
}
