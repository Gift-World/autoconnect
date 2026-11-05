import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Plus,
  Inbox,
  MessageSquare,
  FileBadge,
  Wallet,
  ShieldCheck,
  Wrench,
  Store,
  Sparkles,
  Gavel,
  ArrowRightLeft,
  BadgeCheck,
} from "lucide-react";
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
        (profile.role === "seller" || profile.role === "yard_manager" || profile.role === "admin")
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
      areaSubtitle="Listings, buyers and payouts"
      sections={[
        {
          label: "Today",
          items: [
            { to: "/seller", icon: <LayoutDashboard />, label: "Today", exact: true },
            { to: "/seller/inquiries", icon: <MessageSquare />, label: "Inquiries" },
            { to: "/seller/transactions", icon: <Wallet />, label: "Transactions & payouts" },
          ],
        },
        {
          label: "Listings",
          items: [
            { to: "/seller/listings/new", icon: <Plus />, label: "New listing" },
            { to: "/seller/yard", icon: <Store />, label: "My car yard" },
            { to: "/seller/auctions", icon: <Gavel />, label: "Auctions & flash offers" },
            { to: "/seller/documents", icon: <FileBadge />, label: "Documents" },
            { to: "/seller/evidence", icon: <ShieldCheck />, label: "Vehicle evidence" },
            { to: "/seller/inspections", icon: <Wrench />, label: "Inspections" },
          ],
        },
        {
          label: "Leads",
          items: [
            { to: "/seller/trade-ins", icon: <ArrowRightLeft />, label: "Trade-in leads" },
            { to: "/seller/import-requests", icon: <Inbox />, label: "Import requests" },
          ],
        },
        {
          label: "Account",
          items: [
            { to: "/seller/verify", icon: <BadgeCheck />, label: "Verify account" },
            { to: "/pricing", icon: <Sparkles />, label: "Seller plans & pricing" },
          ],
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}
