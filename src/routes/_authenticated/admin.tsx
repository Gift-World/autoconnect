import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Car,
  Inbox,
  Tags,
  Megaphone,
  ShieldCheck,
  Wallet,
  Wrench,
  Store,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    let user = null;
    try {
      const { data: u } = await supabase.auth.getUser();
      user = u?.user ?? null;
    } catch {
      // ignore
    }

    if (!user && !DEMO_MODE) {
      throw redirect({ to: "/admin/login" });
    }

    let activeRole: string | null = null;
    if (typeof window !== "undefined") {
      try {
        activeRole = localStorage.getItem("autoconnect_active_role");
      } catch {
        // ignore
      }
    }

    // Allow access if perspective is switched to admin or user is platform admin
    if (activeRole === "admin" || DEMO_MODE) {
      return;
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "admin") {
        return;
      }
    }

    throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <DashboardShell
      area="Admin console"
      areaSubtitle="Trust, moderation & growth"
      sections={[
        {
          label: "Overview",
          items: [
            { to: "/admin", icon: <LayoutDashboard />, label: "Overview", exact: true },
          ],
        },
        {
          label: "Moderation",
          items: [
            { to: "/admin/sellers", icon: <Users />, label: "Sellers" },
            { to: "/admin/verification", icon: <ShieldCheck />, label: "Verification queue" },
            { to: "/admin/listings", icon: <Car />, label: "Listings" },
            { to: "/admin/yards", icon: <Store />, label: "Car yards" },
            { to: "/admin/documents", icon: <ShieldCheck />, label: "Documents" },
            { to: "/admin/inspections", icon: <Wrench />, label: "Inspections" },
            { to: "/admin/import-requests", icon: <Inbox />, label: "Import requests" },
          ],
        },
        {
          label: "Catalog & comms",
          items: [
            { to: "/admin/makes", icon: <Tags />, label: "Makes & models" },
            { to: "/admin/broadcast", icon: <Megaphone />, label: "Broadcast" },
          ],
        },
        {
          label: "Finance",
          items: [
            { to: "/admin/transactions", icon: <Wallet />, label: "Transactions & escrow" },
          ],
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}
