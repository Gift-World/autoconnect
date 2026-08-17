import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export function InquiryThread({
  inquiryId,
  selfRole,
  initialMessage,
}: {
  inquiryId: string;
  selfRole: "buyer" | "seller" | "admin";
  initialMessage?: { body: string; created_at: string; sender_name: string };
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const { data } = await supabase
      .from("inquiry_messages")
      .select("id, sender_id, sender_role, body, created_at")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });
    setMessages((data as Message[]) ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    void load();
    const ch = supabase
      .channel(`thread:${inquiryId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inquiry_messages", filter: `inquiry_id=eq.${inquiryId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function send() {
    if (!user || !body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("inquiry_messages").insert({
      inquiry_id: inquiryId,
      sender_id: user.id,
      sender_role: selfRole,
      body: text,
    });
    setSending(false);
    if (error) {
      setBody(text);
      toast.error(error.message);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {initialMessage && (
          <Bubble
            mine={false}
            label={initialMessage.sender_name}
            time={initialMessage.created_at}
            body={initialMessage.body}
          />
        )}
        {!loaded ? (
          <div className="flex justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 && !initialMessage ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <Bubble
              key={m.id}
              mine={m.sender_id === user?.id}
              label={m.sender_role}
              time={m.created_at}
              body={m.body}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t bg-muted/30 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a reply…"
            rows={2}
            className="min-h-[44px] resize-none bg-background"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={send} disabled={sending || !body.trim()} size="icon" className="h-11 w-11 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">Press Enter to send, Shift+Enter for new line.</p>
      </div>
    </div>
  );
}

function Bubble({ mine, label, time, body }: { mine: boolean; label: string; time: string; body: string }) {
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
          mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
      <span className="mt-1 px-1 text-[11px] capitalize text-muted-foreground">
        {label} · {new Date(time).toLocaleString()}
      </span>
    </div>
  );
}
