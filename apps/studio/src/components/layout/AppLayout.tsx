import React from "react";

import type { GitHubUser } from "@/lib/github-api";

import { Header } from "./Header";

interface AppLayoutProps {
  children: React.ReactNode;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
}

export function AppLayout({
  children,
  user,
  isAuthenticated,
  onLogin,
  onLogout,
  onOpenHelp,
}: Readonly<AppLayoutProps>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-studio-bg">
      <Header
        user={user}
        isAuthenticated={isAuthenticated}
        onLogin={onLogin}
        onLogout={onLogout}
        onOpenHelp={onOpenHelp}
      />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
