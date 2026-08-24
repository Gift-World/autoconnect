import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin,
  Gauge,
  Fuel,
  Settings2,
  Calendar,
  Plane,
  ShieldCheck,
  Car as CarIcon,
  ChevronLeft,
  ChevronRight,
  Send,
  Ship,
  Palette,
  CircleDot,
  Share2,
  Eye,
  Clock,
  Calculator,
  Lock,
  BadgeCheck,
  Phone,
  Store,
  CalendarCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VerifiedDocsBadge } from "@/components/DocumentManager";
import { VehiclePassport } from "@/components/VehiclePassport";
import { BuyerNextSteps } from "@/components/buyer/BuyerNextSteps";
import { VehicleDecisionChecklist } from "@/components/buyer/VehicleDecisionChecklist";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, countryByCode } from "@/lib/countries";
import { DEMO_CARS } from "@/lib/demo-inventory";
import { useAuth } from "@/contexts/AuthContext";
import { CheckoutModal } from "@/components/payments/CheckoutModal";
import { calculateBreakdown, fromUsdCents, SERVICE_FEE_PERCENT } from "@/lib/stripe-config";
import { VehiclePlaceholder } from "@/components/VehicleImage";

type CarDetail = {
  id: string;
  seller_id: string;
  title: string;
  make_name: string | null;
  model_name: string | null;
  year: number;
  price: number;
  currency: string;
  country: string;
  city: string | null;
  location_display: string | null;
  mileage: number | null;
  mileage_unit: string;
  transmission: string | null;
  fuel_type: string | null;
  body_type: string | null;
  color: string | null;
  engine_size: string | null;
  condition: string | null;
  description: string | null;
  right_hand_drive: boolean;
  steering_side: string | null;
  available_for_export: boolean;
  shipping_info: string | null;
  import_duties_note: string | null;
  vin: string | null;
  featured: boolean;
  views: number;
  created_at: string;
  documents_verified: boolean;
  ntsa_verified: boolean;
  inspection_verified: boolean;
  pay_full: boolean;
  pay_deposit: boolean;
  pay_installments: boolean;
  deposit_percent: number | null;
  installment_months: number | null;
  installment_interest_rate: number | null;
  installment_monthly: number | null;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
  yard_id: string | null;
  car_yards: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
    city: string | null;
    country: string;
    is_approved: boolean;
  } | null;
  sellers: {
    id: string;
    business_name: string | null;
    country: string;
    city: string | null;
    location_display: string | null;
    is_verified: boolean;
    verification_badge: boolean;
    is_dealer: boolean;
    offers_local_pickup: boolean;
    offers_domestic_shipping: boolean;
    offers_international_shipping: boolean;
  } | null;
};

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

async function fetchCar(id: string): Promise<CarDetail> {
  const { data, error } = await supabase
    .from("cars")
    .select(
      "id,seller_id,title,make_name,model_name,year,price,currency,country,city,location_display,mileage,mileage_unit,transmission,fuel_type,body_type,color,engine_size,condition,description,right_hand_drive,steering_side,available_for_export,shipping_info,import_duties_note,vin,featured,views,created_at,documents_verified,ntsa_verified,inspection_verified,pay_full,pay_deposit,pay_installments,deposit_percent,installment_months,installment_interest_rate,installment_monthly,yard_id,car_images(image_url,is_primary,sort_order),car_yards(id,slug,name,logo_url,city,country,is_approved),sellers(id,business_name,country,city,location_display,is_verified,verification_badge,is_dealer,offers_local_pickup,offers_domestic_shipping,offers_international_shipping)",
    )
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (data) {
    return data as unknown as CarDetail;
  }

  const demo = DEMO_CARS.find((c) => c.id === id);
  if (demo) {
    return demo as unknown as CarDetail;
  }

  if (error) console.error("Error fetching car:", error);
  throw notFound();
}

export const Route = createFileRoute("/cars/$id")({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["car", params.id],
      queryFn: () => fetchCar(params.id),
    }),
  head: ({ loaderData }) => {
    const car = loaderData as CarDetail | undefined;
    const title = car ? `${car.title} — AutoConnect` : "Car listing — AutoConnect";
    const desc = car
      ? `${car.year} ${car.title} for ${formatPrice(Number(car.price), car.currency)} in ${car.location_display ?? car.country}.`
      : "View this car listing on AutoConnect.";
    const img = car?.car_images?.[0]?.image_url;
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
    ];
    if (img) {
      meta.push({ property: "og:image", content: img });
      meta.push({ name: "twitter:image", content: img });
    }
    return { meta };
  },
  component: CarDetailPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md p-12 text-center">
      <p className="text-base font-semibold">Couldn't load this listing</p>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md p-12 text-center">
      <CarIcon className="mx-auto h-10 w-10 text-muted-foreground" />
      <p className="mt-4 text-base font-semibold">Listing not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This car may have been removed or is awaiting approval.
      </p>
      <Button asChild className="mt-4">
        <Link to="/cars">Browse other cars</Link>
      </Button>
    </div>
  ),
});

function CarDetailPage() {
  const { id } = Route.useParams();
  const { data: car } = useQuery({
    queryKey: ["car", id],
    queryFn: () => fetchCar(id),
  });

  // Increment views once on mount
  useEffect(() => {
    supabase.rpc("increment_car_views", { car_id: id });
  }, [id]);

  if (!car) return null;

  const images = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
  if (images.length === 0) images.push({ image_url: "", is_primary: true, sort_order: 0 });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/cars"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to listings
        </Link>
        <ShareButton title={car.title} />
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* LEFT */}
        <div className="space-y-6">
          <Gallery images={images} title={car.title} />

          {/* Title + badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {car.featured && (
                <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                  Featured
                </Badge>
              )}
              <Badge variant="outline" className="border-primary/30 text-primary">
                {car.right_hand_drive ? "RHD · Right-hand drive" : "LHD · Left-hand drive"}
              </Badge>
              {car.available_for_export && (
                <Badge variant="outline" className="border-accent/40 text-accent-foreground">
                  <Plane className="mr-1 h-3 w-3" /> Available for export
                </Badge>
              )}
              {car.condition && (
                <Badge variant="secondary">{car.condition}</Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">{car.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {car.year} · {car.make_name} {car.model_name ?? ""}
            </p>
            <p className="mt-3 text-3xl font-bold text-primary">
              {formatPrice(Number(car.price), car.currency)}
            </p>
            <p className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {car.views.toLocaleString()} views
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Listed {timeAgo(car.created_at)}
              </span>
            </p>

            {/* Quick highlights */}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Highlight icon={Calendar} value={String(car.year)} label="Year" />
              <Highlight
                icon={Gauge}
                value={car.mileage != null ? `${(car.mileage / 1000).toFixed(0)}k` : "—"}
                label={car.mileage_unit}
              />
              <Highlight icon={Fuel} value={car.fuel_type ?? "—"} label="Fuel" />
              <Highlight icon={Settings2} value={car.transmission ?? "—"} label="Trans." />
            </div>
          </div>

          {/* Specs grid */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Specifications</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Spec icon={Calendar} label="Year" value={String(car.year)} />
              <Spec
                icon={Gauge}
                label="Mileage"
                value={car.mileage != null ? `${car.mileage.toLocaleString()} ${car.mileage_unit}` : "—"}
              />
              <Spec icon={Settings2} label="Transmission" value={car.transmission ?? "—"} />
              <Spec icon={Fuel} label="Fuel" value={car.fuel_type ?? "—"} />
              <Spec icon={CarIcon} label="Body type" value={car.body_type ?? "—"} />
              <Spec icon={Palette} label="Color" value={car.color ?? "—"} />
              <Spec icon={CircleDot} label="Engine" value={car.engine_size ?? "—"} />
              <Spec
                icon={MapPin}
                label="Location"
                value={`${countryByCode(car.country)?.flag ?? ""} ${car.location_display ?? car.country}`}
              />
              {car.vin && <Spec icon={ShieldCheck} label="VIN" value={car.vin} />}
            </dl>
          </div>

          {/* Description */}
          {car.description && (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                {car.description}
              </p>
            </div>
          )}

          {/* Export info box */}
          {car.available_for_export && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-center gap-2">
                <Plane className="h-5 w-5 text-accent" />
                <h2 className="text-base font-semibold">Export & shipping</h2>
              </div>
              <div className="mt-3 space-y-3 text-sm">
                {car.shipping_info && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Shipping
                    </p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                      {car.shipping_info}
                    </p>
                  </div>
                )}
                {car.import_duties_note && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Import duties
                    </p>
                    <p className="mt-1 whitespace-pre-line text-muted-foreground">
                      {car.import_duties_note}
                    </p>
                  </div>
                )}
                {!car.shipping_info && !car.import_duties_note && (
                  <p className="text-muted-foreground">
                    This seller ships internationally. Request a quote to get exact
                    cost and timeline to your country.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment estimator */}
          <PaymentEstimator price={Number(car.price)} currency={car.currency} />

          {/* Trust & Safety */}
          <div className="flex flex-wrap items-center gap-2">
            <VerifiedDocsBadge carId={car.id} />
          </div>
          <VehiclePassport carId={car.id} />
          <VehicleDecisionChecklist
            carId={car.id}
            documentsVerified={car.documents_verified}
            titleVerified={car.ntsa_verified}
            inspectionVerified={car.inspection_verified}
          />
          <BuyerNextSteps />
          <TrustPanel />

          {/* Similar cars */}
          <SimilarCars car={car} />
        </div>

        {/* RIGHT — sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <YardCard car={car} />
          <SellerCard car={car} />
          <BuyBox car={car} />
          <FavoriteButton carId={car.id} variant="full" />
          <InquiryForm car={car} />
        </aside>
      </div>

      {/* Sticky mobile contact bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">
              {car.year} · {car.make_name}
            </p>
            <p className="truncate text-base font-bold text-primary">
              {formatPrice(Number(car.price), car.currency)}
            </p>
          </div>
          <FavoriteButton carId={car.id} />
          <Button
            type="button"
            onClick={() =>
              document
                .getElementById("inquiry-form")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="shrink-0"
          >
            <Send className="mr-2 h-4 w-4" /> Contact
          </Button>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}

function Highlight({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-2 text-sm font-semibold capitalize leading-tight">{value}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d < 1) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} month${m > 1 ? "s" : ""} ago`;
  const y = Math.floor(d / 365);
  return `${y} year${y > 1 ? "s" : ""} ago`;
}

function ShareButton({ title }: { title: string }) {
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={onShare}>
      <Share2 className="mr-2 h-4 w-4" /> Share
    </Button>
  );
}

function PaymentEstimator({ price, currency }: { price: number; currency: string }) {
  const [down, setDown] = useState(Math.round(price * 0.2));
  const [months, setMonths] = useState(60);
  const [apr, setApr] = useState(7.5);

  const monthly = useMemo(() => {
    const principal = Math.max(0, price - down);
    const r = apr / 100 / 12;
    if (principal <= 0) return 0;
    if (r === 0) return principal / months;
    return (principal * r) / (1 - Math.pow(1 + r, -months));
  }, [price, down, months, apr]);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Estimate your monthly payment</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Indicative only. Final rates depend on your lender and country.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-xs">
          <span className="text-muted-foreground">Down payment</span>
          <Input
            type="number"
            min={0}
            max={price}
            value={down}
            onChange={(e) => setDown(Math.min(price, Math.max(0, Number(e.target.value) || 0)))}
            className="mt-1"
          />
        </label>
        <label className="block text-xs">
          <span className="text-muted-foreground">Term (months)</span>
          <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[24, 36, 48, 60, 72, 84].map((m) => (
                <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="block text-xs">
          <span className="text-muted-foreground">APR %</span>
          <Input
            type="number"
            step="0.1"
            min={0}
            max={40}
            value={apr}
            onChange={(e) => setApr(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
            className="mt-1"
          />
        </label>
      </div>
      <div className="mt-5 flex items-end justify-between rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Estimated monthly
          </p>
          <p className="mt-1 text-3xl font-bold text-primary">
            {formatPrice(Math.round(monthly), currency)}
          </p>
        </div>
        <p className="text-right text-xs text-muted-foreground">
          for {months} months<br />
          at {apr.toFixed(1)}% APR
        </p>
      </div>
    </div>
  );
}

function TrustPanel() {
  const items = [
    { icon: BadgeCheck, title: "Verified sellers", body: "Every dealer is vetted before listings go live." },
    { icon: Lock, title: "No upfront fees", body: "Talk to the seller directly. No broker markup." },
    { icon: Ship, title: "Global logistics", body: "Door-to-port and door-to-door shipping options." },
    { icon: Phone, title: "Real humans", body: "Our support team is one message away if anything feels off." },
  ];
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-semibold">Why buy on AutoConnect</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} className="flex gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
              <it.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{it.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{it.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SimilarCar = {
  id: string;
  title: string;
  year: number;
  price: number;
  currency: string;
  country: string;
  location_display: string | null;
  car_images: { image_url: string; is_primary: boolean }[];
};

function SimilarCars({ car }: { car: CarDetail }) {
  const { data } = useQuery({
    queryKey: ["similar-cars", car.id, car.make_name, car.country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,car_images(image_url,is_primary)",
        )
        .eq("status", "approved")
        .neq("id", car.id)
        .or(
          [
            car.make_name ? `make_name.eq.${car.make_name}` : null,
            `country.eq.${car.country}`,
          ]
            .filter(Boolean)
            .join(","),
        )
        .limit(4);
      if (error) throw error;
      return (data ?? []) as SimilarCar[];
    },
  });

  if (!data || data.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between">
        <h2 className="text-base font-semibold">You may also like</h2>
        <Link to="/cars" className="text-xs font-medium text-primary hover:underline">
          See all
        </Link>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.map((c) => {
          const img =
            c.car_images.find((i) => i.is_primary)?.image_url ??
            c.car_images[0]?.image_url;
          return (
            <Link
              key={c.id}
              to="/cars/$id"
              params={{ id: c.id }}
              className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-muted">
                {img ? (
                  <img
                    src={img}
                    alt={c.title}
                    className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.year} · {countryByCode(c.country)?.flag} {c.location_display ?? c.country}
                </p>
                <p className="mt-1 text-sm font-bold text-primary">
                  {formatPrice(Number(c.price), c.currency)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function Gallery({
  images,
  title,
}: {
  images: { image_url: string }[];
  title: string;
}) {
  const [idx, setIdx] = useState(0);
  const current = images[idx]?.image_url;
  const go = (dir: 1 | -1) =>
    setIdx((i) => (i + dir + images.length) % images.length);
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-border bg-slate-900">
        <div className="relative aspect-[16/10]">
          {current ? (
            <img
              src={current}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <VehiclePlaceholder title={title} className="h-full w-full" />
          )}
          {images.length > 1 && current && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-2.5 py-1 text-xs font-medium text-background">
                {idx + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`aspect-square overflow-hidden rounded-md border-2 transition ${
                idx === i ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.image_url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SellerCard({ car }: { car: CarDetail }) {
  return <SellerCardInner car={car} />;
}

function YardCard({ car }: { car: CarDetail }) {
  const yard = car.car_yards;
  if (!yard || !yard.is_approved) return null;
  const country = countryByCode(yard.country);
  return (
    <Link
      to="/yards/$slug"
      params={{ slug: yard.slug }}
      className="block rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/50"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Sold from a car yard
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
          {yard.logo_url ? (
            <img src={yard.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{yard.name}</h3>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {country?.flag} {yard.city ? `${yard.city}, ` : ""}
            {country?.name ?? yard.country}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-primary">
        Visit yard & see all their cars →
      </p>
    </Link>
  );
}

function SellerCardInner({ car }: { car: CarDetail }) {
  const seller = car.sellers;
  const country = countryByCode(seller?.country ?? car.country);
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Seller
      </p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">
            {seller?.business_name ?? "Private seller"}
          </h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {country?.flag} {seller?.location_display ?? country?.name ?? car.country}
          </p>
        </div>
        {seller?.verification_badge && (
          <Badge className="bg-success text-white hover:bg-success">
            <ShieldCheck className="mr-1 h-3 w-3" /> {seller?.is_dealer ? "Dealer Verified" : "Seller Verified"}
          </Badge>
        )}
      </div>
      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        {seller?.offers_local_pickup && <li>✓ Local pickup available</li>}
        {seller?.offers_domestic_shipping && <li>✓ Domestic shipping</li>}
        {seller?.offers_international_shipping && (
          <li className="font-medium text-foreground">✓ International shipping</li>
        )}
      </ul>
    </div>
  );
}

function BuyBox({ car }: { car: CarDetail }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const price = Number(car.price);
  // Fallback: if no options set, allow full
  const options: Array<{ id: "full" | "deposit" | "installments"; label: string; amount: number; sub: string }> = [];
  if (car.pay_full || (!car.pay_deposit && !car.pay_installments)) {
    options.push({ id: "full", label: "Full payment", amount: price, sub: "Pay the full price now" });
  }
  if (car.pay_deposit) {
    const pct = Number(car.deposit_percent ?? 20);
    const amt = Math.round((price * pct) / 100 * 100) / 100;
    options.push({ id: "deposit", label: `Reserve (${pct}%)`, amount: amt, sub: `Deposit now, ${formatPrice(price - amt, car.currency)} balance later` });
  }
  if (car.pay_installments) {
    const monthly = Number(car.installment_monthly ?? 0);
    const m = Number(car.installment_months ?? 12);
    options.push({ id: "installments", label: `${m}-month plan`, amount: monthly || price / m, sub: `First month now, ${m - 1} more monthly payments` });
  }
  const [plan, setPlan] = useState<"full" | "deposit" | "installments">(options[0]?.id ?? "full");
  const selected = options.find((o) => o.id === plan) ?? options[0];
  const breakdown = calculateBreakdown(selected?.amount ?? price, car.currency);
  return (
    <div className="rounded-xl border-2 border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-5 shadow-card">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <h3 className="text-base font-semibold">Buy Securely Through AutoConnect</h3>
      </div>
      {options.length > 1 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5 rounded-lg border bg-background p-1">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setPlan(o.id)}
              className={`rounded-md px-3 py-2 text-left text-xs transition-colors ${plan === o.id ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{o.label}</span>
                <span className="font-mono">{formatPrice(o.amount, car.currency)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground">{o.sub}</div>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{selected?.label ?? "Amount"}</span>
          <span className="font-medium">{formatPrice(breakdown.carPrice, car.currency)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service fee ({SERVICE_FEE_PERCENT}%)</span>
          <span className="font-medium">{formatPrice(breakdown.serviceFee, car.currency)}</span>
        </div>
        <div className="my-2 border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total now</span>
          <span className="text-lg font-bold text-primary">{formatPrice(breakdown.total, car.currency)}</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Charged in USD ≈ ${fromUsdCents(breakdown.totalUsdCents).toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
        <Button
        className="mt-4 w-full"
        size="lg"
        onClick={() => {
          if (!user) {
            router.navigate({ to: "/login" });
            return;
          }
          setOpen(true);
        }}
      >
        <Lock className="mr-2 h-4 w-4" /> Pay or reserve {formatPrice(breakdown.total, car.currency)}
      </Button>
      <ul className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-success" /> Payment protected</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-success" /> Funds released after verification</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-success" /> Documents reviewed by AutoConnect</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-success" /> Card, M-Pesa or bank transfer — manual payment reviewed by admin</li>
      </ul>
      <Link to="/how-payments-work" className="mt-3 block text-center text-[11px] font-medium text-primary hover:underline">
        How payments work →
      </Link>
      <CheckoutModal
        open={open}
        onOpenChange={setOpen}
        carId={car.id}
        carTitle={car.title}
        carPrice={selected?.amount ?? price}
        currency={car.currency}
        paymentPlan={selected?.id ?? "full"}
        planLabel={selected?.label ?? "Full payment"}
      />
    </div>
  );
}

const inquirySchema = z.object({
  buyer_name: z.string().min(2, "Required"),
  buyer_email: z.string().email("Valid email required"),
  buyer_phone: z.string().optional(),
  buyer_country: z.string().min(2, "Select your country"),
  inquiry_type: z.enum(["general", "shipping_quote", "import_request"]),
  message: z.string().min(10, "Tell the seller a bit more (10+ characters)"),
});
type InquiryValues = z.infer<typeof inquirySchema>;

function InquiryForm({ car }: { car: CarDetail }) {
  const { user, profile } = useAuth();
  const router = useRouter();
  const form = useForm<InquiryValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      buyer_name: profile?.full_name ?? "",
      buyer_email: user?.email ?? "",
      buyer_phone: profile?.phone ?? "",
      buyer_country: profile?.country ?? "",
      inquiry_type: "general",
      message: "",
    },
  });

  // sync defaults when auth resolves after mount
  useEffect(() => {
    if (user) {
      form.reset({
        buyer_name: profile?.full_name ?? form.getValues("buyer_name"),
        buyer_email: user.email ?? form.getValues("buyer_email"),
        buyer_phone: profile?.phone ?? form.getValues("buyer_phone"),
        buyer_country: profile?.country ?? form.getValues("buyer_country"),
        inquiry_type: form.getValues("inquiry_type"),
        message: form.getValues("message"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.id]);

  const mutation = useMutation({
    mutationFn: async (values: InquiryValues) => {
      const { error } = await supabase.from("inquiries").insert({
        car_id: car.id,
        seller_id: car.seller_id,
        buyer_id: user?.id ?? null,
        buyer_name: values.buyer_name,
        buyer_email: values.buyer_email,
        buyer_phone: values.buyer_phone || null,
        buyer_country: values.buyer_country,
        message: values.message,
        inquiry_type: values.inquiry_type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message sent to the seller!");
      form.reset({ ...form.getValues(), message: "" });
    },
    onError: (e: Error) => toast.error(e.message || "Failed to send inquiry"),
  });

  const requestShippingQuote = () => {
    form.setValue("inquiry_type", "shipping_quote");
    const current = form.getValues("message");
    if (!current) {
      form.setValue(
        "message",
        `Hi, I'd like a shipping quote for the ${car.year} ${car.title} to my country. Please share total cost and timeline. Thanks!`,
      );
    }
    document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const requestViewing = () => {
    form.setValue("inquiry_type", "general");
    const current = form.getValues("message");
    if (!current) {
      form.setValue(
        "message",
        `Hi, I'd like to arrange a viewing and inspection for the ${car.year} ${car.title}. Please share the available dates, location, and any requirements. Thanks!`,
      );
    }
    document.getElementById("inquiry-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div id="inquiry-form" className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-base font-semibold">Contact seller</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Direct contact. No brokers.
      </p>

      {car.available_for_export && (
        <Button
          type="button"
          variant="outline"
          onClick={requestShippingQuote}
          className="mt-4 w-full justify-center border-accent/40 text-foreground hover:bg-accent/5"
        >
          <Ship className="mr-2 h-4 w-4 text-accent" /> Request shipping quote
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={requestViewing}
        className="mt-3 w-full justify-center border-teal-200 text-foreground hover:bg-teal-50"
      >
        <CalendarCheck className="mr-2 h-4 w-4 text-teal-700" /> Request a viewing appointment
      </Button>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          className="mt-4 space-y-3"
        >
          <FormField
            control={form.control}
            name="buyer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="buyer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-2">
            <FormField
              control={form.control}
              name="buyer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="+1 555…" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyer_country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="inquiry_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inquiry type</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General question</SelectItem>
                    <SelectItem value="shipping_quote">Shipping quote</SelectItem>
                    <SelectItem value="import_request">Import request</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    placeholder="Hi, I'm interested in this car…"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-accent hover:bg-accent/90"
          >
            <Send className="mr-2 h-4 w-4" />
            {mutation.isPending ? "Sending…" : "Send message"}
          </Button>
          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              Want to track your inquiries?{" "}
              <button
                type="button"
                onClick={() => router.navigate({ to: "/login" })}
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}
function InspectionSummary({ carId }: { carId: string }) {
  const { data } = useQuery({
    queryKey: ["inspection-summary", carId],
    queryFn: async () => {
      const { data } = await supabase
        .from("inspections")
        .select("mechanic_verdict, overall_condition_score, buyer_summary, completed_at")
        .eq("car_id", carId)
        .eq("admin_approved", true)
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });
  if (!data) return null;
  const verdictLabel: Record<string, string> = {
    pass: "Pass", conditional_pass: "Conditional Pass", fail: "Fail",
  };
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold">Inspection summary</h3>
        {data.mechanic_verdict && (
          <Badge variant="outline" className="text-[10px]">{verdictLabel[data.mechanic_verdict] ?? data.mechanic_verdict}</Badge>
        )}
        {data.overall_condition_score != null && (
          <Badge variant="secondary" className="text-[10px]">Score {data.overall_condition_score}/10</Badge>
        )}
      </div>
      {data.buyer_summary ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{data.buyer_summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">Independent inspection completed and approved.</p>
      )}
    </div>
  );
}

