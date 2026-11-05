import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  MapPin,
  Search,
  Store,
  ShieldCheck,
  Star,
  ArrowRight,
  Car as CarIcon,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";
import { countryByCode, COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1000&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1000&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1000&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80",
];

export const Route = createFileRoute("/yards/")({
  head: () => ({
    meta: [
      { title: "Car Yards — Browse Verified Dealerships | AutoConnect" },
      {
        name: "description",
        content:
          "Browse verified car yards and dealerships. Open a yard to see its full inventory, location, opening hours and contact details.",
      },
      { property: "og:title", content: "Car Yards — Browse Verified Dealerships" },
      {
        property: "og:description",
        content: "Explore trusted car yards and shop their full inventory in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: YardsPage,
});

export type YardRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  is_featured: boolean;
  sellers: { verification_badge: boolean } | null;
};

function YardsPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");

  const yardsQuery = useQuery({
    queryKey: ["yards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_yards")
        .select(
          "id,slug,name,tagline,logo_url,cover_url,country,city,is_featured,sellers(verification_badge)",
        )
        .eq("is_approved", true)
        .eq("is_suspended", false)
        .order("is_featured", { ascending: false })
        .order("name");

      if (error) throw error;
      return (data ?? []) as unknown as YardRow[];
    },
  });

  const countsQuery = useQuery({
    queryKey: ["yard-car-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("yard_id")
        .eq("status", "approved")
        .not("yard_id", "is", null);

      const map: Record<string, number> = {};
      if (!error && data) {
        for (const r of (data ?? []) as { yard_id: string }[]) {
          map[r.yard_id] = (map[r.yard_id] ?? 0) + 1;
        }
      }

      return map;
    },
  });

  const yards = useMemo(() => {
    const list = yardsQuery.data ?? [];
    const term = q.trim().toLowerCase();
    return list.filter((y) => {
      if (country && y.country !== country) return false;
      if (!term) return true;
      return `${y.name} ${y.city ?? ""} ${y.tagline ?? ""}`.toLowerCase().includes(term);
    });
  }, [yardsQuery.data, q, country]);

  const featured = (yardsQuery.data ?? []).filter((y) => y.is_featured).length;

  return (
    <main className="bg-background pb-20 text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          <img
            src={FALLBACK_COVERS[0]}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-50"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.95),rgba(11,19,36,.6)_60%,rgba(11,19,36,.4))]" />
          <div className="mx-auto max-w-[1360px] px-5 py-12 sm:px-10 sm:py-20 lg:py-24">
            <p className="brand-kicker inline-flex items-center gap-2 text-ac-accent">
              <Store className="h-4 w-4" /> Verified car yards &amp; dealerships
            </p>
            <h1 className="font-brand mt-5 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
              Meet the yard <span className="text-ac-accent">before you meet the car.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              Prefer purchasing directly from established dealerships? Explore accredited yards to
              view full inventory, on-site diagnostics bays, verified inspection records, and
              physical viewing appointments.
            </p>

            {/* Search */}
            <div className="mt-8 flex max-w-3xl flex-col gap-2 rounded-[22px] border border-white/15 bg-white/10 p-2 backdrop-blur-xl sm:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search yards</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search yards by name, city, or specialty…"
                  className="h-12 rounded-2xl border-0 bg-transparent pl-11 text-base text-white shadow-none placeholder:text-white/50 focus-visible:ring-0"
                />
              </label>
              <Select value={country || "all"} onValueChange={(v) => setCountry(v === "all" ? "" : v)}>
                <SelectTrigger
                  aria-label="Filter by country"
                  className="h-12 w-full rounded-2xl border-0 bg-white text-sm font-semibold text-ac-ink sm:w-56"
                >
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="mx-auto mt-6 grid max-w-[1360px] gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <TrustTile color="bg-ac-cream" icon={<ShieldCheck />} title="Approved yards only" text="Every yard here is approved and not suspended." />
        <TrustTile color="bg-ac-powder" icon={<CarIcon />} title="Full inventory" text="Open a yard to see every approved car it lists." />
        <TrustTile color="bg-ac-apricot" icon={<MapPin />} title="Visit in person" text="Location, hours and contact details on each profile." />
      </section>

      {/* Directory */}
      <section className="mx-auto mt-14 max-w-[1360px] px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="brand-kicker text-muted-foreground">Directory</p>
            <h2 className="font-brand mt-2 text-3xl sm:text-5xl">Shop by car yard</h2>
          </div>
          {!yardsQuery.isLoading && (
            <p className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
              {yards.length} {yards.length === 1 ? "yard" : "yards"}
              {featured > 0 && ` · ${featured} featured`}
            </p>
          )}
        </div>

        {yardsQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                <Skeleton className="h-5 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        ) : yardsQuery.isError ? (
          <StoryEmpty
            tone="warning"
            icon={<Store />}
            kicker="Connection issue"
            title="Car yards could not load"
            description="This is a connection problem, not an empty directory. Browse all cars while we reconnect."
            actionLabel="Browse all cars"
            actionTo="/cars"
          />
        ) : yards.length === 0 ? (
          <StoryEmpty
            icon={<Store />}
            kicker={q || country ? "No match" : "Opening soon"}
            title="No car yards found"
            description={
              q || country
                ? "Try adjusting your search criteria or switch to another country filter."
                : "Approved dealerships will appear here as they finish onboarding. Meanwhile, every approved car is on the marketplace."
            }
            actionLabel={q || country ? "Clear filters" : "Browse all cars"}
            onAction={
              q || country
                ? () => {
                    setQ("");
                    setCountry("");
                  }
                : undefined
            }
            actionTo={q || country ? undefined : "/cars"}
            secondary={<QuietLink to="/seller">List your yard</QuietLink>}
          />
        ) : (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {yards.map((y, idx) => {
              const c = countryByCode(y.country);
              const count = countsQuery.data?.[y.id];
              const coverUrl = y.cover_url || FALLBACK_COVERS[idx % FALLBACK_COVERS.length];

              return (
                <Link
                  key={y.id}
                  to="/yards/$slug"
                  params={{ slug: y.slug }}
                  className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                    <img
                      src={coverUrl}
                      alt={`${y.name} car yard`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = FALLBACK_COVERS[0];
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {y.is_featured && (
                        <Badge className="border-0 bg-ac-accent px-2.5 py-1 text-xs font-bold text-ac-ink hover:bg-ac-accent">
                          <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                        </Badge>
                      )}
                      <Badge
                        variant="secondary"
                        className="border-0 bg-white/90 px-2.5 py-1 text-xs font-semibold text-ac-ink"
                      >
                        {c?.flag} {c?.name ?? y.country}
                      </Badge>
                    </div>
                    {typeof count === "number" && (
                      <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                        {count} {count === 1 ? "Vehicle" : "Vehicles"} In Stock
                      </div>
                    )}
                    {/* Logo floats over the cover like a host avatar */}
                    <span className="absolute bottom-3 left-3 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-2 border-white bg-background shadow-lg">
                      {y.logo_url ? (
                        <img
                          src={y.logo_url}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Store className="h-6 w-6 text-ac-accent" />
                      )}
                    </span>
                  </div>

                  <div className="mt-4 px-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-brand min-w-0 truncate text-xl text-foreground">{y.name}</h3>
                      {y.sellers?.verification_badge && (
                        <ShieldCheck
                          className="mt-1 h-5 w-5 shrink-0 text-ac-accent"
                          aria-label="Verified seller"
                        />
                      )}
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {y.city ? `${y.city}, ` : ""}
                      {c?.name ?? y.country}
                    </p>
                    {y.tagline && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {y.tagline}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 text-success">
                        <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
                      </span>
                      <span className="inline-flex items-center text-foreground transition-transform group-hover:translate-x-0.5">
                        View Inventory <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* For dealers */}
      <section className="mx-auto mt-20 max-w-[1360px] px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-ac-stone p-6 text-ac-ink sm:flex-row sm:items-center sm:rounded-[36px] sm:p-10">
          <div>
            <p className="brand-kicker inline-flex items-center gap-2 text-ac-ink/60">
              <Sparkles className="h-4 w-4" /> For dealerships
            </p>
            <h2 className="font-brand mt-2 text-2xl sm:text-4xl">Run your yard on AutoConnect.</h2>
          </div>
          <Button asChild variant="outline" className="min-h-11 rounded-full border-ac-ink/25 bg-transparent text-ac-ink hover:bg-ac-ink hover:text-white">
            <Link to="/seller">Open the business portal</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function TrustTile({
  color,
  icon,
  title,
  text,
}: {
  color: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={`flex gap-3 rounded-3xl p-5 text-ac-ink ${color}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ac-ink text-ac-accent [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ac-ink/70">{text}</p>
      </div>
    </div>
  );
}
