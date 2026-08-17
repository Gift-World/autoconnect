import { createFileRoute, Outlet } from "@tanstack/react-router";
import { User as UserIcon, Heart, MessageSquare, Plane, Bell, Receipt, ShieldCheck } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountLayout,
});

function AccountLayout() {
  return (
    <DashboardShell
      area="My account"
      areaSubtitle="Saved cars, inquiries & profile"
      sections={[
        {
          label: "Account",
          items: [
            { to: "/account", icon: <UserIcon />, label: "Profile", exact: true },
            { to: "/account/verify", icon: <ShieldCheck />, label: "Verify identity" },
            { to: "/account/notifications", icon: <Bell />, label: "Notifications" },
          ],
        },
        {
          label: "Activity",
          items: [
            { to: "/account/favorites", icon: <Heart />, label: "Favorites" },
            { to: "/account/inquiries", icon: <MessageSquare />, label: "My inquiries" },
            { to: "/account/purchases", icon: <Receipt />, label: "My purchases" },
            { to: "/account/import-requests", icon: <Plane />, label: "Import requests" },
          ],
        },
      ]}
    >
      <Outlet />
    </DashboardShell>
  );
}
