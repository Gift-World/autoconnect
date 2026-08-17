import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/account/notifications")({
  head: () => ({ meta: [{ title: "Notifications — AutoConnect" }] }),
  component: NotificationsPage,
});

interface Row {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["notifications-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,type,title,body,link,is_read,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications-all", user.id] });
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Notifications</h2>
          <p className="text-sm text-muted-foreground">Everything happening with your account.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAll}>
          <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications yet"
          description="We'll let you know about inquiries, approvals, and updates here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          {data.map((n) => (
            <button
              key={n.id}
              onClick={async () => {
                if (!n.is_read)
                  await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
                if (n.link) void navigate({ to: n.link });
              }}
              className={cn(
                "flex w-full items-start gap-3 border-b px-4 py-4 text-left transition-colors hover:bg-muted/60",
                !n.is_read && "bg-accent/[0.04]",
              )}
            >
              <span className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                !n.is_read ? "bg-accent" : "bg-border",
              )} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{n.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
                {n.body && <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{n.body}</span>}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
