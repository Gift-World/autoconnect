import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Store,
  ShieldCheck,
  Star,
  MapPin,
  ArrowRight,
  Car as CarIcon,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_YARDS } from "@/lib/demo-inventory";
import { countryByCode } from "@/lib/countries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const FALLBACK_COVERS = [
  "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop&q=80",
];

export function DealershipShowroom() {
  const { data: yards, isLoading } = useQuery({
    queryKey: ["home_dealerships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_yards")
        .select("id,slug,name,tagline,logo_url,cover_url,country,city,is_featured")
        .eq("is_approved", true)
        .eq("is_suspended", false)
        .order("is_featured", { ascending: false })
        .limit(3);

      if (!error && data && data.length > 0) {
        return data;
      }

      return DEMO_YARDS.slice(0, 3);
    },
    staleTime: 60_000,
  });

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
              <Store className="h-3.5 w-3.5" /> Accredited Dealer Network
            </div>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Explore trusted dealerships.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Meet verified dealers and explore their complete verified inventory with physical diagnostics bays, on-site viewing, and escrow guarantees.
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="rounded-2xl border-border hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 self-start md:self-auto"
          >
            <Link to="/yards">
              View All Dealerships <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Dealership Showcase Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(yards || DEMO_YARDS.slice(0, 3)).map((yard: any, idx: number) => {
            const country = countryByCode(yard.country);
            const coverUrl = yard.cover_url || FALLBACK_COVERS[idx % FALLBACK_COVERS.length];
            const stockCount = yard.slug === "nairobi-hub" ? 128 : yard.slug === "mombasa-port-hub" ? 84 : 45;
            const rating = yard.slug === "nairobi-hub" ? "4.9" : yard.slug === "mombasa-port-hub" ? "4.8" : "4.7";

            return (
              <Link
                key={yard.id}
                to="/yards/$slug"
                params={{ slug: yard.slug }}
                className="group flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/40 hover:shadow-xl"
              >
                {/* Cover Banner */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                  <img
                    src={coverUrl}
                    alt={yard.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Top tags */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <Badge className="bg-emerald-500 text-white font-bold text-[11px] border-0 shadow-sm">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Verified Dealer
                    </Badge>

                    <div className="flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-bold text-amber-400 backdrop-blur-md">
                      <Star className="h-3 w-3 fill-current" /> {rating} ★
                    </div>
                  </div>

                  {/* Bottom stock badge */}
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {stockCount} Vehicles in Stock
                  </div>
                </div>

                {/* Yard Body */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="flex items-start gap-3.5">
                      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-border bg-background shadow-sm">
                        {yard.logo_url ? (
                          <img src={yard.logo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Store className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-bold tracking-tight text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {yard.name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                          <span>{yard.city ? `${yard.city}, ` : ""}{country?.name || yard.country}</span>
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {yard.tagline || "Quality inspected Japanese imports, UK luxury stock, and locally maintained vehicles with full escrow protection."}
                    </p>

                    {/* Services Chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-muted-foreground font-medium">
                        On-Site Diagnostics
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-muted-foreground font-medium">
                        Trade-Ins Accepted
                      </span>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-muted-foreground font-medium">
                        Escrow Approved
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400 group-hover:translate-x-1 transition-transform">
                      View Showroom & Inventory →
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Direct Viewing Available
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
