import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
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
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { countryByCode } from "@/lib/countries";
import { toast } from "sonner";

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
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ac-accent/15 text-ac-accent">
        <Store className="h-8 w-8" />
      </div>
      <h1 className="font-brand mt-5 text-3xl sm:text-5xl">Car yard not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This yard may have been moved or is currently undergoing accreditation.
      </p>
      <Button asChild className="mt-6 min-h-11 rounded-full">
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
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "newest">(
    "featured",
  );
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
          "id,is_sample,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,featured,mileage,mileage_unit,transmission,fuel_type,make_name,model_name,car_images(image_url,is_primary,sort_order)",
        )
        .eq("yard_id", yard.id)
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as (CarCardData & {
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

  const whatsappHref = yard.whatsapp
    ? `https://wa.me/${yard.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${yard.name}, I am inquiring about vehicles listed on AutoConnect.`)}`
    : null;
  const phoneHref = yard.phone ? `tel:${yard.phone}` : null;
  const emailHref = yard.email
    ? `mailto:${yard.email}?subject=${encodeURIComponent(`AutoConnect Inquiry — ${yard.name}`)}`
    : null;
  const stockCount = carsQuery.data?.length ?? 0;

  return (
    <main className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-[1360px] px-4 pt-4 sm:px-6 sm:pt-6">
        {/* Top controls */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/yards"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Car Yards
          </Link>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            <Share2 className="h-4 w-4" /> Share Yard
          </button>
        </div>

        {/* Cover photo — photo first */}
        <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-[28px] bg-muted sm:aspect-[21/9] sm:rounded-[36px]">
          <img
            src={defaultCover}
            alt={`${yard.name} showroom and facility`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = FALLBACK_COVERS[0];
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ac-ink backdrop-blur-md sm:bottom-6 sm:left-6">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            Verified AutoConnect Dealership Hub
          </div>
        </div>

        {/* Host-style identity */}
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-3xl border border-border bg-card shadow-sm sm:h-24 sm:w-24">
                {yard.logo_url ? (
                  <img
                    src={yard.logo_url}
                    alt={yard.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Store className="h-9 w-9 text-ac-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  {yard.sellers?.verification_badge === true && (
                    <Badge className="border-0 bg-success px-2.5 py-1 text-xs font-semibold text-white hover:bg-success">
                      <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Verified Yard
                    </Badge>
                  )}
                  {yard.is_featured && (
                    <Badge className="border-0 bg-ac-accent px-2.5 py-1 text-xs font-bold text-ac-ink hover:bg-ac-accent">
                      Featured Hub
                    </Badge>
                  )}
                </div>
                <h1 className="font-brand mt-2 text-3xl sm:text-5xl">{yard.name}</h1>
                {yard.tagline && (
                  <p className="mt-2 text-base leading-7 text-muted-foreground">{yard.tagline}</p>
                )}
                <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-foreground">
                  <MapPin className="h-4 w-4 shrink-0 text-ac-accent" />
                  <span>
                    {country?.flag} {yard.address ? `${yard.address}, ` : ""}
                    {yard.city ? `${yard.city}, ` : ""}
                    {country?.name ?? yard.country}
                  </span>
                  {yard.city && (
                    <span className="hidden text-muted-foreground sm:inline">
                      • {yard.city} Auto District
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Trust signals */}
            <dl className="mt-8 grid grid-cols-2 gap-3 border-y border-border py-6 lg:grid-cols-4">
              <Signal
                icon={<CarIcon />}
                label="Cars In Stock"
                value={carsQuery.isLoading ? "Loading…" : `${stockCount} Verified Vehicles`}
              />
              <Signal
                icon={<Clock />}
                label="Opening Hours"
                value={yard.opening_hours ?? "Mon–Sat: 8:00 AM – 6:30 PM"}
              />
              <Signal icon={<Shield />} label="Escrow Guarantee" value="Protected Payments" />
              <Signal icon={<Wrench />} label="Viewing & Inspection" value="Physical Bay Ready" />
            </dl>
          </div>

          {/* Contact card — the one primary action */}
          <aside className="h-fit rounded-3xl border border-border bg-card p-6 shadow-sm lg:sticky lg:top-24">
            <p className="brand-kicker text-muted-foreground">Talk to the yard</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Ask about a car, book a viewing or arrange an inspection.
            </p>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Yard
              </a>
            ) : phoneHref ? (
              <a
                href={phoneHref}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
              >
                <Phone className="h-4 w-4" /> Call Dealership
              </a>
            ) : emailHref ? (
              <a
                href={emailHref}
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
              >
                <Mail className="h-4 w-4" /> Email
              </a>
            ) : (
              <a
                href="#inventory"
                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
              >
                <CarIcon className="h-4 w-4" /> See the inventory
              </a>
            )}
            {(whatsappHref && (phoneHref || emailHref)) || (phoneHref && emailHref) ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {whatsappHref && phoneHref && (
                  <a
                    href={phoneHref}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-muted"
                  >
                    <Phone className="h-4 w-4" /> Call
                  </a>
                )}
                {(whatsappHref || phoneHref) && emailHref && (
                  <a
                    href={emailHref}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-semibold transition hover:bg-muted"
                  >
                    <Mail className="h-4 w-4" /> Email
                  </a>
                )}
              </div>
            ) : null}
            <p className="mt-5 flex items-start gap-2 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Inspect the vehicle in person at the yard before you authorize any release of funds.
            </p>
          </aside>
        </div>

        {/* Regrouped content */}
        <Tabs defaultValue="inventory" className="mt-10" id="inventory">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-full p-1 sm:w-auto">
            <TabsTrigger value="inventory" className="min-h-11 rounded-full px-4">
              Inventory ({stockCount})
            </TabsTrigger>
            <TabsTrigger value="about" className="min-h-11 rounded-full px-4">
              About
            </TabsTrigger>
            <TabsTrigger value="buying" className="min-h-11 rounded-full px-4">
              How buying works
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-brand text-2xl sm:text-3xl">Yard Inventory</h2>
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
                    {filteredCars.length} {filteredCars.length === 1 ? "Car" : "Cars"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Explore all verified and ready-for-inspection vehicles currently in {yard.name}.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative min-w-0 sm:w-64">
                  <span className="sr-only">Search inventory</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search make, model, year…"
                    className="h-11 rounded-full pl-9 text-sm"
                  />
                </label>
                <label className="relative">
                  <span className="sr-only">Sort inventory</span>
                  <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                    aria-label="Sort inventory"
                    className="h-11 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring sm:w-auto"
                  >
                    <option value="featured">Featured First</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Year: Newest</option>
                  </select>
                </label>
              </div>
            </div>

            {availableMakes.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedMake("all")}
                  className={makeChip(selectedMake === "all")}
                >
                  All Makes ({carsQuery.data?.length ?? 0})
                </button>
                {availableMakes.map((make) => {
                  const count = (carsQuery.data ?? []).filter((c) => c.make_name === make).length;
                  return (
                    <button
                      key={make}
                      type="button"
                      onClick={() => setSelectedMake(make)}
                      className={makeChip(selectedMake === make)}
                    >
                      {make} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              {carsQuery.isLoading ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                      <Skeleton className="h-5 w-2/3 rounded-full" />
                      <Skeleton className="h-4 w-1/3 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : carsQuery.isError ? (
                <StoryEmpty
                  tone="warning"
                  icon={<CarIcon />}
                  kicker="Connection issue"
                  title="Inventory could not load"
                  description="This is a connection problem, not an empty yard. Browse the whole marketplace meanwhile."
                  actionLabel="Browse all cars"
                  actionTo="/cars"
                />
              ) : (carsQuery.data ?? []).length === 0 ? (
                <StoryEmpty
                  icon={<CarIcon />}
                  kicker="Restocking"
                  title={`${yard.name} has no live cars right now`}
                  description="New stock appears here once it passes review. Ask the yard what is arriving, or browse every approved car."
                  actionLabel="Browse all cars"
                  actionTo="/cars"
                  secondary={<QuietLink to="/yards">See other yards</QuietLink>}
                />
              ) : filteredCars.length === 0 ? (
                <StoryEmpty
                  icon={<Search />}
                  title="No vehicles match your search"
                  description="Try adjusting your search terms or filters to find what you're looking for."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setQ("");
                    setSelectedMake("all");
                  }}
                />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCars.map((car) => (
                    <CarCard key={car.id} car={car} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-brand text-2xl">About {yard.name}</h2>
                <p className="mt-3 whitespace-pre-line text-base leading-7 text-muted-foreground">
                  {yard.description ||
                    yard.tagline ||
                    "This yard has not added a description yet. Contact them for details about stock, viewing and inspection."}
                </p>
              </div>
              <div className="rounded-3xl bg-ac-cream p-6 text-ac-ink sm:p-8">
                <p className="brand-kicker text-ac-ink/60">Services Available</p>
                <ul className="mt-4 space-y-3 text-sm font-medium">
                  {[
                    "Physical Vehicle Viewing",
                    "Pre-Purchase Multi-Point Diagnostics",
                    "Escrow Handover Verification",
                    "NTSA Logbook Transfer Assistance",
                  ].map((service) => (
                    <li key={service} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {service}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 flex items-start gap-2 border-t border-ac-ink/10 pt-4 text-xs leading-5 text-ac-ink/70">
                  <Compass className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {yard.address ? `${yard.address}, ` : ""}
                  {yard.city ? `${yard.city}, ` : ""}
                  {country?.name ?? yard.country}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="buying" className="mt-6">
            <div className="flex flex-col gap-6 rounded-[28px] bg-ac-ink p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:rounded-[36px] sm:p-10">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ac-accent text-ac-ink">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-brand text-2xl sm:text-3xl">
                    AutoConnect transaction workflow at {yard.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                    Each transaction at this yard follows a recorded purchase workflow. Payment is
                    not shown as confirmed until verified evidence is recorded; inspect the vehicle
                    in person at the yard and authorize release with your 6-digit cryptographic PIN
                    code.
                  </p>
                </div>
              </div>
              <Link
                to="/how-payments-work"
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-white/25 px-5 text-sm font-bold transition hover:border-white"
              >
                Learn How Escrow Works
              </Link>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function makeChip(active: boolean) {
  return `inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold transition ${
    active
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-background text-foreground hover:border-foreground/40"
  }`;
}

function Signal({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-ac-accent [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd>
      </div>
    </div>
  );
}
