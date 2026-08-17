import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Megaphone, Send } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Broadcast</h1>
        <p className="text-sm text-muted-foreground">
          Send an in-app notification to a group of users.
        </p>
      </header>

      <form
        onSubmit={send}
        className="max-w-2xl space-y-5 rounded-xl border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 rounded-lg bg-accent/10 p-3 text-sm">
          <Megaphone className="h-5 w-5 text-accent" />
          <span className="text-muted-foreground">
            Recipients will see this in their bell instantly and via toast if online.
          </span>
        </div>

        <div className="space-y-2">
          <Label>Audience</Label>
          <Select value={target} onValueChange={(v) => setTarget(v as typeof target)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. New feature: shipping estimates" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} rows={4} placeholder="Short message visible in the notification…" />
          <p className="text-xs text-muted-foreground">{body.length}/500</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link">Link (optional)</Label>
          <Input id="link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/cars or /import" />
        </div>

        <Button type="submit" disabled={sending} className="bg-primary hover:bg-primary/90">
          <Send className="mr-2 h-4 w-4" /> {sending ? "Sending…" : "Send broadcast"}
        </Button>
      </form>
    </div>
  );
}
