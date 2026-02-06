import { Link } from "@tanstack/react-router";
import { HelpCircle, Settings } from "lucide-react";

import type { GitHubUser } from "@/lib/github-api";

interface HeaderProps {
  user: GitHubUser | null;
  isAuthenticated: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHelp: () => void;
}

export function Header({
  user,
  isAuthenticated,
  onLogin,
  onLogout,
  onOpenHelp,
}: Readonly<HeaderProps>) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-studio-border bg-studio-bg px-4">
      <Link to="/" className="text-lg font-semibold text-studio-text">
        Clafoutis Studio
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={onOpenHelp}
          className="rounded-md p-2 text-studio-text-muted hover:bg-studio-bg-tertiary hover:text-studio-text"
        >
          <HelpCircle size={18} />
        </button>

        <Link
          to="/settings"
          className="rounded-md p-2 text-studio-text-muted hover:bg-studio-bg-tertiary hover:text-studio-text"
        >
          <Settings size={18} />
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {user?.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.login}
                className="h-7 w-7 rounded-full"
              />
            )}
            <button
              onClick={onLogout}
              className="text-sm text-studio-text-secondary hover:text-studio-text"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="rounded-md bg-studio-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-studio-accent-hover"
          >
            Sign in with GitHub
          </button>
        )}
      </div>
    </header>
  );
}
