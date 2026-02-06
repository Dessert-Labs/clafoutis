import { redirect } from "@tanstack/react-router";

import { getStoredToken } from "./storage";

export function authGuard() {
  const token = getStoredToken();
  if (!token) {
    throw redirect({ to: "/" });
  }
}
