const TOKEN_KEY = "studio_access_token";
const VERIFIER_KEY = "studio_code_verifier";

export function getStoredToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function getStoredVerifier(): string | null {
  return sessionStorage.getItem(VERIFIER_KEY);
}

export function storeVerifier(verifier: string): void {
  sessionStorage.setItem(VERIFIER_KEY, verifier);
}

export function clearStoredVerifier(): void {
  sessionStorage.removeItem(VERIFIER_KEY);
}
