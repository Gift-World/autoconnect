import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Search, Store, ShieldCheck, Star, ArrowRight, Car as CarIcon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { countryByCode, COUNTRIES } from "@/lib/countries";
import { DEMO_YARDS, DEMO_CARS } from "@/lib/demo-inventory";
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

      if (!error && data && data.length > 0) {
        return data as unknown as YardRow[];
      }

      // Fallback to demo yards
      return DEMO_YARDS as unknown as YardRow[];
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

      // Add demo car counts if any yard has 0
      for (const dc of DEMO_CARS) {
        if (dc.yard_id) {
          map[dc.yard_id] = (map[dc.yard_id] ?? 0) + 1;
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
      return `${y.name} ${y.city ?? ""} ${y.tagline ?? ""}`
        .toLowerCase()
        .includes(term);
    });
  }, [yardsQuery.data, q, country]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary">
          <Store className="h-3.5 w-3.5" /> Verified Car Yards & Dealerships
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Shop by car yard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base leading-relaxed">
          Prefer purchasing directly from established dealerships? Explore accredited yards to view full inventory, on-site diagnostics bays, verified inspection records, and physical viewing appointments.
        </p>
      </header>

      {/* Filter and Search Bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search yards by name, city, or specialty…"
            className="h-11 rounded-2xl pl-10 text-sm shadow-sm"
          />
        </div>
        <Select
          value={country || "all"}
          onValueChange={(v) => setCountry(v === "all" ? "" : v)}
        >
          <SelectTrigger className="h-11 w-52 rounded-2xl shadow-sm text-sm font-medium">
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

      {yardsQuery.isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : yards.length === 0 ? (
        <EmptyState
          icon={<Store className="h-6 w-6" />}
          title="No car yards found"
          description="Try adjusting your search criteria or switch to another country filter."
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {yards.map((y, idx) => {
            const c = countryByCode(y.country);
            const count = countsQuery.data?.[y.id] ?? (y.slug === "nairobi-hub" ? 6 : y.slug === "mombasa-port-hub" ? 4 : 3);
            const coverUrl = y.cover_url || FALLBACK_COVERS[idx % FALLBACK_COVERS.length];

            return (
              <Link
                key={y.id}
                to="/yards/$slug"
                params={{ slug: y.slug }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                {/* Cover Image Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <img
                    src={coverUrl}
                    alt={`${y.name} car yard`}
                    loading="lazy"
                    className="h-full w-full object-cover brightness-95 transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_COVERS[0];
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {y.is_featured && (
                      <Badge className="border-0 bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500">
                        <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                      </Badge>
                    )}
                    <Badge variant="secondary" className="border-0 bg-black/60 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                      {c?.flag} {c?.name ?? y.country}
                    </Badge>
                  </div>

                  {/* Stock count badge on image */}
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {count} {count === 1 ? "Vehicle" : "Vehicles"} In Stock
                  </div>
                </div>

                {/* Yard Details */}
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start gap-3.5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-border bg-background shadow-sm">
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
                        <Store className="h-6 w-6 text-primary" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate font-display text-lg font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                          {y.name}
                        </h2>
                      </div>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        {y.city ? `${y.city}, ` : ""}
                        {c?.name ?? y.country}
                      </p>
                    </div>
                  </div>

                  {y.tagline && (
                    <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {y.tagline}
                    </p>
                  )}

                  <div className="mt-auto pt-5 flex items-center justify-between border-t border-border/60">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
                    </span>
                    <span className="inline-flex items-center text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                      View Inventory <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

