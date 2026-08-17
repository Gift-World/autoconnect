import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Globe,
  ShieldCheck,
  Search,
  ArrowRight,
  MapPin,
  Sparkles,
  Lock,
  FileCheck,
  BadgeCheck,
  Eye,
  Car as CarIcon,
  Truck,
  Bus,
  Bike,
  Star,
  Quote,
  ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, countryByCode } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CarCard, CarCardSkeleton, type CarCardData } from "@/components/CarCard";
import { useCountUp } from "@/hooks/use-count-up";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AutoConnect — Buy and Import Cars, Worldwide" },
      {
        name: "description",
        content:
          "The trusted marketplace for cars worldwide. Verified sellers, secure escrow payments, AI-powered search, zero brokers.",
      },
      { property: "og:title", content: "AutoConnect — Buy and Import Cars, Worldwide" },
      {
        property: "og:description",
        content:
          "The trusted marketplace for cars worldwide. Verified sellers, secure escrow payments, AI-powered search.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <Hero />
      <LiveStats />
      <FeaturedSection />
      <FeaturedYards />
      <BrowseByCountry />
      <BrowseByCategory />
      <HowItWorks />
      <AISmartSearch />
      <TrustSection />
      <ImportCorridors />
      <Testimonials />
      <RecentListings />
      <FinalCTA />
    </div>
  );
}

/* ============================================================
 * HERO — tabbed mega-search, animated headline, trust badges
 * ============================================================ */
const HERO_IMG =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=2000&q=80";

type HeroTab = "buy" | "import" | "sell";

function Hero() {
  const [tab, setTab] = useState<HeroTab>("buy");
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${HERO_IMG})` }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.18 0.03 254 / 0.92) 0%, oklch(0.22 0.18 264 / 0.78) 100%)",
        }}
      />

      <div className="relative mx-auto flex min-h-[88vh] max-w-[1280px] flex-col justify-center px-4 py-20 text-white sm:px-6 sm:py-28">
        <span
          className="animate-fade-up inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur"
          style={{ animationDelay: "0ms" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          Trusted by 50,000+ buyers worldwide
        </span>

        <h1 className="font-display mt-6 text-fluid-hero">
          <span className="animate-word-in inline-block" style={{ animationDelay: "80ms" }}>
            Buy.
          </span>{" "}
          <span className="animate-word-in inline-block" style={{ animationDelay: "200ms" }}>
            Sell.
          </span>{" "}
          <span
            className="animate-word-in inline-block text-accent"
            style={{ animationDelay: "320ms" }}
          >
            Import.
          </span>
          <br />
          <span
            className="animate-word-in font-serif-display inline-block italic"
            style={{ animationDelay: "480ms" }}
          >
            Cars, worldwide.
          </span>
        </h1>

        <p
          className="animate-fade-up mt-6 max-w-2xl text-lg text-white/85"
          style={{ animationDelay: "640ms" }}
        >
          The trusted marketplace that puts you in control. Verified sellers,
          secure escrow payments, AI-powered search, zero brokers.
        </p>

        {/* Mega search bar */}
        <div
          className="animate-fade-up mt-10 w-full max-w-4xl"
          style={{ animationDelay: "800ms" }}
        >
          {/* Tabs */}
          <div className="flex gap-1.5">
            {[
              { id: "buy" as const, label: "Buy a Car" },
              { id: "import" as const, label: "Import a Car" },
              { id: "sell" as const, label: "Sell My Car" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-t-2xl px-5 py-2.5 text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-white text-primary shadow-card"
                    : "bg-white/15 text-white/90 backdrop-blur hover:bg-white/25"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search row */}
          <div className="rounded-2xl rounded-tl-none bg-white p-3 shadow-modal sm:p-4">
            {tab === "buy" && <BuyTab onSubmit={() => navigate({ to: "/cars" })} />}
            {tab === "import" && (
              <ImportTab onSubmit={() => navigate({ to: "/import" })} />
            )}
            {tab === "sell" && (
              <SellTab onSubmit={() => navigate({ to: "/register" })} />
            )}
          </div>
        </div>

        {/* Trust row */}
        <ul
          className="animate-fade-up mt-10 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"
          style={{ animationDelay: "960ms" }}
        >
          {[
            { v: "5,000+", l: "Verified Listings" },
            { v: "120+", l: "Countries Active" },
            { v: "Escrow", l: "Secure Payments" },
            { v: "AI", l: "Smart Matching" },
          ].map((t) => (
            <li
              key={t.l}
              className="flex items-baseline gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur"
            >
              <span className="text-base font-bold text-accent tabular">{t.v}</span>
              <span className="text-xs font-medium text-white/85">{t.l}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function BuyTab({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_160px_140px_160px_auto]">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Location"
          className="h-12 border-0 bg-secondary pl-9 text-foreground shadow-none focus-visible:ring-0"
        />
      </div>
      <Select>
        <SelectTrigger className="h-12 border-0 bg-secondary text-foreground">
          <SelectValue placeholder="Make" />
        </SelectTrigger>
        <SelectContent>
          {["Toyota", "Nissan", "BMW", "Mercedes-Benz", "Subaru", "Honda", "Ford"].map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger className="h-12 border-0 bg-secondary text-foreground">
          <SelectValue placeholder="Body" />
        </SelectTrigger>
        <SelectContent>
          {["sedan", "suv", "hatchback", "pickup", "van", "coupe"].map((m) => (
            <SelectItem key={m} value={m} className="capitalize">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Max price"
        type="number"
        className="h-12 border-0 bg-secondary text-foreground shadow-none focus-visible:ring-0"
      />
      <Button
        onClick={onSubmit}
        size="lg"
        className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 btn-press"
      >
        <Search className="mr-2 h-4 w-4" /> Search
      </Button>
    </div>
  );
}

function ImportTab({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
      <Select>
        <SelectTrigger className="h-12 border-0 bg-secondary text-foreground">
          <SelectValue placeholder="Destination" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.slice(0, 20).map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input placeholder="Car make" className="h-12 border-0 bg-secondary text-foreground" />
      <Input placeholder="Budget" type="number" className="h-12 border-0 bg-secondary text-foreground" />
      <Select>
        <SelectTrigger className="h-12 border-0 bg-secondary text-foreground">
          <SelectValue placeholder="From" />
        </SelectTrigger>
        <SelectContent>
          {["JP", "DE", "GB", "US", "KR"].map((code) => {
            const c = COUNTRIES.find((x) => x.code === code)!;
            return (
              <SelectItem key={code} value={code}>
                {c.flag} {c.name}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Button
        onClick={onSubmit}
        size="lg"
        className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 btn-press"
      >
        Get Quotes
      </Button>
    </div>
  );
}

function SellTab({ onSubmit }: { onSubmit: () => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
      <Input placeholder="Make" className="h-12 border-0 bg-secondary text-foreground" />
      <Input placeholder="Model" className="h-12 border-0 bg-secondary text-foreground" />
      <Input placeholder="Year" type="number" className="h-12 border-0 bg-secondary text-foreground" />
      <Button
        onClick={onSubmit}
        size="lg"
        className="h-12 bg-accent text-accent-foreground hover:bg-accent/90 btn-press"
      >
        Get Free Valuation
      </Button>
    </div>
  );
}

/* ============================================================
 * LIVE STATS BAR — animated counters
 * ============================================================ */
function LiveStats() {
  const stats = [
    { end: 5247, label: "Cars Listed", suffix: "+" },
    { end: 124, label: "Countries", suffix: "" },
    { end: 1892, label: "Successful Sales", suffix: "+" },
    { end: 9.7, label: "Avg Buyer Rating", suffix: "/10", decimal: true },
  ];
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:py-16">
        {stats.map((s) => (
          <StatItem key={s.label} {...s} />
        ))}
      </div>
    </section>
  );
}

function StatItem({
  end,
  label,
  suffix,
  decimal,
}: {
  end: number;
  label: string;
  suffix: string;
  decimal?: boolean;
}) {
  const target = decimal ? Math.round(end * 10) : end;
  const [ref, val] = useCountUp(target, 1800);
  const display = decimal ? (val / 10).toFixed(1) : val.toLocaleString();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="text-center sm:text-left">
      <p className="font-display text-fluid-h1 text-accent tabular">
        {display}
        <span className="text-3xl">{suffix}</span>
      </p>
      <p className="mt-1 text-sm font-medium text-primary-foreground/70">{label}</p>
    </div>
  );
}

/* ============================================================
 * FEATURED CARS
 * ============================================================ */
function FeaturedSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["featured_cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,featured,mileage,mileage_unit,transmission,fuel_type,car_images(image_url,is_primary,sort_order)",
        )
        .eq("status", "approved")
        .eq("featured", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as CarCardData[];
    },
    staleTime: 60_000,
  });

  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <SectionHeader
        eyebrow="Hand-picked"
        title="Featured Cars"
        subtitle="The best deals across our global marketplace, verified and ready to ship."
        link={{ to: "/cars", label: "View all cars" }}
      />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)
          : (data ?? []).map((c) => <CarCard key={c.id} car={c} />)}
        {!isLoading && (!data || data.length === 0) && (
          <p className="col-span-full text-center text-sm text-muted-foreground">
            No featured listings yet.
          </p>
        )}
      </div>
    </section>
  );
}

/* ============================================================
 * BROWSE BY COUNTRY
 * ============================================================ */
function FeaturedYards() {
  const { data, isLoading } = useQuery({
    queryKey: ["home_yards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_yards")
        .select("id,slug,name,tagline,logo_url,cover_url,country,city")
        .eq("is_approved", true)
        .eq("is_suspended", false)
        .order("is_featured", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        slug: string;
        name: string;
        tagline: string | null;
        logo_url: string | null;
        cover_url: string | null;
        country: string;
        city: string | null;
      }[];
    },
    staleTime: 60_000,
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
        <SectionHeader
          eyebrow="Trusted dealerships"
          title="Shop by car yard"
          subtitle="Buy from established yards — see their whole inventory, location and opening hours in one place."
          link={{ to: "/yards", label: "All car yards" }}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))
            : (data ?? []).map((y) => (
                <Link
                  key={y.id}
                  to="/yards/$slug"
                  params={{ slug: y.slug }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card card-lift"
                >
                  <div className="h-24 overflow-hidden bg-muted">
                    {y.cover_url ? (
                      <img
                        src={y.cover_url}
                        alt={`${y.name} car yard`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent/15" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold">{y.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {countryByCode(y.country)?.flag}{" "}
                      {y.city ? `${y.city}, ` : ""}
                      {countryByCode(y.country)?.name ?? y.country}
                    </p>
                    {y.tagline && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {y.tagline}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

function BrowseByCountry() {
  const { data } = useQuery({
    queryKey: ["countries_with_listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("country")
        .eq("status", "approved");
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const r of data ?? []) {
        counts.set(r.country, (counts.get(r.country) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([code, count]) => ({
          code,
          count,
          country: COUNTRIES.find((c) => c.code === code),
        }))
        .filter((x) => x.country)
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
    staleTime: 5 * 60_000,
  });

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
        <SectionHeader
          eyebrow="Worldwide"
          title="Browse by country"
          subtitle="Verified sellers from every major market on the planet."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(data && data.length > 0 ? data : COUNTRIES.slice(0, 12).map((c) => ({ code: c.code, country: c, count: 0 }))).map(
            (item) => (
              <Link
                key={item.code}
                to="/cars"
                className="group relative flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card card-lift"
              >
                <span className="text-2xl">{item.country!.flag}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {item.country!.name}
                  </p>
                  <p className="text-xs text-muted-foreground tabular">
                    {item.count} {item.count === 1 ? "car" : "cars"}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-accent" />
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * BROWSE BY CATEGORY (body type)
 * ============================================================ */
function BrowseByCategory() {
  const cats = [
    { id: "sedan", label: "Sedan", icon: CarIcon },
    { id: "suv", label: "SUV", icon: CarIcon },
    { id: "hatchback", label: "Hatchback", icon: CarIcon },
    { id: "pickup", label: "Pickup", icon: Truck },
    { id: "van", label: "Van", icon: Bus },
    { id: "coupe", label: "Coupe", icon: CarIcon },
    { id: "convertible", label: "Convertible", icon: CarIcon },
    { id: "bus", label: "Bus", icon: Bus },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <SectionHeader
        eyebrow="By type"
        title="Find your style"
        subtitle="From family SUVs to weekend convertibles."
      />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-4">
        {cats.map((c) => (
          <Link
            key={c.id}
            to="/cars"
            className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-card card-lift transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <c.icon className="h-8 w-8 text-primary transition group-hover:text-primary-foreground" />
            <p className="text-sm font-bold">{c.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * HOW IT WORKS
 * ============================================================ */
const FLOWS = {
  buy: [
    { title: "Browse", body: "Filter thousands of verified listings worldwide." },
    { title: "Verify Seller", body: "Every seller is ID-verified before listing." },
    { title: "Secure Payment", body: "Pay through escrow — funds held until delivery." },
    { title: "Drive Away", body: "Receive the car or take delivery anywhere." },
  ],
  import: [
    { title: "Submit Request", body: "Tell us the exact car you want." },
    { title: "Get Matched", body: "We connect you with vetted exporters." },
    { title: "Escrow Payment", body: "Your funds are protected end-to-end." },
    { title: "Receive Car", body: "We handle shipping, customs, last-mile." },
  ],
  sell: [
    { title: "List Your Car", body: "AI helps write the perfect listing." },
    { title: "Get Verified", body: "Quick identity check builds buyer trust." },
    { title: "Receive Offers", body: "Chat directly with verified buyers." },
    { title: "Get Paid", body: "Funds released the moment delivery is confirmed." },
  ],
} as const;

function HowItWorks() {
  const [tab, setTab] = useState<keyof typeof FLOWS>("buy");
  const tabs: { id: keyof typeof FLOWS; label: string }[] = [
    { id: "buy", label: "Buying Locally" },
    { id: "import", label: "Importing a Car" },
    { id: "sell", label: "Selling a Car" },
  ];
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
        <SectionHeader eyebrow="How it works" title="Built for trust at every step" />
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-card"
                  : "bg-card text-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative mt-10 grid gap-6 lg:grid-cols-4">
          {FLOWS[tab].map((step, i) => (
            <div
              key={step.title}
              className="animate-fade-up relative rounded-2xl border border-border bg-card p-6 shadow-card"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-accent text-lg text-accent-foreground">
                {i + 1}
              </div>
              <h3 className="mt-4 text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * AI SMART SEARCH — placeholder (wired in Phase C)
 * ============================================================ */
function AISmartSearch() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const examples = [
    "Family SUV under $20k, low mileage, automatic",
    "Reliable Japanese sedan with sunroof",
    "Diesel pickup, 4x4, under 80k km",
  ];
  return (
    <section
      className="relative overflow-hidden text-primary-foreground"
      style={{ background: "var(--primary)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, var(--accent) 0%, transparent 35%), radial-gradient(circle at 80% 80%, oklch(0.55 0.18 264) 0%, transparent 40%)",
        }}
      />
      <div className="relative mx-auto max-w-[1280px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> AI-Powered
          </span>
          <h2 className="font-display mt-5 text-fluid-h1">
            Describe the car you want.{" "}
            <span className="font-serif-display italic text-accent">Our AI finds it.</span>
          </h2>
          <p className="mt-4 text-base text-white/75">
            Skip the filters. Just tell us what you need.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/cars" });
            }}
            className="mt-8 flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-modal sm:flex-row"
          >
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. spacious family SUV under $25k, low mileage, automatic, good on fuel..."
              className="h-14 flex-1 border-0 bg-transparent text-base text-foreground shadow-none focus-visible:ring-0"
            />
            <Button
              type="submit"
              size="lg"
              className="h-14 bg-accent px-7 text-accent-foreground hover:bg-accent/90 btn-press"
            >
              <Sparkles className="mr-2 h-4 w-4" /> Search with AI
            </Button>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setQ(ex)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/15"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * TRUST & SECURITY
 * ============================================================ */
function TrustSection() {
  const items = [
    {
      icon: BadgeCheck,
      title: "Verified Sellers",
      body: "Every seller is identity-verified before they can list a car.",
    },
    {
      icon: Lock,
      title: "Secure Escrow",
      body: "Your payment is held safely until you receive your car.",
    },
    {
      icon: FileCheck,
      title: "Document Verification",
      body: "Logbooks, import docs, and inspection reports — all verified.",
    },
    {
      icon: Eye,
      title: "AI Fraud Detection",
      body: "Our AI flags suspicious listings before they reach you.",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <SectionHeader
        eyebrow="Trust & Safety"
        title="Built for serious buyers and sellers"
        subtitle="Four layers of protection on every transaction."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <div
            key={it.title}
            className={`rounded-2xl border border-border p-7 shadow-card card-lift ${
              i % 2 === 0 ? "bg-card" : "bg-secondary"
            }`}
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
              <it.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-lg font-bold text-foreground">{it.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * IMPORT CORRIDORS
 * ============================================================ */
function ImportCorridors() {
  const routes = [
    { from: "JP", to: "KE", cars: "Toyota, Subaru, Nissan", price: "$5k–$25k", weeks: "6–8 wks" },
    { from: "DE", to: "AE", cars: "BMW, Mercedes, Audi", price: "$20k–$120k", weeks: "4–6 wks" },
    { from: "US", to: "NG", cars: "Ford, Jeep, Chevy", price: "$8k–$40k", weeks: "8–10 wks" },
    { from: "GB", to: "GH", cars: "Land Rover, Mini, Vauxhall", price: "$10k–$60k", weeks: "6–8 wks" },
  ];
  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
        <SectionHeader
          eyebrow="Global routes"
          title="Popular import corridors"
          subtitle="The lanes our buyers use every week."
          link={{ to: "/import", label: "Start import request" }}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {routes.map((r) => {
            const from = COUNTRIES.find((c) => c.code === r.from)!;
            const to = COUNTRIES.find((c) => c.code === r.to)!;
            return (
              <Link
                key={r.from + r.to}
                to="/import"
                className="group block rounded-2xl border border-border bg-card p-6 shadow-card card-lift"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-2xl">
                    <span>{from.flag}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-accent" />
                    <span>{to.flag}</span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-bold text-foreground">
                  {from.name} → {to.name}
                </p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Top:</span> {r.cars}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Range:</span>{" "}
                    <span className="tabular">{r.price}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Shipping:</span> {r.weeks}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * TESTIMONIALS
 * ============================================================ */
function Testimonials() {
  const items = [
    {
      name: "Amaka O.",
      country: "🇳🇬",
      quote:
        "Imported a Camry from Japan to Lagos. The escrow gave me peace of mind — funds only released after I drove the car home.",
      grad: "from-[oklch(0.7_0.18_30)] to-[oklch(0.55_0.2_15)]",
    },
    {
      name: "James K.",
      country: "🇰🇪",
      quote:
        "Sold my Harrier in 9 days. The AI listing assistant wrote the description better than I ever could.",
      grad: "from-[oklch(0.65_0.2_180)] to-[oklch(0.5_0.2_220)]",
    },
    {
      name: "Sara L.",
      country: "🇦🇪",
      quote:
        "Found my dream G-Wagon listed by a verified Dubai seller. The whole flow felt like Airbnb for cars.",
      grad: "from-[oklch(0.7_0.18_290)] to-[oklch(0.5_0.22_310)]",
    },
  ];
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <SectionHeader
        eyebrow="Real buyers"
        title="Trusted on every continent"
      />
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {items.map((t) => (
          <figure
            key={t.name}
            className="rounded-2xl border border-border bg-card p-7 shadow-card card-lift"
          >
            <Quote className="h-7 w-7 text-accent" />
            <blockquote className="mt-4 text-base leading-relaxed text-foreground">
              "{t.quote}"
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <div
                className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${t.grad} font-bold text-white`}
              >
                {t.name[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {t.name} <span>{t.country}</span>
                </p>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                  ))}
                </div>
              </div>
            </div>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
 * RECENT LISTINGS
 * ============================================================ */
function RecentListings() {
  const { data, isLoading } = useQuery({
    queryKey: ["recent_cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,featured,mileage,mileage_unit,transmission,fuel_type,car_images(image_url,is_primary,sort_order)",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as CarCardData[];
    },
    staleTime: 60_000,
  });

  return (
    <section className="bg-secondary/60">
      <div className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
        <SectionHeader
          eyebrow="Just listed"
          title="Fresh on the marketplace"
          link={{ to: "/cars", label: "Browse all" }}
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CarCardSkeleton key={i} />)
            : (data ?? []).map((c) => <CarCard key={c.id} car={c} />)}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * FINAL CTA
 * ============================================================ */
function FinalCTA() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 py-20 sm:px-6">
      <div
        className="relative overflow-hidden rounded-3xl bg-primary p-10 text-center text-primary-foreground sm:p-16"
        style={{ boxShadow: "0 24px 64px rgba(15, 23, 42, 0.18)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, var(--accent) 0%, transparent 40%), radial-gradient(circle at 70% 80%, oklch(0.55 0.18 264) 0%, transparent 45%)",
          }}
        />
        <div className="relative">
          <ShieldCheck className="mx-auto h-10 w-10 text-accent" />
          <h2 className="font-display mt-5 text-fluid-h1">
            Ready to find your next car?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-primary-foreground/80">
            Browse thousands of verified listings or list your own in under 3 minutes.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 bg-accent px-8 text-accent-foreground hover:bg-accent/90 btn-press"
            >
              <Link to="/cars">
                Browse Cars <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-white/5 px-8 text-white hover:bg-white/15"
            >
              <Link to="/seller">List Your Car</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * Shared
 * ============================================================ */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  link,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display mt-2 text-fluid-h2 text-foreground">{title}</h2>
        {subtitle && (
          <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {link && (
        <Link
          to={link.to as never}
          className="group inline-flex items-center gap-1 text-sm font-bold text-accent"
        >
          {link.label}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

