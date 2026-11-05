import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, Gavel, Plus, ShieldCheck, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { recordConsent } from "@/lib/consent";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyPanel, ListSkeleton, Notice, Panel, StatTile } from "@/components/seller/SellerUI";

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
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      setLoading(false);
      return;
    }
    const { data: sellerRow } = await supabase.from("sellers").select("id,is_approved").eq("profile_id", session.user.id).maybeSingle();
    setSeller(sellerRow || false);
    if (!sellerRow) {
      setLoading(false);
      return;
    }
    const [{ data: liveCars }, { data: auctionRows }] = await Promise.all([
      supabase.from("cars").select("id,title,year,price,currency").eq("seller_id", sellerRow.id).eq("status", "approved").order("created_at", { ascending: false }),
      supabase.from("vehicle_auctions").select("id,car_id,sale_mode,starts_at,ends_at,reserve_price,current_bid,bid_count,status,cars(title)").eq("seller_id", sellerRow.id).order("created_at", { ascending: false }),
    ]);
    setCars(liveCars ?? []);
    setAuctions(auctionRows ?? []);
    setLoading(false);
  };
  useEffect(() => {
    void load();
  }, []);

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
    setCarId("");
    setReserve("");
    void load();
  };

  const totalBids = auctions.reduce((s, a) => s + Number(a.bid_count || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Seller auction desk"
        title="Create a fast, fair sale."
        description="Only your approved listings can be scheduled. Buyers see the deadline, bid price and vehicle evidence—not each other’s identity."
        actions={
          <Button asChild variant="outline" className="h-11 rounded-full">
            <Link to="/auctions" search={{ auction: undefined }}>
              <Gavel className="h-4 w-4" />
              See public auctions
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile featured icon={<Gavel />} label="Scheduled offers" value={auctions.length} loading={loading} />
        <StatTile icon={<TimerReset />} tone="accent" label="Total bids" value={totalBids} loading={loading} />
        <div className="col-span-2 lg:col-span-1">
          <StatTile icon={<ShieldCheck />} tone="success" label="Eligible cars" value={cars.length} sub="Approved listings" loading={loading} />
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : !seller ? (
        <EmptyPanel
          icon={<Gavel />}
          title="Your seller profile is being prepared"
          description="Please refresh in a moment."
          action={
            <Button asChild className="h-11 rounded-full">
              <Link to="/seller/verify">Go to verification</Link>
            </Button>
          }
        />
      ) : !seller.is_approved ? (
        <Notice
          tone="warning"
          icon={<Clock3 />}
          title="Approval needed"
          action={
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link to="/seller/verify">Check verification</Link>
            </Button>
          }
        >
          Your seller account must be approved before you can create an auction. You can prepare listings in the meantime.
        </Notice>
      ) : (
        <form onSubmit={createAuction} className="rounded-3xl border border-border bg-card p-4 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-ac-accent text-ac-ink">
              <Plus className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-brand text-xl sm:text-2xl">Schedule an offer</h2>
              <p className="text-sm text-muted-foreground">No payment is collected when you schedule this.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Approved vehicle</Label>
              <Select value={carId} onValueChange={setCarId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder={cars.length ? "Choose a listing" : "No approved listings yet"} />
                </SelectTrigger>
                <SelectContent>
                  {cars.map((car) => (
                    <SelectItem key={car.id} value={car.id}>
                      {car.year} {car.title} · {car.currency} {Number(car.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Offer type</Label>
              <Select value={mode} onValueChange={setMode}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="timed_auction">Timed auction — buyers bid</SelectItem>
                  <SelectItem value="flash_sale">Flash offer — limited-time price</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input className="h-12 rounded-xl" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input className="h-12 rounded-xl" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{mode === "flash_sale" ? "Offer price" : "Reserve / opening price"}</Label>
              <Input className="h-12 rounded-xl" type="number" min="0" value={reserve} onChange={(e) => setReserve(e.target.value)} placeholder="e.g. 2500000" />
            </div>
            <div className="space-y-2">
              <Label>Minimum bid increment</Label>
              <Input className="h-12 rounded-xl" type="number" min="1" value={increment} onChange={(e) => setIncrement(e.target.value)} />
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-ac-powder p-4 text-sm text-ac-ink">
            <p className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="h-4 w-4" />
              What happens after it ends
            </p>
            <p className="mt-1 leading-6">
              The winning bidder is offered a 24-hour reservation. It remains payment pending until verified payment evidence is recorded—never automatically marked paid.
            </p>
          </div>
          <div className="mt-5 flex items-start gap-3">
            <Checkbox id="auction-rules" checked={acceptedRules} onCheckedChange={(checked) => setAcceptedRules(checked === true)} className="mt-0.5 h-5 w-5" />
            <Label htmlFor="auction-rules" className="text-xs font-normal leading-5 text-muted-foreground">
              I agree to the{" "}
              <Link to="/terms" className="font-semibold text-primary hover:underline">
                Terms
              </Link>
              , Seller Rules and Auction Rules. I understand this offer needs admin approval before it is public.
            </Label>
          </div>
          <div className="mt-6 flex justify-end border-t border-border pt-5">
            <Button type="submit" disabled={saving || !cars.length || !acceptedRules} className="h-12 rounded-full bg-ac-accent px-6 text-ac-ink hover:bg-ac-accent/90">
              {saving ? "Scheduling…" : "Schedule offer"}
              <TimerReset className="h-4 w-4" />
            </Button>
          </div>
        </form>
      )}

      <Panel kicker="Your desk" title="Your scheduled offers">
        {loading ? (
          <ListSkeleton rows={2} />
        ) : auctions.length ? (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {auctions.map((auction) => (
              <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={auction.id}>
                <div className="min-w-0">
                  <p className="font-semibold">{(Array.isArray(auction.cars) ? auction.cars[0] : auction.cars)?.title || "Vehicle offer"}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {auction.sale_mode.replaceAll("_", " ")} · ends {new Date(auction.ends_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-brand text-lg">{Number(auction.current_bid || auction.reserve_price).toLocaleString()}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {auction.status} · {auction.bid_count} bids
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPanel
            icon={<Gavel />}
            title="No auctions scheduled yet."
            description="Pick an approved listing above and set a start and end time."
          />
        )}
      </Panel>
    </div>
  );
}
