import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Clock3, Gavel, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/contexts/CurrencyContext";

export function LiveMarketplace() {
  const { formatPrice } = useCurrency();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-live-marketplace"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_auctions")
        .select("id,sale_mode,ends_at,current_bid,reserve_price,bid_count,status,cars(title,year,car_images(image_url,is_primary,sort_order))")
        .gte("ends_at", new Date().toISOString())
        .in("status", ["scheduled", "live"])
        .order("ends_at", { ascending: true })
        .limit(3);
      if (error) throw error;
      return (data ?? []) as any[];
    },
    staleTime: 30_000,
  });

  return (
    <section className="border-y border-border/70 bg-white py-16 sm:py-20 dark:bg-background">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" /> Live marketplace
            </div>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Move fast, with the facts in view.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Timed auctions and short-run offers are transparent by design: the current bid, deadline, minimum next bid and evidence shown on each listing are all visible before you act.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-xl border-border bg-card font-semibold">
            <Link to="/auctions">Explore auctions <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-52 rounded-2xl" key={i} />)}</div>
        ) : isError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            Live offers are temporarily unavailable. Browse the main inventory while we restore this feed.
          </div>
        ) : data?.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {data.map((auction) => {
              const car = Array.isArray(auction.cars) ? auction.cars[0] : auction.cars;
              const image = car?.car_images?.find((item: any) => item.is_primary)?.image_url || car?.car_images?.[0]?.image_url;
              const isFlash = auction.sale_mode === "flash_sale";
              return (
                <Link key={auction.id} to="/auctions" search={{ auction: auction.id }} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-1 hover:border-teal-500/50 hover:shadow-lg">
                  <div className="relative h-28 overflow-hidden bg-slate-100 dark:bg-slate-900">
                    {image ? <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-full bg-gradient-to-br from-teal-100 to-slate-100 dark:from-teal-950 dark:to-slate-900" />}
                    <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${isFlash ? "bg-amber-400 text-amber-950" : "bg-white/95 text-slate-900"}`}>
                      {isFlash ? <Zap className="h-3 w-3" /> : <Gavel className="h-3 w-3" />}{isFlash ? "Flash offer" : "Timed auction"}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-bold text-foreground">{car?.title || "Vehicle offer"}</h3>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div><p className="text-[11px] text-muted-foreground">{isFlash ? "Offer price" : "Current bid"}</p><p className="font-mono text-lg font-bold text-teal-700 dark:text-teal-300">{formatPrice(Number(auction.current_bid || auction.reserve_price || 0))}</p></div>
                      <div className="text-right text-[11px] text-muted-foreground"><p className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> Ends</p><p className="mt-0.5 font-semibold text-foreground">{new Date(auction.ends_at).toLocaleDateString()}</p></div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-7 sm:flex sm:items-center sm:justify-between">
            <div><p className="font-semibold text-foreground">No live auction is open right now.</p><p className="mt-1 text-sm text-muted-foreground">New timed offers appear here when a verified seller schedules them.</p></div>
            <Button asChild className="mt-4 rounded-xl sm:mt-0"><Link to="/auctions">See upcoming offers</Link></Button>
          </div>
        )}
      </div>
    </section>
  );
}
