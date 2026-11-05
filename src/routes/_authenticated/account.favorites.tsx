import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ban, Heart, MapPin, Plane, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleImage } from "@/components/VehicleImage";
import { PageHeader } from "@/components/layout/PageHeader";
import { countryByCode } from "@/lib/countries";
import {
  ErrorNotice,
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton, formatMoney } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/account/favorites")({
  component: FavoritesPage,
});

type FavCar = {
  id: string;
  title: string;
  year: number;
  price: number;
  currency: string;
  country: string;
  location_display: string | null;
  available_for_export: boolean;
  right_hand_drive: boolean;
  status: string;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
};

function FavoritesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select(
          "id, created_at, cars(id,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,status,car_images(image_url,is_primary,sort_order))",
        )
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const cars = (data ?? [])
    .map((fav) => ({ favId: fav.id, car: fav.cars as unknown as FavCar | null }))
    .filter((x): x is { favId: string; car: FavCar } => !!x.car);
  const available = cars.filter((x) => x.car.status === "approved");
  const unavailable = cars.filter((x) => x.car.status !== "approved");
  const exportReady = cars.filter((x) => x.car.available_for_export).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saved cars"
        title="Favorites"
        description="Cars you saved for later. Prices and availability update from the live listing."
        actions={
          <Link to="/cars" className={primaryButton}>
            <Search className="h-4 w-4" /> Browse cars
          </Link>
        }
      />

      <StatRow>
        <StatTile label="Saved" value={cars.length} icon={<Heart />} loading={isLoading} tone="ink" />
        <StatTile
          label="Available now"
          value={available.length}
          hint="Live listings you can enquire on"
          loading={isLoading}
        />
        <StatTile
          label="Export ready"
          value={exportReady}
          icon={<Plane />}
          hint="Seller can ship abroad"
          loading={isLoading}
        />
        <StatTile
          label="No longer listed"
          value={unavailable.length}
          icon={<Ban />}
          hint="Sold, paused or under review"
          loading={isLoading}
        />
      </StatRow>

      {isLoading ? (
        <ListSkeleton rows={6} className="h-80" grid="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" />
      ) : isError ? (
        <ErrorNotice title="We couldn't load your saved cars" onRetry={() => void refetch()} />
      ) : cars.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-5 w-5" />}
          title="No favorites yet"
          description="Tap the heart on any listing to save it here for later."
          actionLabel="Browse cars"
          actionTo="/cars"
        />
      ) : (
        <>
          {available.length > 0 && (
            <section>
              <SectionHeading kicker="Ready to enquire" title="Available now" />
              <FavGrid items={available} />
            </section>
          )}
          {unavailable.length > 0 && (
            <section>
              <SectionHeading
                kicker="Kept for reference"
                title="No longer available"
                description="These listings were sold, paused or are under review. Remove them with the heart."
              />
              <FavGrid items={unavailable} />
            </section>
          )}
        </>
      )}
    </div>
  );
}

function FavGrid({ items }: { items: { favId: string; car: FavCar }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map(({ favId, car }) => {
        const sorted = [...(car.car_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        const img = sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
        const country = countryByCode(car.country);
        const unavailable = car.status !== "approved";
        return (
          <Link
            key={favId}
            to="/cars/$id"
            params={{ id: car.id }}
            className="group relative overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-0.5 hover:border-ac-accent/50"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-muted">
              <VehicleImage
                src={img}
                alt={`${car.year} ${car.title}`}
                year={car.year}
                className={unavailable ? "grayscale" : ""}
              />
              <FavoriteButton carId={car.id} className="absolute right-3 top-3 z-10" />
              <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                {car.available_for_export && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ac-ink">
                    <Plane className="h-3 w-3" /> Export
                  </span>
                )}
                {unavailable && (
                  <span className="rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-xs font-semibold text-muted-foreground">{car.year}</p>
              <h3 className="mt-0.5 line-clamp-1 text-base font-bold">{car.title}</h3>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="font-brand text-2xl">{formatMoney(Number(car.price), car.currency)}</p>
                <p className="inline-flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {country?.flag} {car.location_display ?? car.country}
                  </span>
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
