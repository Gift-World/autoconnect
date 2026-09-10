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

export const Route = createFileRoute("/auctions")({
  validateSearch: (search: Record<string, unknown>) => ({ auction: typeof search.auction === "string" ? search.auction : undefined }),
  head: () => ({ meta: [{ title: "Live car auctions & flash offers | AutoConnect" }, { name: "description", content: "Transparent timed vehicle auctions and flash offers with visible price, time and listing evidence." }] }),
  component: AuctionsPage,
});

type Auction = any;

function AuctionsPage() {
  const { auction: selectedId } = Route.useSearch();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [bidAmount, setBidAmount] = useState("");

  const { data: auctions, isLoading, isError } = useQuery({
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
    void queryClient.invalidateQueries({ queryKey: ["vehicle-auctions"] });
    void queryClient.invalidateQueries({ queryKey: ["auction-public-bids", selected.id] });
  };

  return <main className="min-h-screen bg-gradient-to-b from-teal-50/60 via-background to-background pb-16 dark:from-teal-950/20">
    <section className="border-b border-border bg-white/85 py-10 backdrop-blur dark:bg-background/85 sm:py-14"><div className="mx-auto max-w-[1280px] px-4 sm:px-6"><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300"><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500"/>Market live</span><h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">The fast lane, without the blind spots.</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">A timed listing always shows its deadline, current price and listing evidence. Bids are binding only after the winner reviews the next reservation and payment steps.</p></div></div></section>
    <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[.9fr_1.35fr]">
      <aside className="space-y-3"><p className="px-1 text-xs font-bold uppercase tracking-[.13em] text-muted-foreground">Live & upcoming</p>{isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />) : isError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Auction inventory could not load. Please refresh; this is not an empty result.</div> : auctions?.length ? auctions.map((auction) => <AuctionRow key={auction.id} auction={auction} selected={selected?.id === auction.id} formatPrice={formatPrice} />) : <div className="rounded-2xl border border-dashed border-border bg-card p-6"><p className="font-semibold">No auction is scheduled yet.</p><p className="mt-1 text-sm text-muted-foreground">Browse verified inventory or check back for seller-run timed offers.</p><Button asChild variant="outline" className="mt-4 rounded-xl"><Link to="/cars">Browse cars</Link></Button></div>}</aside>
      <section>{selected ? <AuctionDesk auction={selected} bids={bids || []} bidAmount={bidAmount} setBidAmount={setBidAmount} submitBid={submitBid} formatPrice={formatPrice} /> : <div className="rounded-3xl border bg-card p-8"><Gavel className="h-8 w-8 text-teal-600"/><h2 className="mt-4 text-xl font-bold">Select an offer to review it.</h2></div>}</section>
    </div>
  </main>;
}

function AuctionRow({ auction, selected, formatPrice }: { auction: Auction; selected: boolean; formatPrice: (value: number) => string }) {
  const car = Array.isArray(auction.cars) ? auction.cars[0] : auction.cars;
  const isFlash = auction.sale_mode === "flash_sale";
  return <Link to="/auctions" search={{ auction: auction.id }} className={`block rounded-2xl border p-4 transition ${selected ? "border-teal-500 bg-teal-50 shadow-sm dark:bg-teal-500/10" : "border-border bg-card hover:border-teal-400/60"}`}><div className="flex gap-3"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{car?.car_images?.[0]?.image_url && <img src={car.car_images[0].image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">{isFlash ? "Flash offer" : "Timed auction"}</span><span className="text-[10px] text-muted-foreground">{auction.bid_count} bids</span></div><p className="mt-1 truncate text-sm font-bold text-foreground">{car?.title || "Vehicle offer"}</p><p className="mt-1 font-mono text-sm font-bold text-foreground">{formatPrice(Number(auction.current_bid || auction.reserve_price || 0))}</p></div></div></Link>;
}

function AuctionDesk({ auction, bids, bidAmount, setBidAmount, submitBid, formatPrice }: { auction: Auction; bids: { amount: number; created_at: string; bidder_alias: string }[]; bidAmount: string; setBidAmount: (value: string) => void; submitBid: () => void; formatPrice: (value: number) => string }) {
  const car = Array.isArray(auction.cars) ? auction.cars[0] : auction.cars;
  const image = car?.car_images?.find((item: any) => item.is_primary)?.image_url || car?.car_images?.[0]?.image_url;
  const min = Number(auction.current_bid || auction.reserve_price || 0) + Number(auction.minimum_increment || 0);
  const live = new Date(auction.starts_at) <= new Date() && new Date(auction.ends_at) > new Date();
  return <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="grid lg:grid-cols-[1.1fr_.9fr]"><div className="min-h-[260px] bg-muted">{image ? <img src={image} alt={car?.title || "Vehicle offer"} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-[260px] items-center justify-center bg-gradient-to-br from-teal-100 to-slate-100 text-teal-700 dark:from-teal-950 dark:to-slate-900 dark:text-teal-300"><Gavel className="h-10 w-10" /></div>}</div><div className="p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-[11px] font-bold text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">{auction.sale_mode === "flash_sale" ? <Zap className="h-3.5 w-3.5"/> : <Gavel className="h-3.5 w-3.5"/>}{auction.sale_mode === "flash_sale" ? "Flash offer" : live ? "Live auction" : "Upcoming auction"}</span><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5"/>Ends {new Date(auction.ends_at).toLocaleString()}</span></div><h2 className="mt-4 text-2xl font-extrabold tracking-tight text-foreground">{car?.title || "Vehicle offer"}</h2><p className="mt-2 text-sm text-muted-foreground">{car?.location_display || "Location to be confirmed"}{car?.mileage ? ` · ${Number(car.mileage).toLocaleString()} ${car.mileage_unit || "km"}` : ""}</p><div className="mt-7 grid grid-cols-2 gap-3"><Metric label={auction.sale_mode === "flash_sale" ? "Offer price" : "Current bid"} value={formatPrice(Number(auction.current_bid || auction.reserve_price || 0))} /><Metric label="Minimum next bid" value={formatPrice(min)} /></div></div></div><div className="grid gap-6 border-t border-border p-6 sm:grid-cols-[1fr_.9fr] sm:p-8"><div><h3 className="font-bold">Place your bid</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Your name stays private. Other people see a consistent masked alias and the amount only.</p><div className="mt-5 flex gap-2"><Input aria-label="Bid amount" type="number" min={min} value={bidAmount} onChange={(event) => setBidAmount(event.target.value)} className="h-11 rounded-xl font-mono"/><Button onClick={submitBid} disabled={!live || Number(bidAmount) < min} className="h-11 rounded-xl px-5 font-bold">Place bid</Button></div><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600"/>Bids are recorded against your account. A winner proceeds to reservation and payment verification; no payment is marked complete on this page.</p></div><div className="rounded-2xl bg-muted/45 p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><UserRound className="h-4 w-4 text-teal-600"/>Recent bid activity</h3><div className="mt-3 space-y-2">{bids.length ? bids.slice(0, 5).map((bid, index) => <div key={`${bid.created_at}-${index}`} className="flex items-center justify-between text-xs"><span className="font-medium text-foreground">{bid.bidder_alias}</span><span className="font-mono font-bold text-foreground">{formatPrice(Number(bid.amount))}</span></div>) : <p className="text-xs text-muted-foreground">No bids yet. The first valid bid must meet the minimum.</p>}</div><p className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-[11px] text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5 text-teal-600"/>Evidence is reviewed separately on the vehicle page.</p></div></div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-background p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-mono text-base font-bold text-foreground">{value}</p></div>; }
