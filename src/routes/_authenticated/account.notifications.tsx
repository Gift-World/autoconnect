import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellDot, CalendarClock, CheckCheck, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { NotificationPreferences } from "@/components/account/NotificationPreferences";
import {
  ErrorNotice,
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton } from "@/components/account/dashboard-utils";

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

  const { data, isLoading, isError, refetch } = useQuery({
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
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["notifications-all", user.id] });
  }

  const rows = data ?? [];
  const unread = rows.filter((n) => !n.is_read);
  const read = rows.filter((n) => n.is_read);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const thisWeek = rows.filter((n) => new Date(n.created_at).getTime() >= weekAgo).length;

  const renderRow = (n: Row) => (
    <button
      key={n.id}
      onClick={async () => {
        if (!n.is_read)
          await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
        if (n.link) void navigate({ to: n.link });
      }}
      className={cn(
        "flex min-h-16 w-full items-start gap-3 border-b border-border px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/60 sm:px-5",
        !n.is_read && "bg-ac-accent/[0.06]",
      )}
    >
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          !n.is_read ? "bg-ac-accent" : "bg-border",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <span className={cn("truncate text-sm", !n.is_read ? "font-bold" : "font-medium")}>
            {n.title}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {new Date(n.created_at).toLocaleString()}
          </span>
        </span>
        {n.body && (
          <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{n.body}</span>
        )}
      </span>
      {n.link && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Everything happening with your account."
        actions={
          <button
            type="button"
            onClick={markAll}
            disabled={unread.length === 0}
            className={primaryButton}
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        }
      />

      <StatRow className="lg:grid-cols-3">
        <StatTile label="Unread" value={unread.length} icon={<BellDot />} tone="ink" loading={isLoading} />
        <StatTile label="Last 7 days" value={thisWeek} icon={<CalendarClock />} loading={isLoading} />
        <StatTile label="All notifications" value={rows.length} icon={<Bell />} loading={isLoading} />
      </StatRow>

      {isLoading ? (
        <ListSkeleton rows={4} className="h-16" />
      ) : isError ? (
        <ErrorNotice title="We couldn't load your notifications" onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No notifications yet"
          description="We'll let you know about inquiries, approvals, and updates here. Save a car or send an inquiry to get started."
          actionLabel="Browse cars"
          actionTo="/cars"
        />
      ) : (
        <>
          {unread.length > 0 && (
            <section>
              <SectionHeading kicker="New" title={`Unread (${unread.length})`} />
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                {unread.map(renderRow)}
              </div>
            </section>
          )}
          {read.length > 0 && (
            <section>
              <SectionHeading kicker="Earlier" title="Already read" />
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                {read.map(renderRow)}
              </div>
            </section>
          )}
        </>
      )}

      <section>
        <SectionHeading
          kicker="Settings"
          title="Alert preferences"
          description="Choose which updates reach you."
        />
        {/* Smart Notification Preferences Configurator */}
        <NotificationPreferences />
      </section>
    </div>
  );
}
