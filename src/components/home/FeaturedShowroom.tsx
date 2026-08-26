import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Star,
  Gauge,
  Fuel,
  Sparkles,
  MapPin,
  Car as CarIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_CARS } from "@/lib/demo-inventory";
import { countryByCode } from "@/lib/countries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleImage } from "@/components/VehicleImage";
import { VehicleDrawer, type DrawerCar } from "@/components/drawer/VehicleDrawer";

export function FeaturedShowroom() {
  const [filterType, setFilterType] = useState<string>("all");
  const [drawerCar, setDrawerCar] = useState<DrawerCar | null>(null);

  const { data: cars, isLoading } = useQuery({
    queryKey: ["featured_showroom_cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,available_for_export,right_hand_drive,featured,mileage,mileage_unit,transmission,fuel_type,body_type,car_images(image_url,is_primary,sort_order)"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(12);

      if (!error && data && data.length > 0) {
        return data;
      }

      // High-resolution demo cars fallback
      return DEMO_CARS;
    },
    staleTime: 60_000,
  });

  const filteredCars = useMemo(() => {
    if (!cars) return [];
    if (filterType === "all") return cars.slice(0, 8);
    return cars
      .filter((c: any) => {
        const bt = (c.body_type || "").toLowerCase();
        const title = (c.title || "").toLowerCase();
        if (filterType === "suv") return bt.includes("suv") || title.includes("prado") || title.includes("harrier") || title.includes("cruiser");
        if (filterType === "sedan") return bt.includes("sedan") || title.includes("mercedes") || title.includes("bmw") || title.includes("camry");
        if (filterType === "hybrid") return (c.fuel_type || "").toLowerCase().includes("hybrid") || title.includes("hybrid");
        if (filterType === "truck") return bt.includes("pickup") || bt.includes("truck") || title.includes("hilux");
        return true;
      })
      .slice(0, 8);
  }, [cars, filterType]);

  return (
    <section className="bg-secondary/40 py-20 lg:py-28 border-y border-border/60">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
              <CarIcon className="h-3.5 w-3.5" /> Curated Digital Showroom
            </div>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Featured Verified Vehicles
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xl">
              Every vehicle has undergone on-site physical diagnostics, chassis verification, and is backed by escrow protection.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-card border border-border shadow-sm">
            {[
              { id: "all", label: "All Vehicles" },
              { id: "suv", label: "SUVs & 4x4s" },
              { id: "sedan", label: "Executive Sedans" },
              { id: "hybrid", label: "Hybrids & EVs" },
              { id: "truck", label: "Pickups & Trucks" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                  filterType === tab.id
                    ? "bg-teal-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle Cards Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCars.map((car: any) => {
              const country = countryByCode(car.country);
              const imgList = car.car_images || [];
              const primaryImg =
                imgList.find((i: any) => i.is_primary)?.image_url ||
                imgList[0]?.image_url ||
                null;

              return (
                <Link
                  key={car.id}
                  to="/cars/$id"
                  params={{ id: car.id }}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-teal-500/40 hover:shadow-xl"
                >
                  {/* Large Cinematic Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <VehicleImage
                      src={primaryImg}
                      alt={car.title}
                      make={car.make_name}
                      model={car.model_name}
                      year={car.year}
                      bodyType={car.body_type}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        <span>{country?.flag ?? "🇰🇪"}</span>
                        <span>{car.location_display || country?.name || "Nairobi"}</span>
                      </span>

                      {car.featured && (
                        <Badge className="border-0 bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <Star className="mr-1 h-3 w-3 fill-current" /> Featured
                        </Badge>
                      )}
                    </div>

                    {/* Price Overlay on Image */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                      <div>
                        <p className="font-display text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-sm">
                          {typeof car.price === "number"
                            ? `${car.currency || "KSh"} ${car.price.toLocaleString()}`
                            : car.price}
                        </p>
                        <p className="text-[11px] font-medium text-slate-300">
                          {car.year} • {car.right_hand_drive ? "RHD" : "LHD"}
                        </p>
                      </div>

                      <span className="rounded-full bg-teal-500/90 p-1.5 text-slate-950 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-110 shadow-md">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h3 className="font-display text-base font-bold tracking-tight text-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                        {car.title}
                      </h3>

                      {/* Specs */}
                      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Gauge className="h-3.5 w-3.5 text-teal-500" />
                          {car.mileage ? `${car.mileage.toLocaleString()} ${car.mileage_unit || "km"}` : "Unregistered"}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 capitalize">
                          <Fuel className="h-3.5 w-3.5 text-teal-500" />
                          {car.fuel_type || "Petrol"}
                        </span>
                      </div>
                    </div>

                    {/* Trust footer & Quick Specs action */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5" /> Escrow Protected
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDrawerCar(car as DrawerCar);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500 hover:text-slate-950 text-teal-600 dark:text-teal-400 font-bold transition-colors shadow-sm"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Quick Specs</span>
                      </button>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-2xl border-border px-8 font-bold hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
          >
            <Link to="/cars">
              Explore All {cars?.length || 50}+ Verified Cars <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Interactive Quick-View Detail Drawer */}
      <VehicleDrawer
        car={drawerCar}
        isOpen={!!drawerCar}
        onClose={() => setDrawerCar(null)}
      />
    </section>
  );
}
