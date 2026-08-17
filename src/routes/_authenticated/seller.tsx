import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Plus, Inbox, MessageSquare, FileBadge, Wallet, ShieldCheck, Wrench, Store } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const Route = createFileRoute("/_authenticated/seller")({
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/login" });
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.user.id)
      .maybeSingle();
    if (!profile || (profile.role !== "seller" && profile.role !== "admin")) {
      throw redirect({ to: "/" });
    }
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
          label: "Finance",
          items: [
            { to: "/seller/transactions", icon: <Wallet />, label: "Transactions & payouts" },
          ],
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}
