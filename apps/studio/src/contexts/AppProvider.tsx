import { AlertProvider } from "./AlertProvider";
import { AuthProvider } from "./AuthProvider";
import { QueryProvider } from "./QueryProvider";
import { RouterProvider } from "./RouterProvider";
import { TokenProvider } from "./TokenProvider";

export function AppProvider() {
  return (
    <AuthProvider>
      <QueryProvider>
        <TokenProvider>
          <AlertProvider>
            <RouterProvider />
          </AlertProvider>
        </TokenProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
