import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MapPin, Search, Store, ShieldCheck, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { countryByCode, COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as { yard_id: string }[]) {
        map[r.yard_id] = (map[r.yard_id] ?? 0) + 1;
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
        <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Store className="h-3.5 w-3.5" /> Car yards
        </p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">
          Shop by car yard
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Prefer buying from an established yard? Open any yard below to see its
          full inventory, location, opening hours and contact details — the same
          payment protection applies.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search yards by name or city…"
            className="pl-9"
          />
        </div>
        <Select
          value={country || "all"}
          onValueChange={(v) => setCountry(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {yardsQuery.isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : yards.length === 0 ? (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="No car yards yet"
          description="Approved yards will appear here. Check back soon or browse individual listings."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {yards.map((y) => {
            const c = countryByCode(y.country);
            const count = countsQuery.data?.[y.id] ?? 0;
            return (
              <Link
                key={y.id}
                to="/yards/$slug"
                params={{ slug: y.slug }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card card-lift"
              >
                <div className="relative h-32 overflow-hidden bg-muted">
                  {y.cover_url ? (
                    <img
                      src={y.cover_url}
                      alt={`${y.name} car yard`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-muted-foreground">
                      <Store className="h-6 w-6 opacity-40" />
                    </div>
                  )}
                  {y.is_featured && (
                    <Badge className="absolute left-3 top-3 bg-accent text-accent-foreground hover:bg-accent">
                      <Star className="mr-1 h-3 w-3" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
                      {y.logo_url ? (
                        <img src={y.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold">{y.name}</h2>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {c?.flag} {y.city ? `${y.city}, ` : ""}
                        {c?.name ?? y.country}
                      </p>
                    </div>
                  </div>
                  {y.tagline && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {y.tagline}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {count} {count === 1 ? "car" : "cars"} available
                    </span>
                    {y.sellers?.verification_badge && (
                      <Badge variant="secondary" className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </Badge>
                    )}
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
