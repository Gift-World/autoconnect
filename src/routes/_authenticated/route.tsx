import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
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
      // Treat an unavailable or invalid session as unauthenticated.
    }

    throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});
