import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
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
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) throw redirect({ to: "/admin/login" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", u.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") throw redirect({ to: "/dashboard" });
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
