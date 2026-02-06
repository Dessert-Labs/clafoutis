import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  buildAuthUrl,
  exchangeCodeForToken,
  generateCodeChallenge,
  generateCodeVerifier,
} from "@/lib/auth/oauth";
import {
  clearStoredToken,
  clearStoredVerifier,
  getStoredToken,
  getStoredVerifier,
  storeToken,
  storeVerifier,
} from "@/lib/auth/storage";
import { getAuthenticatedUser, type GitHubUser } from "@/lib/github-api";

const DEV_TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;

interface AuthState {
  accessToken: string | null;
  user: GitHubUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  handleCallback: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function getInitialToken(): string | null {
  return DEV_TOKEN || getStoredToken();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(
    getInitialToken(),
  );
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [isLoading, setIsLoading] = useState(!!getInitialToken());

  useEffect(() => {
    if (accessToken) {
      setIsLoading(true);
      getAuthenticatedUser(accessToken)
        .then(setUser)
        .catch(() => {
          clearStoredToken();
          setAccessToken(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [accessToken]);

  const login = useCallback(async () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      alert(
        "GitHub OAuth is not configured.\n\nCreate an .env file with VITE_GITHUB_CLIENT_ID set to your GitHub OAuth App client ID.\n\nSee .env.example for details.",
      );
      return;
    }
    const redirectUri =
      import.meta.env.VITE_GITHUB_REDIRECT_URI ||
      `${window.location.origin}/callback`;
    const verifier = generateCodeVerifier();
    storeVerifier(verifier);
    const challenge = await generateCodeChallenge(verifier);
    window.location.href = buildAuthUrl(clientId, redirectUri, challenge);
  }, []);

  const handleCallback = useCallback(async (code: string) => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) throw new Error("VITE_GITHUB_CLIENT_ID is not configured");
    const redirectUri =
      import.meta.env.VITE_GITHUB_REDIRECT_URI ||
      `${window.location.origin}/callback`;
    const verifier = getStoredVerifier();
    if (!verifier) throw new Error("Missing code verifier");
    clearStoredVerifier();
    const token = await exchangeCodeForToken(
      clientId,
      code,
      verifier,
      redirectUri,
    );
    storeToken(token);
    setAccessToken(token);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setAccessToken(null);
    setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        handleCallback,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
