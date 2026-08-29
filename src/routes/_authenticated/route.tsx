import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE, DEMO_PROFILES } from "@/contexts/AuthContext";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        return { user: data.user };
      }
    } catch {
      // Treat an unavailable or invalid session as unauthenticated.
    }

    if (DEMO_MODE) {
      return { user: DEMO_PROFILES.buyer.user };
    }

    throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
