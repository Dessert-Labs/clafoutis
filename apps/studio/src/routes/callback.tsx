import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { Loader } from "@/components/ui/loader";
import { useAuth } from "@/contexts/AuthProvider";

function CallbackPage() {
  const { handleCallback } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(globalThis.location.search);
    const code = params.get("code");

    if (!code) {
      navigate({ to: "/", search: { error: "missing_code" } });
      return;
    }

    (async () => {
      try {
        await handleCallback(code);
        navigate({ to: "/" });
      } catch (error) {
        console.error("Callback error:", error);
        navigate({ to: "/", search: { error: "callback_failed" } });
      }
    })();
  }, [handleCallback, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader />
    </div>
  );
}

export const Route = createFileRoute("/callback")({
  component: CallbackPage,
});
