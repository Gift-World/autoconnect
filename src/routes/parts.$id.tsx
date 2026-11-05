import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Car,
  MapPin,
  CheckCircle2,
  Globe2,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { trackProductEvent } from "@/lib/product-analytics";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/parts/$id")({ component: PartDetailPage });

type Part = {
  id: string;
  shop_id: string;
  title: string;
  brand: string | null;
  part_number: string | null;
  category: string;
  condition: string;
  description: string | null;
  price: number;
  currency: string;
  country: string;
  city: string | null;
  stock_quantity: number;
  shipping_regions: string[];
  warranty_text: string | null;
  return_policy: string | null;
  image_url?: string | null;
  is_sample: boolean;
  parts_shops: {
    name: string;
    country: string;
    city: string | null;
    is_verified: boolean;
    is_sample: boolean;
  } | null;
};
type Fitment = {
  id: string;
  make_name: string;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  engine: string | null;
  notes: string | null;
};

function PartDetailPage() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const vehicles = useQuery({
    queryKey: ["quote-garage-vehicles", session?.user.id],
    enabled: !!session?.user.id && open,
    queryFn: async () => {
      const { data, error } = await supabase.from("garage_vehicles").select("id,make_name,model_name,year,nickname").eq("owner_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const partQuery = useQuery({
    queryKey: ["part", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select(
          "id,shop_id,title,brand,part_number,category,condition,description,price,currency,country,city,stock_quantity,shipping_regions,warranty_text,return_policy,image_url,is_sample,parts_shops(name,country,city,is_verified,is_sample)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Part | null;
    },
  });
  const fitments = useQuery({
    queryKey: ["part-fitments", id],
    enabled: !!partQuery.data,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("part_fitments")
        .select("id,make_name,model_name,year_from,year_to,engine,notes")
        .eq("part_id", id);
      if (error) throw error;
      return (data ?? []) as Fitment[];
    },
  });
  const quote = useMutation({
    mutationFn: async () => {
      const part = partQuery.data;
      if (!part || !session?.user) throw new Error("Please sign in before requesting a quote.");
      if (message.trim().length < 5)
        throw new Error("Add a short message so the supplier can help.");
      const { error } = await supabase.from("part_inquiries").insert({
        part_id: part.id,
        shop_id: part.shop_id,
        buyer_id: session.user.id,
        garage_vehicle_id: vehicleId || null,
        quantity: Number(quantity) || 1,
        destination_country: country.trim() || null,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Quote request sent");
      void trackProductEvent("parts_quote_requested", { part_id: id, garage_vehicle_id: vehicleId || null });
      setOpen(false);
      setMessage("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (partQuery.isLoading)
    return (
      <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Skeleton className="aspect-[4/3] w-full rounded-[28px]" />
          <Skeleton className="h-10 w-2/3 rounded-full" />
          <Skeleton className="h-5 w-1/3 rounded-full" />
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  if (!partQuery.data)
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <StoryEmpty
          icon={<PackageSearch />}
          kicker="Not on the shelf"
          title="This part is unavailable"
          description="It may no longer be published by the supplier."
          actionLabel="Back to parts"
          actionTo="/parts"
          secondary={<QuietLink to="/parts/shops">Browse suppliers</QuietLink>}
        />
      </div>
    );
  const part = partQuery.data;
  const requestQuote = () =>
    session ? setOpen(true) : toast.info("Sign in to request a supplier quote.");
  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-24 pt-4 text-foreground sm:px-6 sm:pt-6 lg:pb-16">
      <Link
        to="/parts"
        className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All parts
      </Link>
      <div className="mt-3 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          {/* Photo first */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-ac-cream sm:aspect-[16/10] sm:rounded-[36px]">
            {part.image_url ? (
              <img
                src={part.image_url}
                alt={`Illustrative ${part.title}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-ac-ink">
                <div className="text-center">
                  <ShoppingBag className="mx-auto h-12 w-12 text-ac-accent" />
                  <span className="mt-3 block text-[11px] font-bold uppercase tracking-[.16em] text-ac-ink/50">
                    Illustrative catalogue visual
                  </span>
                </div>
              </div>
            )}
            <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold capitalize text-ac-ink">
              {part.condition}
            </span>
          </div>

          <p className="brand-kicker mt-8 text-muted-foreground">{part.category}</p>
          <h1 className="font-brand mt-2 text-3xl sm:text-5xl">{part.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {part.brand}
            {part.part_number ? ` · Part no. ${part.part_number}` : ""}
          </p>
          {part.is_sample && (
            <p className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              Sample catalogue record for testing. Confirm availability and fitment with the
              supplier before purchasing.
            </p>
          )}

          <dl className="mt-7 grid grid-cols-2 gap-4 border-y border-border py-6 text-sm">
            <Fact icon={<PackageSearch />} label="Stated stock" value={`${part.stock_quantity} available`} />
            <Fact
              icon={<MapPin />}
              label="Ships from"
              value={`${part.city ? `${part.city}, ` : ""}${part.country}`}
            />
            <Fact icon={<ShieldCheck />} label="Warranty" value={part.warranty_text ?? "Ask supplier"} />
            <Fact
              icon={<Globe2 />}
              label="Shipping regions"
              value={part.shipping_regions?.join(", ") || "Ask supplier"}
            />
          </dl>

          <Tabs defaultValue="fit" className="mt-8">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-full p-1 sm:w-auto">
              <TabsTrigger value="fit" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
                Compatibility{fitments.data?.length ? ` (${fitments.data.length})` : ""}
              </TabsTrigger>
              <TabsTrigger value="details" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
                Details &amp; returns
              </TabsTrigger>
            </TabsList>
            <TabsContent value="fit" className="mt-5">
              <h2 className="font-brand text-xl">Compatibility supplied</h2>
              {fitments.isLoading ? (
                <Skeleton className="mt-3 h-16 rounded-2xl" />
              ) : fitments.data?.length ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {fitments.data.map((fitment) => (
                    <li
                      key={fitment.id}
                      className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
                    >
                      <Car className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
                      <span>
                        <b>
                          {fitment.make_name} {fitment.model_name ?? ""}
                        </b>
                        {fitment.year_from && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {fitment.year_from}
                            {fitment.year_to ? `–${fitment.year_to}` : "+"}
                          </span>
                        )}
                        {fitment.engine && (
                          <span className="text-muted-foreground"> · {fitment.engine}</span>
                        )}
                        {fitment.notes && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {fitment.notes}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No fitment has been recorded yet. Include your VIN or vehicle details in the quote
                  request.
                </p>
              )}
            </TabsContent>
            <TabsContent value="details" className="mt-5 space-y-4">
              {part.description ? (
                <p className="text-base leading-7 text-muted-foreground">{part.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The supplier has not added a description. Ask for details in your quote request.
                </p>
              )}
              <div className="rounded-2xl bg-ac-stone p-5 text-sm text-ac-ink">
                <p className="font-bold">Returns</p>
                <p className="mt-1 leading-6 text-ac-ink/75">
                  {part.return_policy || "Confirm return terms with the supplier in your quote."}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>

        <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
          <p className="font-brand text-3xl">{money(part.price, part.currency)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Per stated unit · taxes and delivery confirmed in quote
          </p>
          <div className="mt-6 flex gap-3 border-t border-border pt-5 text-sm">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-ac-accent">
              <Store className="h-5 w-5" />
            </span>
            <div>
              <b>{part.parts_shops?.name ?? "Approved supplier"}</b>
              <p className="mt-1 text-xs text-muted-foreground">
                {part.parts_shops?.city ? `${part.parts_shops.city}, ` : ""}
                {part.parts_shops?.country}
              </p>
              {part.parts_shops?.is_verified && (
                <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified supplier
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={requestQuote}
            className="mt-6 hidden min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110 lg:flex"
          >
            Request a quote
          </button>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> A quote request
            is not a payment. Confirm exact fitment, delivery and return terms before purchase.
          </p>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold">{money(part.price, part.currency)}</p>
            <p className="truncate text-[11px] text-muted-foreground">Delivery confirmed in quote</p>
          </div>
          <button
            type="button"
            onClick={requestQuote}
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink"
          >
            Request a quote
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-brand text-2xl">Request a supplier quote</DialogTitle>
            <DialogDescription>
              Your request is recorded securely and sent to the supplier workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {vehicles.data?.length ? (
              <div>
                <Label htmlFor="quote-vehicle">Connect this to My Garage (optional)</Label>
                <select
                  id="quote-vehicle"
                  value={vehicleId}
                  onChange={(event) => setVehicleId(event.target.value)}
                  className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Not linked to a vehicle</option>
                  {vehicles.data.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {`${vehicle.year ?? ""} ${vehicle.make_name} ${vehicle.model_name ?? ""}`.trim()}
                      {vehicle.nickname ? ` · ${vehicle.nickname}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                className="mt-1 h-11"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="destination">Delivery country</Label>
              <Input
                id="destination"
                className="mt-1 h-11"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder="Kenya"
              />
            </div>
            <div>
              <Label htmlFor="part-message">Vehicle / fitment details *</Label>
              <Textarea
                id="part-message"
                className="mt-1"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="For a 2019 Toyota Prado, VIN available on request…"
              />
            </div>
            <Button
              disabled={quote.isPending}
              onClick={() => quote.mutate()}
              className="min-h-12 rounded-full bg-ac-accent font-extrabold text-ac-ink hover:bg-ac-accent/90"
            >
              {quote.isPending ? "Sending…" : "Send quote request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 text-ac-accent [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-1 break-words font-medium">{value}</dd>
      </div>
    </div>
  );
}
function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}
