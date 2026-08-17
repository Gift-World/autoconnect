import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/account/favorites")({
  component: FavoritesPage,
});

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(price);
  } catch { return `${currency} ${price.toLocaleString()}`; }
}

function FavoritesPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="h-5 w-5" />}
        title="No favorites yet"
        description="Tap the heart on any listing to save it here for later."
        actionLabel="Browse cars"
        actionTo="/cars"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((fav) => {
        const car = fav.cars as unknown as {
          id: string; title: string; year: number; price: number; currency: string;
          country: string; location_display: string | null;
          available_for_export: boolean; right_hand_drive: boolean; status: string;
          car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
        } | null;
        if (!car) return null;
        const sorted = [...(car.car_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
        const img = sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
        const country = countryByCode(car.country);
        return (
          <Link
            key={fav.id}
            to="/cars/$id"
            params={{ id: car.id }}
            className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[16/10] bg-muted">
              {img ? (
                <img src={img} alt={car.title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">No photo</div>
              )}
              <FavoriteButton carId={car.id} className="absolute right-2 top-2" />
              <div className="absolute left-2 top-2 flex gap-1.5">
                {car.available_for_export && (
                  <Badge variant="secondary" className="bg-white/95 text-foreground">
                    <Plane className="mr-1 h-3 w-3" /> Export
                  </Badge>
                )}
                {car.status !== "approved" && (
                  <Badge variant="destructive">Unavailable</Badge>
                )}
              </div>
            </div>
            <div className="p-4">
              <h3 className="line-clamp-1 text-base font-semibold">{car.title}</h3>
              <p className="text-xs text-muted-foreground">{car.year}</p>
              <p className="mt-2 text-lg font-bold text-primary">
                {formatPrice(Number(car.price), car.currency)}
              </p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {country?.flag} {car.location_display ?? car.country}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
