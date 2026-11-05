import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowUp, Loader2, Search, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiCarCompanion, type CompanionReply } from "@/lib/companion.functions";
import { useCurrency } from "@/contexts/CurrencyContext";
import { VehicleImage } from "@/components/VehicleImage";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Turn = { role: "user" | "assistant"; content: string; reply?: CompanionReply };

const STARTERS = [
  "Family SUV under KES 5M",
  "What should I check before buying a used car?",
  "How much does importing from Japan cost?",
  "Hybrid or diesel for Nairobi traffic?",
];

/** Floating AI companion available on every public page. Hidden inside dashboards. */
export function CarCompanion() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: (history: Turn[]) =>
      aiCarCompanion({
        data: { messages: history.map(({ role, content }) => ({ role, content })), page: pathname },
      }),
    onSuccess: (reply) => setTurns((prev) => [...prev, { role: "assistant", content: reply.reply, reply }]),
    onError: (error: Error) =>
      setTurns((prev) => [
        ...prev,
        { role: "assistant", content: error.message || "I couldn't answer just now. Please try again in a moment." },
      ]),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, ask.isPending]);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || ask.isPending) return;
    const next = [...turns, { role: "user" as const, content }].slice(-20);
    setTurns(next);
    setInput("");
    ask.mutate(next);
  };

  const inWorkspace = /^\/(seller|admin|account|dashboard|transactions|complete-profile|garage|service-bookings)/.test(pathname);
  if (inWorkspace) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-full bg-ac-ink text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(0,0,0,.25)] transition hover:-translate-y-0.5 sm:bottom-6 sm:left-6 sm:px-5"
        aria-label="Ask the AutoConnect AI companion"
      >
        <Sparkles className="h-4 w-4 text-ac-accent" />
        <span className="hidden sm:inline">Ask AI</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md [&>button]:hidden">
          <SheetHeader className="flex-row items-center justify-between gap-3 space-y-0 bg-ac-ink px-5 py-4 text-left text-white">
            <div>
              <SheetTitle className="flex items-center gap-2 text-lg font-extrabold text-white">
                <Sparkles className="h-4 w-4 text-ac-accent" /> Car companion
              </SheetTitle>
              <SheetDescription className="text-xs text-white/60">
                Ask anything about choosing, importing or owning a car.
              </SheetDescription>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {turns.length === 0 && (
              <div>
                <p className="font-brand text-3xl">How can I help you find your next car?</p>
                <p className="mt-2 text-sm text-muted-foreground">I can see what's listed right now and point you to real cars.</p>
                <div className="mt-5 flex flex-col gap-2">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="min-h-11 rounded-2xl border border-border px-4 text-left text-sm font-semibold transition hover:border-foreground/40 hover:bg-muted"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, index) => (
              <div key={index} className={turn.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={turn.role === "user" ? "max-w-[85%]" : "w-full max-w-[92%]"}>
                  <div
                    className={
                      turn.role === "user"
                        ? "rounded-3xl rounded-br-md bg-ac-ink px-4 py-3 text-sm leading-6 text-white"
                        : "rounded-3xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-6"
                    }
                  >
                    {turn.content}
                  </div>
                  {turn.reply && <ReplyExtras reply={turn.reply} onAsk={send} onNavigate={() => setOpen(false)} />}
                </div>
              </div>
            ))}

            {ask.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              send(input);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-end gap-2 rounded-3xl border border-border bg-card p-1.5 pl-4">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Message the companion…"
                aria-label="Message the companion"
                className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || ask.isPending}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink transition disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 px-2 text-[11px] text-muted-foreground">AI guidance. Always check the listing evidence and seller terms.</p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ReplyExtras({
  reply,
  onAsk,
  onNavigate,
}: {
  reply: CompanionReply;
  onAsk: (text: string) => void;
  onNavigate: () => void;
}) {
  const { formatPrice } = useCurrency();
  const ids = reply.picks.map((p) => p.carId);
  const cars = useQuery({
    enabled: ids.length > 0,
    queryKey: ["companion-picks", ids],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("id,title,price,currency,car_images(image_url,is_primary,sort_order)")
        .in("id", ids);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="mt-2 space-y-2">
      {reply.picks.map((pick) => {
        const car = cars.data?.find((c) => c.id === pick.carId);
        const images = (car?.car_images ?? []) as { image_url: string; is_primary: boolean; sort_order: number }[];
        const cover = [...images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
        return (
          <Link
            key={pick.carId}
            to="/cars/$id"
            params={{ id: pick.carId }}
            onClick={onNavigate}
            className="flex gap-3 rounded-2xl border border-border bg-card p-2 transition hover:border-foreground/30"
          >
            <span className="block aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
              <VehicleImage src={cover?.image_url} alt={car?.title ?? "Vehicle"} className="h-full w-full object-cover" />
            </span>
            <span className="min-w-0 py-1">
              <span className="block truncate text-sm font-bold">{car?.title ?? "Loading…"}</span>
              {car?.price != null && (
                <span className="block text-sm font-extrabold">{formatPrice(Number(car.price), car.currency ?? "USD")}</span>
              )}
              <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{pick.reason}</span>
            </span>
          </Link>
        );
      })}

      {reply.searchQuery && (
        <Link
          to="/cars"
          search={{ q: reply.searchQuery } as never}
          onClick={onNavigate}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ac-accent px-4 text-xs font-extrabold text-ac-ink"
        >
          <Search className="h-3.5 w-3.5" /> Search “{reply.searchQuery}”
        </Link>
      )}

      {reply.followUps.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {reply.followUps.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onAsk(f)}
              className="min-h-9 rounded-full border border-border px-3 text-xs font-semibold transition hover:bg-muted"
            >
              {f}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
