import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { LayoutDashboard, Plus, Inbox, MessageSquare, FileBadge, Wallet, ShieldCheck, Wrench, Store, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const Route = createFileRoute("/_authenticated/seller")({
  beforeLoad: async () => {
    let user = null;
    try {
      const { data: u } = await supabase.auth.getUser();
      user = u?.user ?? null;
    } catch {
      // ignore
    }

    if (!user && !DEMO_MODE) {
      throw redirect({ to: "/login" });
    }

    let activeRole: string | null = null;
    if (typeof window !== "undefined") {
      try {
        activeRole = localStorage.getItem("autoconnect_active_role");
      } catch {
        // ignore
      }
    }

    // If active perspective is seller, yard_manager, or admin, allow access
    if (
      activeRole === "seller" ||
      activeRole === "yard_manager" ||
      activeRole === "admin" ||
      DEMO_MODE
    ) {
      return;
    }

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profile &&
        (profile.role === "seller" ||
          profile.role === "yard_manager" ||
          profile.role === "admin")
      ) {
        return;
      }
    }

    throw redirect({ to: "/dashboard" });
  },
  component: SellerLayout,
});

function SellerLayout() {
  return (
    <DashboardShell
      area="Seller workspace"
      areaSubtitle="Inventory, inquiries & exports"
      sections={[
        {
          label: "Overview",
          items: [
            { to: "/seller", icon: <LayoutDashboard />, label: "Dashboard", exact: true },
            { to: "/seller/verify", icon: <ShieldCheck />, label: "Verify account" },
            { to: "/seller/inquiries", icon: <MessageSquare />, label: "Inquiries" },
          ],
        },
        {
          label: "Inventory",
          items: [
            { to: "/seller/listings/new", icon: <Plus />, label: "New listing" },
            { to: "/seller/yard", icon: <Store />, label: "My car yard" },
            { to: "/seller/documents", icon: <FileBadge />, label: "Documents" },
            { to: "/seller/inspections", icon: <Wrench />, label: "Inspections" },
            { to: "/seller/import-requests", icon: <Inbox />, label: "Import requests" },
          ],
        },
        {
          label: "Finance & Growth",
          items: [
            { to: "/seller/transactions", icon: <Wallet />, label: "Transactions & payouts" },
            { to: "/pricing", icon: <Sparkles />, label: "Seller Plans & Pricing" },
          ],
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}
