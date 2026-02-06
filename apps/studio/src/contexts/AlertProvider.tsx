import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

interface Alert {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

interface AlertState {
  alerts: Alert[];
  addAlert: (message: string, type?: Alert["type"]) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertState | null>(null);

function AlertToast({
  alert,
  onClose,
}: Readonly<{
  alert: Alert;
  onClose: () => void;
}>) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border p-4 shadow-md"
      style={{
        backgroundColor: `rgb(var(--colors-alert-${alert.type}-bg))`,
        borderColor: `rgb(var(--colors-alert-${alert.type}-border))`,
      }}
    >
      <p
        className="flex-1 text-sm font-medium"
        style={{
          color: `rgb(var(--colors-alert-${alert.type}-text))`,
        }}
      >
        {alert.message}
      </p>
      <button
        className="text-sm leading-none"
        style={{ color: `rgb(var(--colors-alert-${alert.type}-text))` }}
        onClick={onClose}
      >
        &times;
      </button>
    </div>
  );
}

function AlertContainer({
  alerts,
  onRemove,
}: Readonly<{
  alerts: Alert[];
  onRemove: (id: string) => void;
}>) {
  if (alerts.length === 0) return null;

  return createPortal(
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {alerts.map((alert) => (
        <AlertToast
          key={alert.id}
          alert={alert}
          onClose={() => onRemove(alert.id)}
        />
      ))}
    </div>,
    document.body,
  );
}

export function AlertProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const removeAlert = useCallback((id: string) => {
    const timerId = timersRef.current.get(id);
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timersRef.current.delete(id);
    }
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const addAlert = useCallback(
    (message: string, type: Alert["type"] = "info") => {
      const id = crypto.randomUUID();
      setAlerts((prev) => [...prev, { id, message, type }]);
      const timerId = globalThis.setTimeout(() => {
        timersRef.current.delete(id);
        removeAlert(id);
      }, 5000);
      timersRef.current.set(id, timerId);
    },
    [removeAlert],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timerId) => clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ alerts, addAlert, removeAlert }),
    [alerts, addAlert, removeAlert],
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      <AlertContainer alerts={alerts} onRemove={removeAlert} />
    </AlertContext.Provider>
  );
}

export function useAlerts() {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlerts must be used within AlertProvider");
  return context;
}
