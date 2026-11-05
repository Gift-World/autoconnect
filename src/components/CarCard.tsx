import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Eye, MapPin, Plane, Scale, Star } from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { VehicleImage } from "@/components/VehicleImage";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useVehicleComparison } from "@/contexts/ComparisonContext";
import { cn } from "@/lib/utils";

export type CarCardData = {
  id: string;
  title: string;
  year: number;
  price: number | string;
  currency: string;
  country: string;
  location_display?: string | null;
  available_for_export?: boolean | null;
  right_hand_drive?: boolean | null;
  featured?: boolean | null;
  mileage?: number | null;
  mileage_unit?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  make_name?: string | null;
  model_name?: string | null;
  body_type?: string | null;
  condition?: string | null;
  is_sample?: boolean | null;
  car_images?: { image_url: string; is_primary?: boolean; sort_order?: number }[];
};

function shortMileage(mileage: number, unit?: string | null) {
  const n = Number(mileage);
  const label = n >= 1000 ? `${Math.round(n / 1000).toLocaleString()}k` : n.toLocaleString();
  return `${label} ${unit ?? "km"}`;
}

/**
 * Airbnb-style listing card: big photo in a fixed 4:3 box, heart on the photo,
 * title + 2–3 key facts, prominent price. Compare and quick view stay one tap away.
 */
export function CarCard({
  car,
  distanceKm,
  onQuickView,
  priority = false,
}: {
  car: CarCardData;
  distanceKm?: number;
  onQuickView?: (car: CarCardData) => void;
  priority?: boolean;
}) {
  const { formatPrice } = useCurrency();
  const { toggleCompare, isInComparison } = useVehicleComparison();

  const sorted = [...(car.car_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );

  const [imgIndex, setImgIndex] = useState(0);
  const images = sorted.length > 0 ? sorted.map((i) => i.image_url) : [];
  const activeImg =
    images[imgIndex] ?? sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url;
  const country = countryByCode(car.country);

  const numericPrice = typeof car.price === "string" ? parseFloat(car.price) || 0 : car.price;
  const isCompared = isInComparison(car.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((prev) => (prev + 1) % images.length);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare({
      id: car.id,
      make: car.make_name || car.title.split(" ")[0] || "Vehicle",
      model: car.model_name || car.title.split(" ").slice(1).join(" ") || "",
      year: car.year,
      price: numericPrice,
      mileage: car.mileage,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      body_type: car.body_type,
      country: car.country,
      image_url: activeImg,
      verified: car.featured,
    });
  };

  const facts = [
    String(car.year),
    car.mileage != null ? shortMileage(car.mileage, car.mileage_unit) : null,
    car.transmission || car.fuel_type || null,
  ].filter(Boolean) as string[];

  const place = car.location_display || country?.name || car.country;

  return (
    <article className="group relative min-w-0">
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
        <Link
          to="/cars/$id"
          params={{ id: car.id }}
          className="absolute inset-0 block"
          aria-label={`View ${car.title}`}
        >
          <VehicleImage
            src={activeImg}
            alt={car.title}
            make={car.make_name}
            model={car.model_name}
            year={car.year}
            bodyType={car.body_type}
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
          {car.is_sample ? (
            <span className="inline-flex items-center rounded-full bg-ac-ink/85 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm backdrop-blur">
              Sample listing
            </span>
          ) : null}
          {car.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ac-accent px-2.5 py-1 text-[11px] font-bold text-ac-ink shadow-sm">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          ) : null}
          {car.available_for_export ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ac-ink shadow-sm">
              <Plane className="h-3 w-3" /> Export
            </span>
          ) : null}
        </div>

        {/* Heart */}
        <FavoriteButton carId={car.id} className="absolute right-2 top-2 z-20" />

        {/* Photo carousel controls (hover on desktop) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ac-ink opacity-0 shadow-sm transition group-hover:opacity-100 sm:grid"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ac-ink opacity-0 shadow-sm transition group-hover:opacity-100 sm:grid"
              aria-label="Next photo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    idx === imgIndex ? "w-4 bg-white" : "w-1.5 bg-white/60",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details */}
      <div className="mt-3 flex items-start gap-2">
        <Link to="/cars/$id" params={{ id: car.id }} className="min-w-0 flex-1">
          <h3 className="line-clamp-1 text-[15px] font-bold text-foreground">{car.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {country?.flag ? `${country.flag} ` : ""}
              {place}
              {typeof distanceKm === "number" && (
                <> · {distanceKm < 1 ? "<1" : Math.round(distanceKm)} km away</>
              )}
            </span>
          </p>
          <p className="mt-0.5 truncate text-sm capitalize text-muted-foreground">
            {facts.join(" · ")}
            {car.right_hand_drive != null && <> · {car.right_hand_drive ? "RHD" : "LHD"}</>}
          </p>
          <p className="mt-1.5 text-lg font-extrabold tabular-nums text-foreground">
            {formatPrice(numericPrice)}
          </p>
        </Link>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={handleCompareClick}
            aria-pressed={isCompared}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-full border transition",
              isCompared
                ? "border-ac-accent bg-ac-accent text-ac-ink"
                : "border-border bg-card text-muted-foreground hover:border-foreground/40 hover:text-foreground",
            )}
            title={isCompared ? "Remove from comparison" : "Add to comparison"}
            aria-label={isCompared ? "Remove from comparison" : "Add to comparison"}
          >
            <Scale className="h-4 w-4" />
          </button>
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(car);
              }}
              className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-foreground/40 hover:text-foreground"
              title="Quick specs & inquiry"
              aria-label="Quick specs and inquiry"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

/** Skeleton matching CarCard dimensions */
export function CarCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
      <div className="mt-3 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
