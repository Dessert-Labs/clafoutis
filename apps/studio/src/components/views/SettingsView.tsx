import { Github, LogOut, Moon, Sun } from "lucide-react";

import type { GitHubUser } from "@/lib/github-api";

import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SettingsViewProps {
  dark: boolean;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

const SettingsView = ({
  dark,
  user,
  isAuthenticated,
  onToggleTheme,
  onLogin,
  onLogout,
}: SettingsViewProps) => (
  <div className="mx-auto max-w-2xl space-y-6 overflow-y-auto px-4 py-6">
    <h1 className="text-2xl font-bold text-studio-text">Settings</h1>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {dark ? <Moon size={18} /> : <Sun size={18} />}
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-studio-text">Dark mode</p>
            <p className="text-xs text-studio-text-muted">
              Switch between light and dark theme for the studio interface.
            </p>
          </div>
          <button
            onClick={onToggleTheme}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${dark ? "bg-studio-accent" : "bg-studio-border"}`}
            role="switch"
            aria-checked={dark}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${dark ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github size={18} />
          GitHub Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAuthenticated && user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {user.avatar_url && (
                <img
                  src={user.avatar_url}
                  alt={user.login}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <p className="font-medium text-studio-text">
                  {user.name || user.login}
                </p>
                <p className="text-xs text-studio-text-muted">@{user.login}</p>
              </div>
            </div>
            <p className="text-xs text-studio-text-muted">
              Signed in. You can push token changes as pull requests and access
              private repos.
            </p>
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut size={14} className="mr-2" />
              Sign out
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-studio-text-secondary">
              Not signed in. Connect your GitHub account to push token changes
              and access private repos.
            </p>
            <Button size="sm" onClick={onLogin}>
              <Github size={14} className="mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-studio-text-secondary">
          <p>
            <span className="font-medium text-studio-text">
              Clafoutis Studio
            </span>{" "}
            is a visual editor for design tokens following the{" "}
            <a
              href="https://tr.designtokens.org/format/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-studio-accent underline"
            >
              DTCG specification
            </a>
            .
          </p>
          <p>
            Edit tokens, preview them live on components and a freeform canvas,
            then publish changes back to GitHub as a pull request.
          </p>
          <p className="text-xs text-studio-text-muted">
            Part of the{" "}
            <a
              href="https://github.com/beauwilliams/clafoutis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-studio-accent underline"
            >
              Clafoutis
            </a>{" "}
            design system framework.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default SettingsView;
