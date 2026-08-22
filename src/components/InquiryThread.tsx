import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Send,
  Radio,
  Sparkles,
  ShieldCheck,
  CheckCheck,
  HelpCircle,
  Car,
  Clock,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

const QUICK_PROMPTS_BUYER = [
  "Is this car still available?",
  "Can we schedule a mechanical inspection?",
  "Are export logbooks and NTSA papers clean?",
  "Can you share photos of the undercarriage?",
];

const QUICK_PROMPTS_SELLER = [
  "Yes, the vehicle is available for viewing and inspection.",
  "Vehicle passport and inspection report are verified.",
  "We can prepare the gate pass once deposit is held in escrow.",
  "Feel free to request an independent mechanic check anytime.",
];

export function InquiryThread({
  inquiryId,
  selfRole,
  initialMessage,
}: {
  inquiryId: string;
  selfRole: "buyer" | "seller" | "admin" | "yard_manager";
  initialMessage?: { body: string; created_at: string; sender_name: string };
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isRealtimeActive, setIsRealtimeActive] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
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

    // Supabase Realtime channel
    const channel = supabase
      .channel(`inquiry_thread_${inquiryId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
          filter: `inquiry_id=eq.${inquiryId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((cur) => {
            if (cur.some((x) => x.id === m.id)) return cur;
            if (m.sender_id !== user?.id) {
              toast.info(`New message from ${m.sender_role}`, {
                description: m.body.slice(0, 60),
                icon: <Radio className="h-4 w-4 text-primary animate-pulse" />,
              });
            }
            return [...cur, m];
          });
        }
      )
      .subscribe((status) => {
        setIsRealtimeActive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryId, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  async function send(customText?: string) {
    const textToSend = (customText || body).trim();
    if (!textToSend) return;
    if (!user) {
      toast.error("Please sign in to send messages.");
      return;
    }

    setSending(true);
    setBody("");

    // Optimistic message append
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      sender_role: selfRole,
      body: textToSend,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { data, error } = await supabase
      .from("inquiry_messages")
      .insert({
        inquiry_id: inquiryId,
        sender_id: user.id,
        sender_role: selfRole,
        body: textToSend,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      // Revert optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setBody(textToSend);
      toast.error(error.message);
    } else if (data) {
      setMessages((prev) => prev.map((m) => (m.id === tempId ? (data as Message) : m)));
    }
  }

  const quickPrompts = selfRole === "buyer" ? QUICK_PROMPTS_BUYER : QUICK_PROMPTS_SELLER;

  return (
    <div className="flex h-full flex-col bg-card/40 rounded-2xl border border-border/70 overflow-hidden">
      {/* Thread Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
            <Radio className="h-3.5 w-3.5" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-foreground">Live Negotiation & Inquiries</h4>
            <p className="text-[10px] text-muted-foreground">Direct buyer-seller instant channel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-[10px] font-medium transition-colors",
              isRealtimeActive
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-border text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isRealtimeActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
              )}
            />
            {isRealtimeActive ? "Realtime Live" : "Connecting..."}
          </Badge>
          <Badge variant="outline" className="text-[10px] capitalize">
            {selfRole.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4 max-h-[420px]">
        {initialMessage && (
          <Bubble
            mine={false}
            label={initialMessage.sender_name || "Buyer"}
            time={initialMessage.created_at}
            body={initialMessage.body}
            isInitial
          />
        )}

        {!loaded ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : messages.length === 0 && !initialMessage ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-2">
              <Car className="h-5 w-5" />
            </span>
            <p className="text-xs font-medium text-foreground">No messages in this inquiry thread yet.</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Type a message below or tap a quick question chip to start.
            </p>
          </div>
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

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <span className="flex gap-1 items-center px-3 py-1.5 rounded-full bg-muted/70">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
            </span>
            <span className="text-[10px]">Recipient is typing…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="border-t border-border/50 bg-background/50 px-3 py-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          <span>Quick response suggestions:</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => void send(prompt)}
              disabled={sending}
              className="shrink-0 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-foreground hover:border-primary/50 hover:bg-primary/5 transition whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border/60 bg-muted/30 p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message or negotiate terms..."
            rows={2}
            className="min-h-[44px] resize-none bg-background text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button
            onClick={() => void send()}
            disabled={sending || !body.trim()}
            size="icon"
            className="h-11 w-11 shrink-0 bg-primary text-primary-foreground"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground px-1">
          <span>Press Enter to send · Auto-synced via Supabase Realtime</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-emerald-500" /> Escrow Protected
          </span>
        </div>
      </div>
    </div>
  );
}

function Bubble({
  mine,
  label,
  time,
  body,
  isInitial = false,
}: {
  mine: boolean;
  label: string;
  time: string;
  body: string;
  isInitial?: boolean;
}) {
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-xs",
          mine
            ? "rounded-br-xs bg-primary text-primary-foreground"
            : isInitial
            ? "rounded-bl-xs border border-primary/20 bg-primary/5 text-foreground"
            : "rounded-bl-xs border border-border/70 bg-card text-foreground"
        )}
      >
        {isInitial && (
          <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Initial Vehicle Inquiry
          </div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{body}</p>
      </div>
      <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-muted-foreground">
        <span className="font-medium capitalize">{label.replace("_", " ")}</span>
        <span>·</span>
        <span>{new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        {mine && <CheckCheck className="h-3 w-3 text-primary" />}
      </div>
    </div>
  );
}
