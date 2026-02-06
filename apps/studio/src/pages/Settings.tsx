import { useCallback, useEffect, useState } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import SettingsView from "@/components/views/SettingsView";
import { useAuth } from "@/contexts/AuthProvider";

function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  const toggle = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("studio-theme", next ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const stored = localStorage.getItem("studio-theme");
    if (stored === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  return { dark, toggle };
}

export function Settings() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const { dark, toggle } = useTheme();

  return (
    <AppLayout
      user={user}
      isAuthenticated={isAuthenticated}
      onLogin={login}
      onLogout={logout}
      onOpenHelp={() =>
        document.dispatchEvent(new CustomEvent("studio:open-help"))
      }
    >
      <SettingsView
        dark={dark}
        user={user}
        isAuthenticated={isAuthenticated}
        onToggleTheme={toggle}
        onLogin={login}
        onLogout={logout}
      />
    </AppLayout>
  );
}
