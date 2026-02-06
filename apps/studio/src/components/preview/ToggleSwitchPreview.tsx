interface ToggleProps {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  children: React.ReactNode;
}

function Toggle({ pressed, onPressedChange, children }: Readonly<ToggleProps>) {
  return (
    <button
      type="button"
      className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{
        backgroundColor: pressed
          ? "rgb(var(--colors-toggle-active-bg))"
          : "rgb(var(--colors-toggle-bg))",
        color: pressed
          ? "rgb(var(--colors-toggle-active-text))"
          : "rgb(var(--colors-toggle-text))",
      }}
      onClick={() => onPressedChange(!pressed)}
      aria-pressed={pressed}
    >
      {children}
    </button>
  );
}

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

function Switch({ checked, onCheckedChange, label }: Readonly<SwitchProps>) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className="relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        style={{
          backgroundColor: checked
            ? "rgb(var(--colors-switch-checked-bg))"
            : "rgb(var(--colors-switch-bg))",
        }}
        onClick={() => onCheckedChange(!checked)}
      >
        <span
          className="pointer-events-none inline-block h-5 w-5 rounded-full shadow-sm transition-transform"
          style={{
            backgroundColor: checked
              ? "rgb(var(--colors-switch-checked-thumb))"
              : "rgb(var(--colors-switch-thumb))",
            transform: checked ? "translate(22px, 2px)" : "translate(2px, 2px)",
          }}
        />
      </button>
      <span
        className="text-sm"
        style={{ color: "rgb(var(--colors-text-primary))" }}
      >
        {label}
      </span>
    </label>
  );
}

interface ToggleSwitchPreviewProps {
  toggleBold: boolean;
  onToggleBoldChange: (v: boolean) => void;
  toggleItalic: boolean;
  onToggleItalicChange: (v: boolean) => void;
  switchNotifications: boolean;
  onSwitchNotificationsChange: (v: boolean) => void;
  switchDarkMode: boolean;
  onSwitchDarkModeChange: (v: boolean) => void;
}

export function ToggleSwitchPreview({
  toggleBold,
  onToggleBoldChange,
  toggleItalic,
  onToggleItalicChange,
  switchNotifications,
  onSwitchNotificationsChange,
  switchDarkMode,
  onSwitchDarkModeChange,
}: Readonly<ToggleSwitchPreviewProps>) {
  return (
    <div className="space-y-6">
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Toggle Buttons
        </h4>
        <div className="flex gap-2">
          <Toggle pressed={toggleBold} onPressedChange={onToggleBoldChange}>
            <span style={{ fontWeight: toggleBold ? 700 : 400 }}>Bold</span>
          </Toggle>
          <Toggle pressed={toggleItalic} onPressedChange={onToggleItalicChange}>
            <span style={{ fontStyle: toggleItalic ? "italic" : "normal" }}>
              Italic
            </span>
          </Toggle>
        </div>
      </div>
      <div>
        <h4
          className="mb-3 text-sm font-medium"
          style={{ color: "rgb(var(--colors-text-primary))" }}
        >
          Switches
        </h4>
        <div className="space-y-3">
          <Switch
            checked={switchNotifications}
            onCheckedChange={onSwitchNotificationsChange}
            label="Enable notifications"
          />
          <Switch
            checked={switchDarkMode}
            onCheckedChange={onSwitchDarkModeChange}
            label="Dark mode"
          />
        </div>
      </div>
    </div>
  );
}
