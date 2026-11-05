import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  Lock,
  BadgeCheck,
  Phone,
  Store,
  CalendarCheck,
  CheckCircle2,
  Scale,
  Sparkles,
  Wrench,
  MessageCircle,
  FileCheck2,
  Landmark,
  ListChecks,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VehicleHistoryReport } from "@/components/cars/VehicleHistoryReport";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FavoriteButton } from "@/components/FavoriteButton";
import { CarCard } from "@/components/CarCard";
import { VerifiedDocsBadge } from "@/components/DocumentManager";
import { VehiclePassport } from "@/components/VehiclePassport";
import { BuyerNextSteps } from "@/components/buyer/BuyerNextSteps";
import { StudioSpinViewer } from "@/components/vehicle/StudioSpinViewer";
import { ListingGallery } from "@/components/vehicle/ListingGallery";
import { PriceDepreciationChart } from "@/components/vehicle/PriceDepreciationChart";
import { SafetyRatings } from "@/components/vehicle/SafetyRatings";
import { AutoConnectScoreBadge } from "@/components/trust/AutoConnectScoreBadge";
import { VideoVerificationModal } from "@/components/trust/VideoVerificationModal";
import { WhatsAppConcierge } from "@/components/concierge/WhatsAppConcierge";
import { ChatWithSellerModal } from "@/components/vehicle/ChatWithSellerModal";
import { TradeInEstimatorModal } from "@/components/estimator/TradeInEstimatorModal";
import { FinanceCalculator } from "@/components/vehicle/FinanceCalculator";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useVehicleComparison } from "@/contexts/ComparisonContext";
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
import { useAuth } from "@/contexts/AuthContext";
import { CheckoutModal } from "@/components/payments/CheckoutModal";
import { calculateBreakdown, fromUsdCents, SERVICE_FEE_PERCENT } from "@/lib/stripe-config";
import { trackProductEvent } from "@/lib/product-analytics";
import { cn } from "@/lib/utils";


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
  features: string[] | null;
  right_hand_drive: boolean;
  steering_side: string | null;
  available_for_export: boolean;
  shipping_info: string | null;
  import_duties_note: string | null;
  vin: string | null;
  registration_number?: string | null;
  featured: boolean;
  is_sample?: boolean;
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

function toConciergeCar(car: CarDetail) {
  return {
    id: car.id,
    make: car.make_name ?? car.title.split(" ")[0] ?? "Vehicle",
    model: car.model_name ?? car.title.split(" ").slice(1).join(" "),
    year: car.year,
    price: Number(car.price),
    location: car.location_display ?? car.city ?? car.country,
  };
}

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
  // Supabase is the source of truth for published listing details.
  try {
    const { data: carData, error } = await supabase
      .from("cars")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (carData) {
      let carImages: { image_url: string; is_primary: boolean; sort_order: number }[] = [];
      try {
        const { data: imgData } = await supabase
          .from("car_images")
          .select("image_url, is_primary, sort_order")
          .eq("car_id", id)
          .order("sort_order", { ascending: true });
        if (imgData && imgData.length > 0) {
          carImages = imgData;
        }
      } catch (imgErr) {
        console.warn("Could not fetch car_images", imgErr);
      }

      let sellerInfo = null;
      let yardInfo = null;

      if (carData.seller_id) {
        try {
          const { data: s } = await supabase
            .from("sellers")
            .select("*")
            .eq("id", carData.seller_id)
            .maybeSingle();
          if (s) sellerInfo = s;
        } catch {
          // Ignore join failure
        }
      }

      if (carData.yard_id) {
        try {
          const { data: y } = await supabase
            .from("car_yards")
            .select("*")
            .eq("id", carData.yard_id)
            .maybeSingle();
          if (y) yardInfo = y;
        } catch {
          // Ignore join failure
        }
      }

      return {
        ...carData,
        car_images: carImages,
        sellers: sellerInfo || {
          id: carData.seller_id || "seller-default",
          business_name: "AutoConnect Certified Dealership",
          country: carData.country || "KE",
          city: carData.city || "Nairobi",
          location_display: carData.location_display || "Nairobi Hub",
          is_verified: true,
          verification_badge: true,
          is_dealer: true,
          offers_local_pickup: true,
          offers_domestic_shipping: true,
          offers_international_shipping: true,
        },
        car_yards: yardInfo,
      } as unknown as CarDetail;
    }
  } catch (err) {
    console.warn("Supabase fetch error for car:", err);
  }

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
      ? `${car.year || ""} ${car.title || "Vehicle"} for ${formatPrice(Number(car.price || 0), car.currency || "USD")} in ${car.location_display ?? car.country ?? "Nairobi"}.`
      : "View this car listing on AutoConnect.";
    const img =
      car?.car_images?.[0]?.image_url ||
      "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80";
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:image", content: img },
      { name: "twitter:image", content: img },
    ];
    return { meta };
  },
  component: CarDetailPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ac-apricot text-ac-ink">
        <CarIcon className="h-6 w-6" />
      </span>
      <p className="font-brand mt-5 text-2xl">Couldn't load this listing</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : String(error)}
      </p>
      <Button asChild className="mt-6 h-11 rounded-full px-6">
        <Link to="/cars">Browse other cars</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ac-cream text-ac-ink">
        <CarIcon className="h-6 w-6" />
      </span>
      <p className="font-brand mt-5 text-2xl">Listing not found</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This car may have been removed or is awaiting approval.
      </p>
      <Button asChild className="mt-6 h-11 rounded-full px-6">
        <Link to="/cars">Browse other cars</Link>
      </Button>
    </div>
  ),
});

function CarDetailPage() {
  const { id } = Route.useParams();
  const { formatPrice } = useCurrency();
  const { toggleCompare, isInComparison } = useVehicleComparison();
  const [mediaTab, setMediaTab] = useState<"photos" | "360">("photos");
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [tradeInOpen, setTradeInOpen] = useState(false);
  const [evidenceTab, setEvidenceTab] = useState("overview");

  const { data: car } = useQuery({
    queryKey: ["car", id],
    queryFn: () => fetchCar(id),
  });

  // Increment views once on mount
  useEffect(() => {
    supabase.rpc("increment_car_views", { car_id: id });
    void trackProductEvent("vehicle_listing_viewed", { car_id: id });
  }, [id]);

  if (!car) return null;

  const rawCarImages = Array.isArray(car.car_images) ? car.car_images : [];
  const images = [...rawCarImages].sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0));

  // 360° Studio Spin is available when the vehicle has 2 or more real photos
  const has360Spin = images.length >= 2;

  const isCompared = isInComparison(car.id);
  const country = countryByCode(car.country);

  const handleCompareToggle = () => {
    toggleCompare({
      id: car.id,
      make: car.make_name || car.title.split(" ")[0] || "Vehicle",
      model: car.model_name || car.title.split(" ").slice(1).join(" ") || "",
      year: car.year,
      price: Number(car.price),
      mileage: car.mileage,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      body_type: car.body_type,
      country: car.country,
      city: car.city,
      features: car.features,
      image_url: images[0]?.image_url,
      verified: car.featured || car.inspection_verified,
    });
  };

  const scrollToBuyBox = () => {
    document.getElementById("buy-box")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-32 pt-3 sm:px-6 sm:pt-6 lg:pb-20">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-2">
        <Link
          to="/cars"
          className="-ml-2 inline-flex h-11 items-center gap-1 rounded-full px-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back to</span> listings
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ShareButton title={car.title} />
          <button
            type="button"
            onClick={handleCompareToggle}
            aria-pressed={isCompared}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition sm:px-4",
              isCompared
                ? "border-ac-accent bg-ac-accent text-ac-ink"
                : "border-border bg-card text-foreground hover:border-foreground/40",
            )}
            aria-label={isCompared ? "In comparison" : "Compare"}
          >
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">{isCompared ? "In comparison" : "Compare"}</span>
          </button>
          <FavoriteButton carId={car.id} className="border border-border bg-card text-foreground" />
        </div>
      </div>

      {/* Photos first */}
      <div className="mt-3 sm:mt-4">
        {mediaTab === "360" && has360Spin ? (
          <div>
            <StudioSpinViewer
              images={images.map((i) => i.image_url)}
              vehicleTitle={car.title}
              year={car.year}
            />
            <button
              type="button"
              onClick={() => setMediaTab("photos")}
              className="mt-3 inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold"
            >
              <Eye className="h-4 w-4" /> Back to photos ({images.length})
            </button>
          </div>
        ) : (
          <ListingGallery
            images={images}
            title={car.title}
            has360={has360Spin}
            on360={() => setMediaTab("360")}
            onVideo={() => setVideoModalOpen(true)}
          />
        )}
      </div>

      <div className="mt-6 grid gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12">
        {/* Title, price, key facts, seller */}
        <section className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex flex-wrap items-center gap-2">
            {car.is_sample && (
              <span className="rounded-full bg-ac-ink px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-ac-ink">
                Sample listing
              </span>
            )}
            {car.featured && (
              <span className="rounded-full bg-ac-accent px-3 py-1 text-xs font-bold text-ac-ink">
                Featured
              </span>
            )}
          </div>
          <h1 className="font-brand mt-3 text-3xl text-foreground sm:text-5xl">{car.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 text-base text-muted-foreground">
            <span>
              {car.year} · {car.make_name} {car.model_name ?? ""}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {country?.flag} {car.location_display ?? car.country}
            </span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            {car.condition && <span className="capitalize">{car.condition.replace("-", " ")}</span>}
            {car.condition && <span aria-hidden>·</span>}
            <span>{car.right_hand_drive ? "Right-hand drive" : "Left-hand drive"}</span>
            {car.available_for_export && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Plane className="h-3.5 w-3.5" /> Export ready
                </span>
              </>
            )}
          </p>
          <p className="mt-4 text-3xl font-extrabold tabular-nums text-foreground lg:hidden">
            {formatPrice(Number(car.price))}
          </p>
          {car.is_sample && (
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              Preview listing — not for sale
            </p>
          )}
          <p className="mt-2 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {car.views.toLocaleString()} views
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Listed {timeAgo(car.created_at)}
            </span>
          </p>

          {/* Key facts */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            <Highlight icon={Calendar} value={String(car.year)} label="Year" />
            <Highlight
              icon={Gauge}
              value={car.mileage != null ? `${(car.mileage / 1000).toFixed(0)}k` : "—"}
              label={car.mileage_unit}
            />
            <Highlight icon={Fuel} value={car.fuel_type ?? "—"} label="Fuel" />
            <Highlight icon={Settings2} value={car.transmission ?? "—"} label="Trans." />
          </div>

          {/* Sold by */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <SellerCard car={car} />
            <YardCard car={car} />
          </div>
        </section>

        {/* Buy box: sticky on desktop, right after the key facts on mobile */}
        <aside
          id="buy-box"
          className="scroll-mt-24 space-y-3 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
        >
          <BuyBox car={car} onTradeIn={() => setTradeInOpen(true)} />
          <FavoriteButton carId={car.id} variant="full" />
        </aside>

        {/* Evidence, grouped */}
        <div className="min-w-0 space-y-12 lg:col-start-1 lg:row-start-2">
          <Tabs value={evidenceTab} onValueChange={setEvidenceTab}>
            <div className="sticky top-16 z-20 -mx-4 bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
              <TabsList className="no-scrollbar flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-full bg-muted p-1">
                <EvidenceTrigger value="overview" icon={ClipboardList} label="Overview" />
                <EvidenceTrigger value="evidence" icon={FileCheck2} label="Evidence" />
                <EvidenceTrigger value="money" icon={Landmark} label="Price & finance" ai />
                <EvidenceTrigger value="next" icon={ListChecks} label="Next steps" />
              </TabsList>
            </div>

            <TabsContent
              value="overview"
              forceMount
              className="mt-6 space-y-6 data-[state=inactive]:hidden"
            >
              {/* Specs grid */}
              <Panel title="Specifications">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  <Spec icon={Calendar} label="Year" value={String(car.year)} />
                  <Spec
                    icon={Gauge}
                    label="Mileage"
                    value={
                      car.mileage != null
                        ? `${car.mileage.toLocaleString()} ${car.mileage_unit}`
                        : "—"
                    }
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
              </Panel>

              {/* Features */}
              {car.features && car.features.length > 0 && (
                <Panel title="Features & equipment">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {car.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              )}

              {/* Description */}
              {car.description && (
                <Panel title="Description">
                  <p className="whitespace-pre-line text-base leading-7 text-muted-foreground">
                    {car.description}
                  </p>
                </Panel>
              )}

              {/* Export info box */}
              {car.available_for_export && (
                <div className="rounded-[28px] bg-ac-powder p-5 text-ac-ink sm:p-7">
                  <div className="flex items-center gap-2">
                    <Plane className="h-5 w-5" />
                    <h2 className="font-brand text-xl">Export & shipping</h2>
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    {car.shipping_info && (
                      <div>
                        <p className="brand-kicker text-ac-ink/60">Shipping</p>
                        <p className="mt-1 whitespace-pre-line text-ac-ink/80">
                          {car.shipping_info}
                        </p>
                      </div>
                    )}
                    {car.import_duties_note && (
                      <div>
                        <p className="brand-kicker text-ac-ink/60">Import duties</p>
                        <p className="mt-1 whitespace-pre-line text-ac-ink/80">
                          {car.import_duties_note}
                        </p>
                      </div>
                    )}
                    {!car.shipping_info && !car.import_duties_note && (
                      <p className="text-ac-ink/80">
                        This seller ships internationally. Request a quote to get exact cost and
                        timeline to your country.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="evidence"
              forceMount
              className="mt-6 space-y-6 data-[state=inactive]:hidden"
            >
              <SectionIntro
                kicker="Evidence"
                title="What is known about this car."
                body="Documents, history and inspection results appear here only when they have really been attached or reviewed."
              />
              {/* AutoConnect Trust Score Section */}
              <AutoConnectScoreBadge
                vehicleData={{
                  condition: car.condition,
                  mileage: car.mileage,
                  mileage_unit: car.mileage_unit,
                  photosCount: images.length,
                  isSellerVerified: car.sellers?.verification_badge === true,
                  isDealer: car.sellers?.is_dealer,
                  documentsVerified: car.documents_verified,
                  ntsaVerified: car.ntsa_verified,
                  inspectionVerified: car.inspection_verified,
                  hasVideo: false,
                }}
                variant="detail"
                
              />
              {/* Trust & Safety */}
              <div className="flex flex-wrap items-center gap-2">
                <VerifiedDocsBadge carId={car.id} />
              </div>
              <VehiclePassport carId={car.id} />
              <VehicleHistoryReport
                carId={car.id}
                country={car.country}
                vin={car.vin || undefined}
                regNumber={car.registration_number || undefined}
              />
              <InspectionSummary carId={car.id} />
              {/* Safety Ratings */}
              {car.make_name && car.model_name && car.year && (
                <SafetyRatings make={car.make_name} model={car.model_name} year={car.year} />
              )}
            </TabsContent>

            <TabsContent
              value="money"
              forceMount
              className="mt-6 space-y-6 data-[state=inactive]:hidden"
            >
              <SectionIntro
                kicker="Price & finance"
                title="Know the numbers before you commit."
                body="Estimates to help you plan. Final figures come from the seller, lender or insurer."
              />
              {/* Finance & Insurance Calculator */}
              <FinanceCalculator price={Number(car.price)} currency={car.currency} />

              {/* Price Trend & Depreciation Forecast Chart */}
              <PriceDepreciationChart
                currentPrice={Number(car.price)}
                year={car.year}
                make={car.make_name || car.title.split(" ")[0]}
                model={car.model_name || ""}
                mileage={car.mileage || 60000}
                currency={car.currency}
              />

              <div className="flex flex-col gap-4 rounded-[28px] bg-ac-apricot p-5 text-ac-ink sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <p className="brand-kicker text-ac-ink/60">Trade-in</p>
                  <p className="font-brand mt-1 text-xl">Have a car to trade in?</p>
                  <p className="mt-1 text-sm text-ac-ink/75">
                    Get a valuation against this {car.year} {car.title}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTradeInOpen(true)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ac-ink px-5 text-sm font-bold text-white"
                >
                  <Sparkles className="h-4 w-4 text-ac-accent" /> Trade-in valuation
                </button>
              </div>
            </TabsContent>

            <TabsContent
              value="next"
              forceMount
              className="mt-6 space-y-6 data-[state=inactive]:hidden"
            >
              <BuyerNextSteps />
              <VehicleServices car={car} />
            </TabsContent>
          </Tabs>

          {/* Contact seller */}
          <section>
            <SectionIntro
              kicker="Contact"
              title="Ask the seller directly."
              body="Questions, viewings and shipping quotes go straight to the seller."
            />
            <div className="mt-5">
              <InquiryForm car={car} />
            </div>
          </section>

          {/* Similar cars */}
          <SimilarCars car={car} />
        </div>
      </div>

      {/* Video Verification Walk-Around Modal */}
      <VideoVerificationModal
        open={videoModalOpen}
        onOpenChange={setVideoModalOpen}
        carTitle={car.title}
        videoUrl={
          car.featured
            ? "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80"
            : null
        }
      />


      {/* Trade-In Estimator Modal */}
      <TradeInEstimatorModal
        open={tradeInOpen}
        onOpenChange={setTradeInOpen}
        targetCarId={car.id}
        targetCarTitle={car.title}
        targetCarPrice={Number(car.price)}
      />

      {/* Sticky mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 shadow-[0_-8px_24px_-12px_rgba(11,19,36,0.25)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-[1360px] items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold tabular-nums text-foreground">
              {formatPrice(Number(car.price))}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {car.year} · {car.location_display ?? country?.name ?? car.country}
            </p>
          </div>
          <ChatWithSellerModal
            carId={car.id}
            sellerId={car.seller_id}
            carTitle={car.title}
            customTrigger={
              <Button
                type="button"
                variant="outline"
                className="h-11 w-11 shrink-0 rounded-full p-0"
                aria-label="Live chat with seller"
              >
                <Send className="h-4 w-4" />
              </Button>
            }
          />
          <div className="hidden shrink-0 sm:block">
            <WhatsAppConcierge car={toConciergeCar(car)} compact className="h-11 rounded-full px-4" />
          </div>
          <Button
            type="button"
            onClick={scrollToBuyBox}
            className="h-11 shrink-0 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink hover:bg-ac-accent/90"
          >
            {car.is_sample ? "Preview only" : "Start purchase"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function EvidenceTrigger({
  value,
  icon: Icon,
  label,
  ai = false,
}: {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  ai?: boolean;
}) {
  return (
    <TabsTrigger
      value={value}
      className="min-h-11 shrink-0 gap-1.5 rounded-full px-4 text-sm font-semibold data-[state=active]:bg-card data-[state=active]:shadow-sm"
    >
      <Icon className="h-4 w-4" />
      {label}
      {ai && (
        <span className="inline-flex items-center gap-0.5 rounded-full bg-ac-ink px-1.5 py-0.5 text-[10px] font-bold text-ac-accent">
          <Sparkles className="h-2.5 w-2.5" /> AI
        </span>
      )}
    </TabsTrigger>
  );
}

function SectionIntro({ kicker, title, body }: { kicker: string; title: string; body?: string }) {
  return (
    <div>
      <p className="brand-kicker text-muted-foreground">{kicker}</p>
      <h2 className="font-brand mt-2 text-2xl text-foreground sm:text-3xl">{title}</h2>
      {body && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 sm:p-7">
      <h2 className="font-brand text-xl text-foreground">{title}</h2>
      <div className="mt-5">{children}</div>
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
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-foreground" />
      <p className="mt-2 text-base font-bold capitalize leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
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
    <button
      type="button"
      onClick={onShare}
      aria-label="Share"
      className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:border-foreground/40 sm:px-4"
    >
      <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
    </button>
  );
}

function TrustPanel() {
  const items = [
    {
      icon: BadgeCheck,
      title: "Verified sellers",
      body: "Every dealer is vetted before listings go live.",
    },
    {
      icon: Lock,
      title: "No upfront fees",
      body: "Talk to the seller directly. No broker markup.",
    },
    {
      icon: Ship,
      title: "Global logistics",
      body: "Door-to-port and door-to-door shipping options.",
    },
    {
      icon: Phone,
      title: "Real humans",
      body: "Our support team is one message away if anything feels off.",
    },
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
  is_sample?: boolean;
};

function SimilarCars({ car }: { car: CarDetail }) {
  const { data } = useQuery({
    queryKey: ["similar-cars", car.id, car.make_name, car.country],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,is_sample,title,year,price,currency,country,location_display,car_images(image_url,is_primary)",
        )
        .eq("status", "approved")
        .neq("id", car.id)
        .or(
          [car.make_name ? `make_name.eq.${car.make_name}` : null, `country.eq.${car.country}`]
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
    <section>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="brand-kicker text-muted-foreground">Keep looking</p>
          <h2 className="font-brand mt-2 text-2xl text-foreground sm:text-3xl">You may also like</h2>
        </div>
        <Link
          to="/cars"
          className="inline-flex h-11 items-center rounded-full px-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline"
        >
          See all
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2">
        {data.map((c) => (
          <CarCard
            key={c.id}
            car={{
              ...c,
              car_images: Array.isArray(c.car_images) ? c.car_images : [],
            }}
          />
        ))}
      </div>
    </section>
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
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold capitalize text-foreground">{value}</dd>
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
      className="block rounded-3xl border border-border bg-card p-5 transition-colors hover:border-foreground/40"
    >
      <p className="brand-kicker text-muted-foreground">Sold from a car yard</p>
      <div className="mt-3 flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
          {yard.logo_url ? (
            <img src={yard.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-foreground">{yard.name}</h3>
          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {country?.flag} {yard.city ? `${yard.city}, ` : ""}
            {country?.name ?? yard.country}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground">
        Visit yard & see all their cars →
      </p>
    </Link>
  );
}

function SellerCardInner({ car }: { car: CarDetail }) {
  const seller = car.sellers;
  const country = countryByCode(seller?.country ?? car.country);
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="brand-kicker text-muted-foreground">Seller</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">
            {seller?.business_name ?? "Private seller"}
          </h3>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {country?.flag} {seller?.location_display ?? country?.name ?? car.country}
          </p>
        </div>
        {seller?.verification_badge && (
          <Badge className="shrink-0 bg-success text-white hover:bg-success">
            <ShieldCheck className="mr-1 h-3 w-3" />{" "}
            {seller?.is_dealer ? "Dealer Verified" : "Seller Verified"}
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

function BuyBox({ car, onTradeIn }: { car: CarDetail; onTradeIn?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const primaryImage = Array.isArray(car.car_images)
    ? (car.car_images.find((image) => image.is_primary)?.image_url ?? car.car_images[0]?.image_url)
    : undefined;
  const price = Number(car.price);
  // Fallback: if no options set, allow full
  const options: Array<{
    id: "full" | "deposit" | "installments";
    label: string;
    amount: number;
    sub: string;
  }> = [];
  if (car.pay_full || (!car.pay_deposit && !car.pay_installments)) {
    options.push({
      id: "full",
      label: "Full payment",
      amount: price,
      sub: "Pay the full price now",
    });
  }
  if (car.pay_deposit) {
    const pct = Number(car.deposit_percent ?? 20);
    const amt = Math.round(((price * pct) / 100) * 100) / 100;
    options.push({
      id: "deposit",
      label: `Reserve (${pct}%)`,
      amount: amt,
      sub: `Deposit now, ${formatPrice(price - amt, car.currency)} balance later`,
    });
  }
  if (car.pay_installments) {
    const monthly = Number(car.installment_monthly ?? 0);
    const m = Number(car.installment_months ?? 12);
    options.push({
      id: "installments",
      label: `${m}-month plan`,
      amount: monthly || price / m,
      sub: `First month now, ${m - 1} more monthly payments`,
    });
  }
  const [plan, setPlan] = useState<"full" | "deposit" | "installments">(options[0]?.id ?? "full");
  const selected = options.find((o) => o.id === plan) ?? options[0];
  const breakdown = calculateBreakdown(selected?.amount ?? price, car.currency);
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 shadow-[0_18px_50px_-24px_rgba(11,19,36,0.35)] sm:p-6">
      <p className="brand-kicker text-muted-foreground">Price</p>
      <p className="font-brand mt-1 text-3xl tabular-nums text-foreground">
        {formatPrice(price, car.currency)}
      </p>
      {car.is_sample && (
        <p className="mt-2 rounded-xl bg-ac-cream px-3 py-2 text-xs font-semibold text-ac-ink">
          Preview listing — not for sale
        </p>
      )}

      <div className="mt-5 flex items-center gap-2">
        <Lock className="h-4 w-4 text-foreground" />
        <h3 className="text-sm font-bold text-foreground">Plan your purchase</h3>
      </div>
      {options.length > 1 && (
        <div className="mt-3 grid grid-cols-1 gap-1.5" role="radiogroup" aria-label="Payment plan">
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={plan === o.id}
              onClick={() => setPlan(o.id)}
              className={cn(
                "min-h-11 rounded-2xl border px-3.5 py-2.5 text-left text-xs transition-colors",
                plan === o.id
                  ? "border-foreground bg-muted/60 text-foreground"
                  : "border-border hover:border-foreground/40",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold">{o.label}</span>
                <span className="font-mono font-semibold">{formatPrice(o.amount, car.currency)}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{o.sub}</div>
            </button>
          ))}
        </div>
      )}
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">{selected?.label ?? "Amount"}</span>
          <span className="font-medium">{formatPrice(breakdown.carPrice, car.currency)}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">Service fee ({SERVICE_FEE_PERCENT}%)</span>
          <span className="font-medium">{formatPrice(breakdown.serviceFee, car.currency)}</span>
        </div>
        <div className="my-2 border-t border-border" />
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">Total now</span>
          <span className="text-lg font-extrabold text-foreground">
            {formatPrice(breakdown.total, car.currency)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Charged in USD ≈ $
          {fromUsdCents(breakdown.totalUsdCents).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
        </p>
      </div>
      <Button
        className="mt-5 h-12 w-full rounded-full bg-ac-accent text-sm font-extrabold text-ac-ink hover:bg-ac-accent/90"
        disabled={car.is_sample}
        onClick={() => {
          if (car.is_sample) return;
          if (!user) {
            router.navigate({ to: "/login" });
            return;
          }
          setOpen(true);
        }}
      >
        <Lock className="mr-2 h-4 w-4" />
        {car.is_sample ? "Preview listing — not for sale" : <>See payment options {formatPrice(breakdown.total, car.currency)}</>}
      </Button>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <ChatWithSellerModal
          carId={car.id}
          sellerId={car.seller_id}
          carTitle={car.title}
          customTrigger={
            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-full font-semibold"
            >
              <MessageCircle className="h-4 w-4" /> Chat
            </Button>
          }
        />
        <WhatsAppConcierge car={toConciergeCar(car)} compact className="h-11 w-full rounded-full" />
      </div>
      <details className="group mt-4 rounded-2xl bg-muted/60 px-4 py-3">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between gap-2 text-xs font-bold text-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-success" /> How you're protected
          </span>
          <span className="text-muted-foreground transition group-open:rotate-180">⌄</span>
        </summary>
      <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-success" /> Payment status is shown
          only after provider confirmation
        </li>
        <li className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-success" /> Confirm viewing and
          evidence before you pay
        </li>
        <li className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-success" /> Documents shown in the
          Vehicle Passport
        </li>
        <li className="flex items-start gap-1.5">
          <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-success" /> Available payment methods
          are confirmed during checkout
        </li>
      </ul>
      </details>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 text-[12px] font-semibold">
        <Link
          to="/how-payments-work"
          className="inline-flex min-h-11 items-center text-foreground underline-offset-4 hover:underline"
        >
          How payments work →
        </Link>
        {onTradeIn && (
          <button
            type="button"
            onClick={onTradeIn}
            className="inline-flex min-h-11 items-center gap-1 text-foreground underline-offset-4 hover:underline"
          >
            <Sparkles className="h-3.5 w-3.5 text-foreground" /> Trade-in valuation
          </button>
        )}
      </div>
      <CheckoutModal
        open={open}
        onOpenChange={setOpen}
        carId={car.id}
        carTitle={car.title}
        carPrice={selected?.amount ?? price}
        currency={car.currency}
        carImage={primaryImage}
        location={car.location_display ?? car.country}
        year={car.year}
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
      void trackProductEvent("seller_enquiry_sent", { car_id: car.id, inquiry_type: form.getValues("inquiry_type") });
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
    <div id="inquiry-form" className="scroll-mt-24 rounded-[28px] border border-border bg-card p-5 sm:p-7">
      <h3 className="font-brand text-xl text-foreground">Contact seller</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">Direct contact. No brokers.</p>

      {car.available_for_export && (
        <Button
          type="button"
          variant="outline"
          onClick={requestShippingQuote}
          className="mt-4 h-11 w-full justify-center rounded-full"
        >
          <Ship className="mr-2 h-4 w-4" /> Request shipping quote
        </Button>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={requestViewing}
        className="mt-3 h-11 w-full justify-center rounded-full"
      >
        <CalendarCheck className="mr-2 h-4 w-4" /> Request a viewing appointment
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="mt-4 space-y-3">
          <FormField
            control={form.control}
            name="buyer_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
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
                  <FormControl>
                    <Input placeholder="+1 555…" {...field} />
                  </FormControl>
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
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Textarea rows={5} placeholder="Hi, I'm interested in this car…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="h-12 w-full rounded-full font-bold"
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
    pass: "Pass",
    conditional_pass: "Conditional Pass",
    fail: "Fail",
  };
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 sm:p-7">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <BadgeCheck className="h-4 w-4 text-success" />
        <h3 className="text-sm font-semibold">Inspection summary</h3>
        {data.mechanic_verdict && (
          <Badge variant="outline" className="text-[10px]">
            {verdictLabel[data.mechanic_verdict] ?? data.mechanic_verdict}
          </Badge>
        )}
        {data.overall_condition_score != null && (
          <Badge variant="secondary" className="text-[10px]">
            Score {data.overall_condition_score}/10
          </Badge>
        )}
      </div>
      {data.buyer_summary ? (
        <p className="text-sm text-muted-foreground whitespace-pre-line">{data.buyer_summary}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Independent inspection completed and approved.
        </p>
      )}
    </div>
  );
}

function VehicleServices({ car }: { car: CarDetail }) {
  const items = [
    {
      to: "/services",
      icon: Wrench,
      tone: "bg-ac-cream",
      title: "Book an Inspection",
      body: "Send an independent mechanic",
    },
    {
      to: "/import",
      icon: Plane,
      tone: "bg-ac-powder",
      title: "Import & Clear",
      body: "Get a door-to-door shipping quote",
    },
    {
      to: "/services",
      icon: ShieldCheck,
      tone: "bg-ac-stone",
      title: "Buy Insurance",
      body: "Compare instant quotes",
    },
  ] as const;
  return (
    <div className="rounded-[28px] border border-border bg-card p-5 sm:p-7">
      <h2 className="font-brand text-xl text-foreground">AutoConnect Services</h2>
      <p className="mt-1 text-sm text-muted-foreground">Seamlessly manage your automotive journey.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {items.map(({ to, icon: Icon, tone, title, body }) => (
          <Link
            key={title}
            to={to}
            className={cn(
              "group flex min-h-11 items-center gap-3 rounded-2xl p-4 text-ac-ink transition hover:brightness-[0.97] sm:flex-col sm:items-start",
              tone,
            )}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/70">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold">{title}</span>
              <span className="block text-xs text-ac-ink/70">{body}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-ac-ink/50 sm:hidden" />
          </Link>
        ))}
      </div>
    </div>
  );
}
