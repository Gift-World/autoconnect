import { createFileRoute, notFound } from "@tanstack/react-router";
import { VehiclePassport } from "@/components/VehiclePassport";
import { VehicleImage } from "@/components/VehicleImage";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, FileClock, ShieldCheck, Wrench } from "lucide-react";
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
        throw notFound();
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
  const name =
    car.title || `${car.year ?? ""} ${car.make_name} ${car.model_name ?? ""}`.trim();
  // Marketplace cars may have photos; manual garage vehicles fall back to a placeholder.
  const photoQuery = useQuery({
    queryKey: ["passport-photo", carId],
    queryFn: async () => {
      const { data } = await supabase
        .from("car_images")
        .select("image_url,is_primary,sort_order")
        .eq("car_id", carId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(1);
      return (data?.[0]?.image_url as string | undefined) ?? null;
    },
  });
  const photo = photoQuery.data ?? null;

  return (
    <main className="mx-auto max-w-[1180px] px-4 pb-16 pt-4 text-foreground sm:px-6 sm:pt-6">
      <Link
        to="/garage"
        className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to My Garage
      </Link>

      <section className="mt-3 grid gap-6 lg:grid-cols-[1.1fr_.9fr] lg:items-stretch">
        {/* Photo first */}
        <div className="aspect-[16/10] overflow-hidden rounded-[28px] bg-muted sm:rounded-[36px] lg:aspect-auto lg:min-h-[340px]">
          <VehicleImage
            src={photo}
            alt={name}
            make={car.make_name}
            model={car.model_name}
            year={car.year}
            loading="eager"
          />
        </div>

        {/* Passport cover */}
        <div className="flex flex-col justify-between rounded-[28px] bg-ac-ink p-6 text-white sm:rounded-[36px] sm:p-9">
          <div>
            <p className="brand-kicker inline-flex items-center gap-2 text-ac-accent">
              <FileClock className="h-4 w-4" /> Vehicle record
            </p>
            <h1 className="font-brand mt-4 text-4xl sm:text-5xl">Vehicle Passport</h1>
            <p className="mt-3 text-lg font-semibold text-white">{name}</p>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              Keep ownership evidence, inspection results and the things still to check in one
              private record for this vehicle.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <ShieldCheck className="h-4 w-4 text-ac-accent" />
              <p className="mt-2 font-semibold text-white">Evidence-led</p>
              <p className="mt-1 text-white/60">Only completed checks count.</p>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-4">
              <Wrench className="h-4 w-4 text-ac-accent" />
              <p className="mt-2 font-semibold text-white">Care-ready</p>
              <p className="mt-1 text-white/60">Attach future work to this car.</p>
            </div>
          </div>
        </div>
      </section>

      <VehiclePassport carId={carId} />
    </main>
  );
}
