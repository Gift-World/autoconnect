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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { CarCard, type CarCardData } from "@/components/CarCard";
import { countryByCode } from "@/lib/countries";

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
  const { data, error } = await supabase
    .from("car_yards")
    .select(
      "id,slug,name,tagline,description,logo_url,cover_url,country,city,address,phone,whatsapp,email,opening_hours,is_featured,sellers(verification_badge,is_verified)",
    )
    .eq("slug", slug)
    .eq("is_approved", true)
    .eq("is_suspended", false)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as unknown as Yard;
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
    const title = `${y.name} — Car Yard | AutoConnect`;
    const desc =
      y.tagline ??
      `Browse the full inventory of ${y.name}${y.city ? ` in ${y.city}` : ""} on AutoConnect.`;
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
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <h1 className="font-display text-2xl">Car yard not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This yard may have been removed or is awaiting approval.
      </p>
      <Button asChild className="mt-6">
        <Link to="/yards">Browse all yards</Link>
      </Button>
    </div>
  );
}

function YardPage() {
  const yard = Route.useLoaderData();
  const [q, setQ] = useState("");
  const country = countryByCode(yard.country);

  const carsQuery = useQuery({
    queryKey: ["yard-cars", yard.id],
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
      if (error) throw error;
      return (data ?? []) as unknown as (CarCardData & {
        make_name: string | null;
        model_name: string | null;
      })[];
    },
  });

  const cars = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = carsQuery.data ?? [];
    if (!term) return list;
    return list.filter((c) =>
      `${c.title} ${c.make_name ?? ""} ${c.model_name ?? ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [carsQuery.data, q]);

  return (
    <div className="pb-16">
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden bg-muted sm:h-64">
        {yard.cover_url ? (
          <img
            src={yard.cover_url}
            alt={`${yard.name} yard`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 to-accent/15" />
        )}
      </div>

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Identity card */}
        <div className="-mt-12 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-background">
              {yard.logo_url ? (
                <img src={yard.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-muted-foreground" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
                  {yard.name}
                </h1>
                {yard.sellers?.verification_badge && (
                  <Badge className="bg-success text-white hover:bg-success">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified yard
                  </Badge>
                )}
              </div>
              {yard.tagline && (
                <p className="mt-1 text-sm text-muted-foreground">{yard.tagline}</p>
              )}
              <p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {country?.flag} {yard.address ? `${yard.address}, ` : ""}
                {yard.city ? `${yard.city}, ` : ""}
                {country?.name ?? yard.country}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {yard.phone && (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${yard.phone}`}>
                    <Phone className="mr-1.5 h-4 w-4" /> Call
                  </a>
                </Button>
              )}
              {yard.whatsapp && (
                <Button asChild size="sm" className="bg-success text-white hover:bg-success/90">
                  <a
                    href={`https://wa.me/${yard.whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {yard.email && (
                <Button asChild variant="outline" size="sm">
                  <a href={`mailto:${yard.email}`}>
                    <Mail className="mr-1.5 h-4 w-4" /> Email
                  </a>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <Stat
              icon={<CarIcon className="h-4 w-4" />}
              label="Cars in stock"
              value={String(carsQuery.data?.length ?? 0)}
            />
            <Stat
              icon={<Clock className="h-4 w-4" />}
              label="Opening hours"
              value={yard.opening_hours ?? "Contact the yard"}
            />
            <Stat
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Buyer protection"
              value="Payment protected on every purchase"
            />
          </div>
        </div>

        {yard.description && (
          <section className="mt-8 rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">About this yard</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {yard.description}
            </p>
          </section>
        )}

        {/* Inventory */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Inventory</h2>
            <div className="relative w-64 max-w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search this yard…"
                className="pl-9"
              />
            </div>
          </div>

          {carsQuery.isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 rounded-2xl" />
              ))}
            </div>
          ) : cars.length === 0 ? (
            <EmptyState
              icon={<CarIcon className="h-5 w-5" />}
              title="No cars listed yet"
              description="This yard hasn't published any approved listings yet."
              actionLabel="Browse all cars"
              actionTo="/cars"
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {cars.map((c) => (
                <CarCard key={c.id} car={c} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
