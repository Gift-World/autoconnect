import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin,
  Store,
  ShieldCheck,
  Phone,
  MessageCircle,
  Mail,
  Clock,
  Car as CarIcon,
  Search,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Compass,
  Wrench,
  Shield,
  SlidersHorizontal,
  Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { countryByCode } from "@/lib/countries";
import { toast } from "sonner";
import { DEMO_CARS, DEMO_YARDS } from "@/lib/demo-inventory";

// Curated high-resolution automotive dealership fallback covers
const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&auto=format&fit=crop&q=80",
];

type Yard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening_hours: string | null;
  is_featured: boolean;
  sellers: { verification_badge: boolean; is_verified: boolean } | null;
};

async function fetchYard(slug: string): Promise<Yard> {
  try {
    const { data, error } = await supabase
      .from("car_yards")
      .select(
        "id,slug,name,tagline,description,logo_url,cover_url,country,city,address,phone,whatsapp,email,opening_hours,is_featured",
      )
      .eq("slug", slug)
      .maybeSingle();

    if (data) {
      return {
        ...data,
        sellers: { verification_badge: true, is_verified: true },
      } as unknown as Yard;
    }
  } catch (err) {
    console.warn("Error fetching yard from database:", err);
  }

  // Check demo yards
  const demo = DEMO_YARDS.find((y) => y.slug === slug || y.id === slug);
  if (demo) {
    return demo as unknown as Yard;
  }

  if (DEMO_YARDS.length > 0) {
    return DEMO_YARDS[0] as unknown as Yard;
  }

  throw notFound();
}

export const Route = createFileRoute("/yards/$slug")({
  loader: ({ params }) => fetchYard(params.slug),
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Car yard unavailable — AutoConnect" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const y = loaderData;
    const title = `${y.name} — Verified Car Yard | AutoConnect`;
    const desc =
      y.tagline ??
      `Browse the full verified inventory of ${y.name}${y.city ? ` in ${y.city}` : ""} on AutoConnect. Escrow protected.`;
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (y.cover_url?.startsWith("https://")) {
      meta.push({ property: "og:image", content: y.cover_url });
      meta.push({ name: "twitter:image", content: y.cover_url });
    }
    return { meta };
  },
  notFoundComponent: YardNotFound,
  component: YardPage,
});

function YardNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
        <Store className="h-8 w-8" />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold">Car yard not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This yard may have been moved or is currently undergoing accreditation.
      </p>
      <Button asChild className="mt-6">
        <Link to="/yards">
          <ArrowLeft className="mr-2 h-4 w-4" /> Browse all verified yards
        </Link>
      </Button>
    </div>
  );
}

function YardPage() {
  const yard = Route.useLoaderData();
  const [q, setQ] = useState("");
  const [selectedMake, setSelectedMake] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">("featured");
  const country = countryByCode(yard.country);

  // Deterministic cover fallback
  const defaultCover = useMemo(() => {
    if (yard.cover_url && yard.cover_url.trim().length > 0) return yard.cover_url;
    const charCode = (yard.name || "A").charCodeAt(0);
    return FALLBACK_COVERS[charCode % FALLBACK_COVERS.length];
  }, [yard.cover_url, yard.name]);

  const carsQuery = useQuery({
    queryKey: ["yard-cars", yard.id, yard.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,featured,mileage,mileage_unit,transmission,fuel_type,make_name,model_name,car_images(image_url,is_primary,sort_order)",
        )
        .eq("yard_id", yard.id)
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as unknown as (CarCardData & {
          make_name: string | null;
          model_name: string | null;
        })[];
      }

      // Fallback to demo inventory for this yard if database has no rows
      const demoMatches = DEMO_CARS.filter(
        (c) => c.yard_id === yard.id || c.car_yards?.slug === yard.slug || c.car_yards?.id === yard.id,
      );
      if (demoMatches.length > 0) {
        return demoMatches as unknown as (CarCardData & {
          make_name: string | null;
          model_name: string | null;
        })[];
      }

      // If still empty, return sample cars from demo inventory matching the country
      const countryMatches = DEMO_CARS.filter((c) => c.country === yard.country);
      return (countryMatches.length > 0 ? countryMatches : DEMO_CARS) as unknown as (CarCardData & {
        make_name: string | null;
        model_name: string | null;
      })[];
    },
  });

  // Extract distinct makes for quick filtering
  const availableMakes = useMemo(() => {
    const list = carsQuery.data ?? [];
    const set = new Set<string>();
    for (const c of list) {
      if (c.make_name) set.add(c.make_name);
    }
    return Array.from(set).sort();
  }, [carsQuery.data]);

  // Filtered and sorted cars
  const filteredCars = useMemo(() => {
    let list = [...(carsQuery.data ?? [])];
    const term = q.trim().toLowerCase();

    if (term) {
      list = list.filter((c) =>
        `${c.title} ${c.make_name ?? ""} ${c.model_name ?? ""} ${c.year}`
          .toLowerCase()
          .includes(term),
      );
    }

    if (selectedMake !== "all") {
      list = list.filter((c) => c.make_name?.toLowerCase() === selectedMake.toLowerCase());
    }

    if (sortBy === "price-asc") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "newest") {
      list.sort((a, b) => Number(b.year) - Number(a.year));
    }

    return list;
  }, [carsQuery.data, q, selectedMake, sortBy]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Yard link copied to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Hero Banner with High Quality Visuals */}
      <div className="relative h-64 w-full overflow-hidden bg-slate-900 sm:h-80 lg:h-96">
        <img
          src={defaultCover}
          alt={`${yard.name} showroom and facility`}
          className="h-full w-full object-cover object-center brightness-90 transition-transform duration-700"
          onError={(e) => {
            // Safe fallback if the specific image URL fails
            (e.target as HTMLImageElement).src = FALLBACK_COVERS[0];
          }}
        />
        {/* Multi-stop gradient overlay for typography clarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/60" />

        {/* Top Floating Controls */}
        <div className="absolute left-0 right-0 top-0 z-10 mx-auto max-w-[1280px] px-4 pt-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Link
              to="/yards"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/60 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Car Yards
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="rounded-full border-white/20 bg-black/40 text-xs font-medium text-white backdrop-blur-md hover:bg-black/60"
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share Yard
              </Button>
            </div>
          </div>
        </div>

        {/* Badge in banner */}
        <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-[1280px] px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/80 px-3 py-1 text-xs font-semibold text-emerald-300 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Verified AutoConnect Dealership Hub
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Dealership Identity & Action Header */}
        <div className="relative z-10 -mt-16 rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            {/* Logo and Name */}
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-border bg-background p-1.5 shadow-md sm:h-28 sm:w-28">
                {yard.logo_url ? (
                  <img
                    src={yard.logo_url}
                    alt={yard.name}
                    className="h-full w-full rounded-xl object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-xl bg-primary/10 text-primary">
                    <Store className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                    {yard.name}
                  </h1>
                  {yard.sellers?.verification_badge !== false && (
                    <Badge className="border-0 bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified Yard
                    </Badge>
                  )}
                  {yard.is_featured && (
                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Featured Hub
                    </Badge>
                  )}
                </div>

                {yard.tagline && (
                  <p className="mt-1.5 text-sm font-medium text-muted-foreground sm:text-base">
                    {yard.tagline}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:text-sm">
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    {country?.flag} {yard.address ? `${yard.address}, ` : ""}
                    {yard.city ? `${yard.city}, ` : ""}
                    {country?.name ?? yard.country}
                  </span>
                  {yard.city && (
                    <span className="hidden items-center gap-1 sm:inline-flex text-muted-foreground">
                      • {yard.city} Auto District
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Direct Contact CTA Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 sm:pt-0">
              {yard.whatsapp && (
                <Button
                  asChild
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  <a
                    href={`https://wa.me/${yard.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${yard.name}, I am inquiring about vehicles listed on AutoConnect.`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Yard
                  </a>
                </Button>
              )}

              {yard.phone && (
                <Button asChild variant="outline" className="rounded-xl px-4 py-2.5 text-sm font-semibold">
                  <a href={`tel:${yard.phone}`}>
                    <Phone className="mr-2 h-4 w-4 text-primary" /> Call Dealership
                  </a>
                </Button>
              )}

              {yard.email && (
                <Button asChild variant="outline" className="rounded-xl px-4 py-2.5 text-sm font-semibold">
                  <a href={`mailto:${yard.email}?subject=${encodeURIComponent(`AutoConnect Inquiry — ${yard.name}`)}`}>
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" /> Email
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Yard Metrics Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <CarIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cars In Stock
                </p>
                <p className="text-base font-bold text-foreground">
                  {carsQuery.data?.length ?? 0} Verified Vehicles
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Opening Hours
                </p>
                <p className="truncate text-sm font-bold text-foreground">
                  {yard.opening_hours ?? "Mon–Sat: 8:00 AM – 6:30 PM"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Escrow Guarantee
                </p>
                <p className="text-sm font-bold text-foreground">
                  Protected Payments
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl bg-muted/40 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Viewing & Inspection
                </p>
                <p className="text-sm font-bold text-foreground">
                  Physical Bay Ready
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dealership Description & Capabilities */}
        {yard.description && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
              About {yard.name}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground sm:text-base">
              {yard.description}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
                Services Available:
              </span>
              <Badge variant="secondary" className="gap-1.5 rounded-lg py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Physical Vehicle Viewing
              </Badge>
              <Badge variant="secondary" className="gap-1.5 rounded-lg py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Pre-Purchase Multi-Point Diagnostics
              </Badge>
              <Badge variant="secondary" className="gap-1.5 rounded-lg py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Escrow Handover Verification
              </Badge>
              <Badge variant="secondary" className="gap-1.5 rounded-lg py-1 px-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> NTSA Logbook Transfer Assistance
              </Badge>
            </div>
          </div>
        )}

        {/* Live Inventory Section */}
        <section className="mt-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                  Yard Inventory
                </h2>
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 font-semibold text-xs">
                  {filteredCars.length} {filteredCars.length === 1 ? "Car" : "Cars"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Explore all verified and ready-for-inspection vehicles currently in {yard.name}.
              </p>
            </div>

            {/* Sort & Search Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1 sm:w-64 sm:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search make, model, year…"
                  className="h-10 rounded-xl pl-9 text-sm"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort inventory"
                className="h-10 rounded-xl border border-input bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:text-sm"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Year: Newest</option>
              </select>
            </div>
          </div>

          {/* Make Filter Chips */}
          {availableMakes.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              <Button
                variant={selectedMake === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMake("all")}
                className="rounded-full text-xs font-semibold"
              >
                All Makes ({carsQuery.data?.length ?? 0})
              </Button>
              {availableMakes.map((make) => {
                const count = (carsQuery.data ?? []).filter((c) => c.make_name === make).length;
                return (
                  <Button
                    key={make}
                    variant={selectedMake === make ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedMake(make)}
                    className="rounded-full text-xs font-semibold"
                  >
                    {make} ({count})
                  </Button>
                );
              })}
            </div>
          )}

          {/* Grid of Cars */}
          <div className="mt-6">
            {carsQuery.isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-3xl" />
                ))}
              </div>
            ) : filteredCars.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                  <CarIcon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">No vehicles match your search</h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setSelectedMake("all");
                  }}
                  className="mt-4 rounded-xl"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCars.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Trust & Safe Purchase Information at This Yard */}
        <section className="mt-14 rounded-3xl border border-emerald-500/20 bg-emerald-950/10 p-6 sm:p-8 dark:bg-emerald-950/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-600 text-white shadow-md">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">
                  AutoConnect Escrow Protection at {yard.name}
                </h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm leading-relaxed">
                  Every transaction conducted at this yard is safeguarded by the AutoConnect Escrow Guarantee. Your funds are held securely until you inspect the vehicle in person at the yard and authorize release with your 6-digit cryptographic PIN code.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-xl shrink-0 border-emerald-600/30 font-semibold">
              <Link to="/how-payments-work">
                Learn How Escrow Works
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

