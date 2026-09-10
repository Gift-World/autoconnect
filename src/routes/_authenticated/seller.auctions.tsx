import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Gavel, Plus, ShieldCheck, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { recordConsent } from "@/lib/consent";

export const Route = createFileRoute("/_authenticated/seller/auctions")({ component: SellerAuctions });

function SellerAuctions() {
  const [seller, setSeller] = useState<any>(null);
  const [cars, setCars] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [carId, setCarId] = useState("");
  const [mode, setMode] = useState("timed_auction");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reserve, setReserve] = useState("");
  const [increment, setIncrement] = useState("1000");
  const [saving, setSaving] = useState(false);
  const [acceptedRules, setAcceptedRules] = useState(false);

  const load = async () => {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;
    const { data: sellerRow } = await supabase.from("sellers").select("id,is_approved").eq("profile_id", session.user.id).maybeSingle();
    setSeller(sellerRow);
    if (!sellerRow) return;
    const [{ data: liveCars }, { data: auctionRows }] = await Promise.all([
      supabase.from("cars").select("id,title,year,price,currency").eq("seller_id", sellerRow.id).eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("vehicle_auctions").select("id,car_id,sale_mode,starts_at,ends_at,reserve_price,current_bid,bid_count,status,cars(title)").eq("seller_id", sellerRow.id).order("created_at", { ascending: false }),
    ]);
    setCars(liveCars ?? []); setAuctions(auctionRows ?? []);
  };
  useEffect(() => { void load(); }, []);

  const createAuction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!seller?.is_approved) { toast.error("Seller approval is required before publishing an auction."); return; }
    if (!acceptedRules) { toast.error("Agree to the Auction Rules before scheduling an offer."); return; }
    if (!carId || !startsAt || !endsAt || !reserve) { toast.error("Complete the vehicle, time and price fields."); return; }
    if (new Date(endsAt) <= new Date(startsAt)) { toast.error("The end time must be after the start time."); return; }
    setSaving(true);
    const { error } = await supabase.from("vehicle_auctions").insert({ car_id: carId, seller_id: seller.id, sale_mode: mode, starts_at: new Date(startsAt).toISOString(), ends_at: new Date(endsAt).toISOString(), reserve_price: Number(reserve), minimum_increment: Number(increment || 1) });
    setSaving(false);
    if (error) { toast.error("Auction was not created", { description: error.message }); return; }
    toast.success("Auction scheduled", { description: "It will appear publicly at the start time." });
    await Promise.all([recordConsent("terms"), recordConsent("seller_rules"), recordConsent("auction_rules")]);
    setCarId(""); setReserve(""); void load();
  };

  return <div className="space-y-7">
    <header className="rounded-3xl border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-white p-6 sm:p-8 dark:border-teal-500/20 dark:from-teal-950/30 dark:via-background dark:to-background"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-700 dark:text-teal-300">Seller auction desk</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Create a fast, fair sale.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Only your approved listings can be scheduled. Buyers see the deadline, bid price and vehicle evidence—not each other’s identity.</p></div><Button asChild variant="outline" className="rounded-xl"><Link to="/auctions"><Gavel className="mr-2 h-4 w-4"/>See public auctions</Link></Button></div></header>
    {!seller ? <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">Loading your seller workspace…</div> : !seller.is_approved ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">Your seller account must be approved before you can create an auction. You can prepare listings in the meantime.</div> : <form onSubmit={createAuction} className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"><Plus className="h-5 w-5"/></span><div><h2 className="font-bold">Schedule an offer</h2><p className="text-sm text-muted-foreground">No payment is collected when you schedule this.</p></div></div><div className="mt-6 grid gap-5 md:grid-cols-2"><div className="space-y-2"><Label>Approved vehicle</Label><Select value={carId} onValueChange={setCarId}><SelectTrigger><SelectValue placeholder={cars.length ? "Choose a listing" : "No approved listings yet"}/></SelectTrigger><SelectContent>{cars.map((car) => <SelectItem key={car.id} value={car.id}>{car.year} {car.title} · {car.currency} {Number(car.price).toLocaleString()}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Offer type</Label><Select value={mode} onValueChange={setMode}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="timed_auction">Timed auction — buyers bid</SelectItem><SelectItem value="flash_sale">Flash offer — limited-time price</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Start time</Label><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)}/></div><div className="space-y-2"><Label>End time</Label><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)}/></div><div className="space-y-2"><Label>{mode === "flash_sale" ? "Offer price" : "Reserve / opening price"}</Label><Input type="number" min="0" value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="e.g. 2500000"/></div><div className="space-y-2"><Label>Minimum bid increment</Label><Input type="number" min="1" value={increment} onChange={(e) => setIncrement(e.target.value)}/></div></div><div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-sm text-teal-950 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-100"><p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4"/>What happens after it ends</p><p className="mt-1 leading-6">The winning bidder is offered a 24-hour reservation. It remains payment pending until verified payment evidence is recorded—never automatically marked paid.</p></div><div className="mt-5 flex items-start gap-2"><Checkbox id="auction-rules" checked={acceptedRules} onCheckedChange={(checked) => setAcceptedRules(checked === true)} className="mt-0.5"/><Label htmlFor="auction-rules" className="text-xs font-normal leading-5 text-muted-foreground">I agree to the <Link to="/terms" className="font-semibold text-primary hover:underline">Terms</Link>, Seller Rules and Auction Rules. I understand this offer needs admin approval before it is public.</Label></div><Button type="submit" disabled={saving || !cars.length || !acceptedRules} className="mt-6 rounded-xl">{saving ? "Scheduling…" : "Schedule offer"}<TimerReset className="ml-2 h-4 w-4"/></Button></form>}
    <section><h2 className="text-lg font-bold">Your scheduled offers</h2><div className="mt-4 overflow-hidden rounded-2xl border bg-card">{auctions.length ? auctions.map((auction) => <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0" key={auction.id}><div><p className="font-semibold">{(Array.isArray(auction.cars) ? auction.cars[0] : auction.cars)?.title || "Vehicle offer"}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{auction.sale_mode.replaceAll("_", " ")} · ends {new Date(auction.ends_at).toLocaleString()}</p></div><div className="text-right"><p className="font-mono text-sm font-bold">{Number(auction.current_bid || auction.reserve_price).toLocaleString()}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{auction.status} · {auction.bid_count} bids</p></div></div>) : <p className="p-6 text-sm text-muted-foreground">No auctions scheduled yet.</p>}</div></section>
  </div>;
}
