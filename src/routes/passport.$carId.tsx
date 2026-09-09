import { createFileRoute } from "@tanstack/react-router";
import { VehiclePassport } from "@/components/VehiclePassport";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ShieldCheck, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/passport/$carId")({
  loader: async ({ params }) => {
    let { data: car, error } = await supabase
      .from("cars")
      .select("id, title, make_name, model_name, year")
      .eq("id", params.carId)
      .maybeSingle();

    if (error || !car) {
      const { data: garageCar } = await supabase
        .from("garage_vehicles")
        .select("id, title:nickname, make_name, model_name, year")
        .eq("id", params.carId)
        .maybeSingle();

      if (!garageCar) {
        throw new Error("Vehicle not found");
      }
      car = garageCar;
    }

    return { car };
  },
  component: PassportPage,
});

function PassportPage() {
  const { car } = Route.useLoaderData();
  const { carId } = Route.useParams();

  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-teal-50 via-card to-white p-6 shadow-card sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-3 mb-7 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Link to="/garage">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to My Garage
            </Link>
          </Button>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">
                Vehicle record
              </p>
              <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                Vehicle Passport
              </h1>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {car.title || `${car.year ?? ""} ${car.make_name} ${car.model_name ?? ""}`.trim()}
              </p>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Keep ownership evidence, inspection results and the things still to check in one
                private record for this vehicle.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:w-[330px]">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="mt-2 font-semibold text-foreground">Evidence-led</p>
                <p className="mt-1 text-slate-400">Only completed checks count.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Wrench className="h-4 w-4 text-primary" />
                <p className="mt-2 font-semibold text-foreground">Care-ready</p>
                <p className="mt-1 text-slate-400">Attach future work to this car.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <VehiclePassport carId={carId} />
    </main>
  );
}
