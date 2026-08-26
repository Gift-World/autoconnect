import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Gauge, Fuel, Settings2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { VehicleImage } from "@/components/VehicleImage";

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
  car_images?: { image_url: string; is_primary?: boolean; sort_order?: number }[];
};

function formatPrice(price: number | string, currency: string) {
  const n = typeof price === "string" ? Number(price) : price;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString()}`;
  }
}

export function CarCard({ 
  car, 
  distanceKm,
  onQuickView
}: { 
  car: CarCardData; 
  distanceKm?: number;
  onQuickView?: (car: CarCardData) => void;
}) {
  const sorted = [...(car.car_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  
  const [imgIndex, setImgIndex] = useState(0);
  const images = sorted.length > 0 ? sorted.map(i => i.image_url) : [];
  const activeImg = images[imgIndex] ?? sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url;
  const country = countryByCode(car.country);

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

  return (
    <div className="group relative block overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card card-lift transition-[border-color,box-shadow,transform] duration-300 hover:border-teal-400/50 hover:shadow-xl">
      <Link
        to="/cars/$id"
        params={{ id: car.id }}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
          <VehicleImage
            src={activeImg}
            alt={car.title}
            make={car.make_name}
            model={car.model_name}
            year={car.year}
            bodyType={car.body_type}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* gradient overlay */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* top left: location pill */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur">
              <span>{country?.flag ?? "🌐"}</span>
              <span className="max-w-[120px] truncate">
                {car.location_display || country?.name || car.country}
              </span>
            </span>
            {car.available_for_export ? (
              <span
                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm"
                style={{ background: "var(--export)" }}
              >
                Export
              </span>
            ) : null}
          </div>

          {/* top right: featured star */}
          {car.featured ? (
            <div className="absolute right-3 top-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-foreground shadow-sm">
                <Star className="h-3 w-3 fill-current" /> Featured
              </span>
            </div>
          ) : null}

          {/* Multi-Photo Carousel Controls on Hover */}
          {images.length > 1 && (
            <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 backdrop-blur-sm transition-transform active:scale-90"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 backdrop-blur-sm transition-transform active:scale-90"
                aria-label="Next photo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dot Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === imgIndex ? "w-3 bg-teal-400" : "w-1 bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}

          {/* bottom: price on image */}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-white z-10">
            <div className="min-w-0">
              <p className="truncate text-base font-bold tabular drop-shadow-sm sm:text-lg">
                {formatPrice(car.price, car.currency)}
              </p>
              <p className="mt-0.5 truncate text-[11px] font-medium text-white/85">
                {car.year} · {car.right_hand_drive ? "RHD" : "LHD"}
                {typeof distanceKm === "number" && (
                  <> · {distanceKm < 1 ? "<1" : Math.round(distanceKm)} km away</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-[18px]">
          <h3 className="line-clamp-1 text-sm font-bold text-foreground">{car.title}</h3>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {car.mileage != null && (
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                <span className="tabular">
                  {Number(car.mileage).toLocaleString()} {car.mileage_unit ?? "km"}
                </span>
              </span>
            )}
            {car.transmission && (
              <span className="inline-flex items-center gap-1 capitalize">
                <Settings2 className="h-3 w-3" />
                {car.transmission}
              </span>
            )}
            {car.fuel_type && (
              <span className="inline-flex items-center gap-1 capitalize">
                <Fuel className="h-3 w-3" />
                {car.fuel_type}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick View Button Footer Trigger */}
      {onQuickView && (
        <div className="px-4 pb-3 sm:px-[18px]">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(car);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-secondary/80 hover:bg-teal-500 hover:text-slate-950 text-xs font-semibold text-muted-foreground transition-all duration-200 border border-border"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Specs & Inquiry</span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Skeleton matching CarCard dimensions */
export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
