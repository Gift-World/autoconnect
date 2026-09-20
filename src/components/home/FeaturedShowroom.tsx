import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

export function FeaturedShowroom() {
  const { formatPrice } = useCurrency();

  const { data: cars, isLoading } = useQuery({
    queryKey: ["featured_showroom_cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id,title,year,price,currency,country,location_display,mileage,mileage_unit,transmission,fuel_type,body_type,car_images(image_url,is_primary,sort_order)",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(3); // Only show top 3 premium cards as requested

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });

  return (
    <section className="bg-white dark:bg-slate-950 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Featured Vehicles
            </h2>
            <p className="mt-3 text-3xl font-light tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
              Cars worth looking at.
            </p>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Every listing shows exactly what has been verified.
            </p>
          </div>
          <Button asChild variant="ghost" className="hidden md:inline-flex rounded-full text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-900">
            <Link to="/cars">
              View all vehicles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {cars?.map((car) => {
              const image = car.car_images?.find((i: any) => i.is_primary)?.image_url || car.car_images?.[0]?.image_url;
              return (
                <Link
                  key={car.id}
                  to="/cars/$id"
                  params={{ id: car.id }}
                  className="group block rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {image && (
                      <img
                        src={image}
                        alt={car.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                        Verified
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-medium text-slate-900 dark:text-slate-100 truncate">
                      {car.year} {car.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500 truncate">
                      {car.fuel_type || "Petrol"} • {car.transmission || "Automatic"}
                    </p>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        {formatPrice(Number(car.price), car.currency || "KES")}
                      </p>
                      <p className="text-sm text-slate-500">
                        {car.location_display || car.country || "Nairobi"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        
        <div className="mt-10 md:hidden flex justify-center">
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/cars">
              View all vehicles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
