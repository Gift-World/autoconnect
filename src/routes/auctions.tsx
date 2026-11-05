import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, Gavel, LockKeyhole, ShieldCheck, UserRound, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trackProductEvent } from "@/lib/product-analytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auctions")({
  validateSearch: (search: Record<string, unknown>) => ({ auction: typeof search.auction === "string" ? search.auction : undefined }),
  head: () => ({ meta: [{ title: "Live car auctions & flash offers | AutoConnect" }, { name: "description", content: "Transparent timed vehicle auctions and flash offers with visible price, time and listing evidence." }] }),
  component: AuctionsPage,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Auction = any;

/** Ticks once per second so countdowns stay live. */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

function auctionPhase(auction: Auction, now: number): "upcoming" | "live" | "ended" {
  const starts = new Date(auction.starts_at).getTime();
  const ends = new Date(auction.ends_at).getTime();
  if (ends <= now) return "ended";
  if (starts <= now) return "live";
  return "upcoming";
}

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}

function shortCountdown(ms: number) {
  const { d, h, m, s } = splitDuration(ms);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function AuctionsPage() {
  const { auction: selectedId } = Route.useSearch();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");
  const [claiming, setClaiming] = useState(false);

  const { data: auctions, isLoading, isError, refetch } = useQuery({
    queryKey: ["vehicle-auctions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_auctions").select("id,sale_mode,starts_at,ends_at,reserve_price,minimum_increment,current_bid,bid_count,status,cars(id,title,year,mileage,mileage_unit,location_display,car_images(image_url,is_primary,sort_order))").order("ends_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Auction[];
    },
    refetchInterval: 30_000,
  });
  const selected = useMemo(() => auctions?.find((item) => item.id === selectedId) || auctions?.[0], [auctions, selectedId]);
  const { data: bids } = useQuery({
    queryKey: ["auction-public-bids", selected?.id],
    enabled: Boolean(selected?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_auction_bids", { p_auction_id: selected.id });
      if (error) throw error;
      return (data ?? []) as { amount: number; created_at: string; bidder_alias: string }[];
    },
    refetchInterval: 15_000,
  });
  useEffect(() => {
    if (selected) setBidAmount(String(Number(selected.current_bid || selected.reserve_price || 0) + Number(selected.minimum_increment || 0)));
  }, [selected?.id, selected?.current_bid, selected?.reserve_price, selected?.minimum_increment]);

  const submitBid = async () => {
    if (!selected) return;
    if (!user) { toast.error("Sign in to place a bid", { description: "We need an account to keep the bid trail fair and private." }); return; }
    const { error } = await supabase.rpc("submit_auction_bid", { p_auction_id: selected.id, p_amount: Number(bidAmount) });
    if (error) { toast.error("Bid was not accepted", { description: error.message }); return; }
    toast.success("Bid placed", { description: "The public feed shows a masked bidder alias, never your full name." });
    void trackProductEvent("auction_bid_placed", { auction_id: selected.id, sale_mode: selected.sale_mode });
    void queryClient.invalidateQueries({ queryKey: ["vehicle-auctions"] });
    void queryClient.invalidateQueries({ queryKey: ["auction-public-bids", selected.id] });
  };

  const claimWin = async () => {
    if (!selected) return;
    if (!user) { toast.error("Sign in to continue your reservation."); return; }
    setClaiming(true);
    const { data, error } = await supabase.rpc("claim_auction_win", { p_auction_id: selected.id });
    setClaiming(false);
    if (error) { toast.error("Reservation could not be created", { description: error.message }); return; }
    toast.success("Reservation created", { description: `Your reservation holds the winning price until ${new Date(data.expires_at).toLocaleString()}. Payment remains pending verification.` });
    void trackProductEvent("auction_reservation_created", { auction_id: selected.id, reservation_id: data.id, sale_mode: selected.sale_mode });
    void queryClient.invalidateQueries({ queryKey: ["vehicle-auctions"] });
  };

  const hasAuctions = !isLoading && !isError && (auctions?.length ?? 0) > 0;

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-[1360px] rounded-[28px] bg-ac-ink px-5 py-8 text-white sm:rounded-[36px] sm:px-10 sm:py-12">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ac-accent" />Market live
          </span>
          <h1 className="font-brand mt-4 max-w-3xl text-3xl sm:text-5xl">The fast lane, <span className="text-ac-accent">without the blind spots.</span></h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">A timed listing always shows its deadline, current price and listing evidence. Bids are binding only after the winner reviews the next reservation and payment steps.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.4fr)] lg:gap-8">
        {/* Selected auction first on mobile */}
        <section className="order-1 min-w-0 lg:order-2">
          {isLoading ? (
            <div className="overflow-hidden rounded-[28px] border border-border bg-card">
              <Skeleton className="aspect-[16/10] w-full rounded-none" />
              <div className="space-y-3 p-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <div className="grid grid-cols-2 gap-3 pt-3"><Skeleton className="h-16 rounded-2xl" /><Skeleton className="h-16 rounded-2xl" /></div>
              </div>
            </div>
          ) : selected ? (
            <AuctionDesk auction={selected} bids={bids || []} bidAmount={bidAmount} setBidAmount={setBidAmount} submitBid={submitBid} claimWin={claimWin} claiming={claiming} formatPrice={formatPrice} />
          ) : !isError && !hasAuctions ? (
            <div className="rounded-[28px] border border-border bg-card p-8 sm:p-10">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ac-cream text-ac-ink"><Gavel className="h-6 w-6" /></span>
              <h2 className="font-brand mt-5 text-2xl sm:text-3xl">No auction is scheduled yet.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Browse verified inventory or check back for seller-run timed offers.</p>
              <Button asChild className="mt-6 h-11 rounded-full bg-ac-accent px-6 font-bold text-ac-ink hover:bg-ac-accent/90"><Link to="/cars">Browse cars</Link></Button>
            </div>
          ) : (
            <div className="rounded-[28px] border border-border bg-card p-8"><Gavel className="h-8 w-8 text-foreground" /><h2 className="font-brand mt-4 text-2xl">Select an offer to review it.</h2></div>
          )}
        </section>

        <aside className="order-2 min-w-0 space-y-3 lg:order-1">
          <p className="brand-kicker px-1 text-muted-foreground">Live & upcoming</p>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-3xl" />)
          ) : isError ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="font-semibold">We could not load auction inventory.</p>
              <p className="mt-1 leading-5 opacity-80">This is a connection problem, not an empty auction result. You can safely try again.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" className="h-11 rounded-full" onClick={() => void refetch()}>Try again</Button>
                <Button asChild variant="outline" className="h-11 rounded-full"><Link to="/cars">Browse cars instead</Link></Button>
              </div>
            </div>
          ) : auctions?.length ? (
            auctions.map((auction) => <AuctionRow key={auction.id} auction={auction} selected={selected?.id === auction.id} formatPrice={formatPrice} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-6">
              <p className="font-semibold">Nothing in the lane right now.</p>
              <p className="mt-1 text-sm text-muted-foreground">New timed offers appear here as soon as sellers schedule them.</p>
              <Button asChild variant="outline" className="mt-4 h-11 rounded-full"><Link to="/cars">Browse cars</Link></Button>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function PhaseBadge({ auction, phase }: { auction: Auction; phase: "upcoming" | "live" | "ended" }) {
  const isFlash = auction.sale_mode === "flash_sale";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold", phase === "live" ? "bg-ac-accent text-ac-ink" : phase === "ended" ? "bg-muted text-muted-foreground" : "bg-ac-powder text-ac-ink")}>
      {isFlash ? <Zap className="h-3.5 w-3.5" /> : <Gavel className="h-3.5 w-3.5" />}
      {isFlash ? "Flash offer" : phase === "live" ? "Live auction" : phase === "ended" ? "Auction ended" : "Upcoming auction"}
    </span>
  );
}

function AuctionRow({ auction, selected, formatPrice }: { auction: Auction; selected: boolean; formatPrice: (value: number) => string }) {
  const now = useNow();
  const car = Array.isArray(auction.cars) ? auction.cars[0] : auction.cars;
  const isFlash = auction.sale_mode === "flash_sale";
  const phase = auctionPhase(auction, now);
  const target = phase === "upcoming" ? new Date(auction.starts_at).getTime() : new Date(auction.ends_at).getTime();
  return (
    <Link to="/auctions" search={{ auction: auction.id }} className={cn("block rounded-3xl border p-3 transition", selected ? "border-foreground bg-card shadow-sm" : "border-border bg-card hover:border-foreground/40")}>
      <div className="flex gap-3">
        <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {car?.car_images?.[0]?.image_url && <img src={car.car_images[0].image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{isFlash ? "Flash offer" : "Timed auction"}</span>
            <span className="text-[10px] text-muted-foreground">{auction.bid_count} bids</span>
          </div>
          <p className="mt-1 truncate text-sm font-bold text-foreground">{car?.title || "Vehicle offer"}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-mono text-sm font-bold text-foreground">{formatPrice(Number(auction.current_bid || auction.reserve_price || 0))}</p>
            <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums", phase === "live" ? "rounded-full bg-ac-accent px-2 py-0.5 text-ac-ink" : "text-muted-foreground")}>
              <Clock3 className="h-3 w-3" />
              {phase === "ended" ? "Ended" : `${phase === "upcoming" ? "Starts" : "Ends"} ${shortCountdown(target - now)}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Countdown({ auction }: { auction: Auction }) {
  const now = useNow();
  const phase = auctionPhase(auction, now);
  const target = phase === "upcoming" ? new Date(auction.starts_at).getTime() : new Date(auction.ends_at).getTime();
  const { d, h, m, s } = splitDuration(target - now);
  if (phase === "ended") {
    return (
      <div className="rounded-2xl bg-muted px-4 py-3">
        <p className="text-[11px] font-semibold text-muted-foreground">Auction ended</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{new Date(auction.ends_at).toLocaleString()}</p>
      </div>
    );
  }
  const units = [
    { v: d, l: "days" },
    { v: h, l: "hrs" },
    { v: m, l: "min" },
    { v: s, l: "sec" },
  ];
  return (
    <div className={cn("rounded-2xl px-4 py-3", phase === "live" ? "bg-ac-ink text-white" : "bg-ac-powder text-ac-ink")} aria-live="off">
      <p className={cn("text-[11px] font-semibold", phase === "live" ? "text-ac-accent" : "text-ac-ink/70")}>{phase === "live" ? "Ends in" : "Starts in"}</p>
      <div className="mt-1 flex items-end gap-3">
        {units.map((u) => (
          <div key={u.l} className="text-center">
            <p className="font-brand text-2xl tabular-nums sm:text-3xl">{String(u.v).padStart(2, "0")}</p>
            <p className="text-[10px] uppercase tracking-wide opacity-70">{u.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuctionDesk({ auction, bids, bidAmount, setBidAmount, submitBid, claimWin, claiming, formatPrice }: { auction: Auction; bids: { amount: number; created_at: string; bidder_alias: string }[]; bidAmount: string; setBidAmount: (value: string) => void; submitBid: () => void; claimWin: () => void; claiming: boolean; formatPrice: (value: number) => string }) {
  const now = useNow();
  const car = Array.isArray(auction.cars) ? auction.cars[0] : auction.cars;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const image = car?.car_images?.find((item: any) => item.is_primary)?.image_url || car?.car_images?.[0]?.image_url;
  const min = Number(auction.current_bid || auction.reserve_price || 0) + Number(auction.minimum_increment || 0);
  const phase = auctionPhase(auction, now);
  const live = phase === "live";
  const hasEnded = phase === "ended";
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card">
      <div className="relative aspect-[16/10] bg-muted">
        {image ? <img src={image} alt={car?.title || "Vehicle offer"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-ac-cream text-ac-ink"><Gavel className="h-10 w-10" /></div>}
        <div className="absolute left-4 top-4"><PhaseBadge auction={auction} phase={phase} /></div>
      </div>
      <div className="p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-brand text-2xl text-foreground sm:text-3xl">{car?.title || "Vehicle offer"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{car?.location_display || "Location to be confirmed"}{car?.mileage ? ` · ${Number(car.mileage).toLocaleString()} ${car.mileage_unit || "km"}` : ""}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Ends {new Date(auction.ends_at).toLocaleString()}</p>
            {car?.id && <Link to="/cars/$id" params={{ id: car.id }} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline-offset-4 hover:underline">See vehicle evidence →</Link>}
          </div>
          <div className="shrink-0"><Countdown auction={auction} /></div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric label={auction.sale_mode === "flash_sale" ? "Offer price" : "Current bid"} value={formatPrice(Number(auction.current_bid || auction.reserve_price || 0))} strong />
          <Metric label="Minimum next bid" value={formatPrice(min)} />
        </div>
      </div>
      <div className="grid gap-6 border-t border-border p-5 sm:p-8 md:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)]">
        <div>
          {hasEnded ? (
            <>
              <h3 className="font-brand text-xl">Winning bidder?</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Claim your 24-hour reservation. The next stage is payment pending; it will not show as paid without verified evidence.</p>
              <Button onClick={claimWin} disabled={claiming} className="mt-5 h-12 rounded-full bg-ac-accent px-6 font-extrabold text-ac-ink hover:bg-ac-accent/90">{claiming ? "Creating reservation…" : "Claim reservation"}</Button>
            </>
          ) : (
            <>
              <h3 className="font-brand text-xl">Place your bid</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Your name stays private. Other people see a consistent masked alias and the amount only.</p>
              <div className="mt-5 flex flex-col gap-2 min-[420px]:flex-row">
                <Input aria-label="Bid amount" type="number" inputMode="decimal" min={min} value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} className="h-12 min-w-0 flex-1 rounded-full px-5 font-mono text-base" />
                <Button onClick={submitBid} disabled={!live || Number(bidAmount) < min} className="h-12 rounded-full bg-ac-accent px-6 font-extrabold text-ac-ink hover:bg-ac-accent/90">Place bid</Button>
              </div>
              {!live && <p className="mt-2 text-xs font-semibold text-muted-foreground">Bidding opens when the auction goes live.</p>}
              <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground" />Bids are recorded against your account. A winner proceeds to reservation and payment verification; no payment is marked complete on this page.</p>
            </>
          )}
        </div>
        <div className="rounded-3xl bg-muted/50 p-4 sm:p-5">
          <h3 className="flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-foreground" />Recent bid activity</h3>
          <div className="mt-3 space-y-2">
            {bids.length ? bids.slice(0, 5).map((bid, index) => (
              <div key={`${bid.created_at}-${index}`} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-foreground">{bid.bidder_alias}</span>
                <span className="font-mono font-bold text-foreground">{formatPrice(Number(bid.amount))}</span>
              </div>
            )) : <p className="text-xs text-muted-foreground">No bids yet. The first valid bid must meet the minimum.</p>}
          </div>
          <p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-foreground" />Evidence is reviewed separately on the vehicle page.</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("rounded-2xl border p-3 sm:p-4", strong ? "border-transparent bg-ac-cream text-ac-ink" : "border-border bg-background")}>
      <p className={cn("text-[11px]", strong ? "text-ac-ink/70" : "text-muted-foreground")}>{label}</p>
      <p className="mt-1 font-mono text-base font-bold sm:text-lg">{value}</p>
    </div>
  );
}
