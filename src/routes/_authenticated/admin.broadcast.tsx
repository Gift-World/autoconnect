import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminPage, AdminPanel } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/broadcast")({
  head: () => ({ meta: [{ title: "Broadcast — Admin — AutoConnect" }] }),
  component: BroadcastPage,
});

function BroadcastPage() {
  const [target, setTarget] = useState<"all" | "buyer" | "seller" | "admin">("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title required");
    setSending(true);
    const { data, error } = await supabase.rpc("broadcast_notification", {
      _target: target,
      _title: title.trim(),
      _body: body.trim() || null,
      _link: link.trim() || null,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success(`Sent to ${data ?? 0} user${data === 1 ? "" : "s"}`);
    setTitle("");
    setBody("");
    setLink("");
  }

  const audienceLabel =
    target === "all"
      ? "Everyone"
      : target === "buyer"
        ? "All buyers"
        : target === "seller"
          ? "All sellers"
          : "Admins only";

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Comms"
        title="Broadcast"
        description="Send an in-app notification to a group of users."
      />

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <AdminPanel kicker="Compose" title="New notification" bodyClassName="p-4 sm:p-6">
          <form onSubmit={send} className="space-y-5">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="buyer">All buyers</SelectItem>
                  <SelectItem value="seller">All sellers</SelectItem>
                  <SelectItem value="admin">Admins only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="e.g. New feature: shipping estimates"
                className="h-11 rounded-2xl"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Short message visible in the notification…"
                className="rounded-2xl"
              />
              <p className="text-right text-xs tabular-nums text-muted-foreground">
                {body.length}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="link">Link (optional)</Label>
              <Input
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="/cars or /import"
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                Sends immediately to{" "}
                <span className="font-semibold text-foreground">{audienceLabel}</span>.
              </p>
              <Button
                type="submit"
                disabled={sending}
                className="h-12 rounded-full bg-ac-accent px-6 font-extrabold text-ac-ink hover:bg-ac-accent/90"
              >
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send broadcast"}
              </Button>
            </div>
          </form>
        </AdminPanel>

        <div className="space-y-4">
          <div className="rounded-3xl bg-ac-ink p-5 text-white sm:p-6">
            <p className="brand-kicker text-ac-accent">Preview</p>
            <div className="mt-4 rounded-2xl bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {title.trim() || "Your notification title"}
                  </p>
                  <p className="mt-1 break-words text-sm text-white/70">
                    {body.trim() || "Your short message shows here."}
                  </p>
                  {link.trim() && (
                    <p className="mt-2 break-all text-xs font-semibold text-ac-accent">
                      {link.trim()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/60">Audience: {audienceLabel}</p>
          </div>
          <div className="flex items-start gap-3 rounded-3xl border border-border bg-card p-4 text-sm">
            <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-ac-accent" />
            <span className="text-muted-foreground">
              Recipients will see this in their bell instantly and via toast if online.
            </span>
          </div>
        </div>
      </div>
    </AdminPage>
  );
}
