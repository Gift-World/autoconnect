import { createFileRoute, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        return { user: data.user };
      }
    } catch {
      // Ignore network errors in demo mode
    }

    // In demo/interactive simulator mode, create fallback simulated user
    const activeRole =
      typeof window !== "undefined"
        ? localStorage.getItem("autoconnect_active_role") || "buyer"
        : "buyer";

    return {
      user: {
        id: `demo-${activeRole}`,
        email: `demo-${activeRole}@autoconnect.dev`,
        user_metadata: { full_name: `Demo ${activeRole.toUpperCase()}` },
      },
    };
  },
  component: () => <Outlet />,
});
