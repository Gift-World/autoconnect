import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, CheckCheck, MessageSquare, Megaphone, Car, ShieldCheck, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function iconFor(type: string) {
  switch (type) {
    case "inquiry_new":
    case "message_new":
      return <MessageSquare className="h-4 w-4" />;
    case "listing_approved":
    case "listing_rejected":
      return <Car className="h-4 w-4" />;
    case "seller_approved":
    case "seller_rejected":
      return <ShieldCheck className="h-4 w-4" />;
    case "import_status":
      return <Inbox className="h-4 w-4" />;
    case "broadcast":
      return <Megaphone className="h-4 w-4" />;
    default:
      return <Mail className="h-4 w-4" />;
  }
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((n) => !n.is_read).length;

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,body,link,is_read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems((data as NotificationRow[]) ?? []);
  }

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    void load();
    const channel = supabase
      .channel(`notif:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as NotificationRow;
          setItems((cur) => [n, ...cur].slice(0, 20));
          toast(n.title, { description: n.body ?? undefined });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function markAllRead() {
    if (!user || unread === 0) return;
    setItems((cur) => cur.map((n) => ({ ...n, is_read: true })));
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
  }

  async function openItem(n: NotificationRow) {
    setOpen(false);
    if (!n.is_read) {
      setItems((cur) => cur.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      void supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
    }
    if (n.link) void navigate({ to: n.link });
  }

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Notifications</h3>
            <p className="text-xs text-muted-foreground">{unread} unread</p>
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="h-7 text-xs">
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              You're all caught up.
            </div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => openItem(n)}
                className={cn(
                  "flex w-full gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  !n.is_read && "bg-accent/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                    !n.is_read ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground",
                  )}
                >
                  {iconFor(n.type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{n.title}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </span>
                  {n.body && (
                    <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                  )}
                </span>
                {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </button>
            ))
          )}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-sm"
            onClick={() => {
              setOpen(false);
              void navigate({ to: "/account/notifications" });
            }}
          >
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
