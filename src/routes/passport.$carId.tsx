import { createFileRoute } from "@tanstack/react-router";
import { VehiclePassport } from "@/components/VehiclePassport";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/passport/$carId")({
  loader: async ({ params }) => {
    const { data: car, error } = await supabase
      .from("cars")
      .select("id, title, make_name, model_name, year")
      .eq("id", params.carId)
      .maybeSingle();
      
    if (error || !car) {
      throw new Error("Vehicle not found");
    }
    
    return { car };
  },
  component: PassportPage,
});

function PassportPage() {
  const { car } = Route.useLoaderData();
  const { carId } = Route.useParams();

  return (
    <div className="container max-w-4xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6 -ml-3">
        <Link to="/garage">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Garage
        </Link>
      </Button>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Vehicle Passport</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {car.title || `${car.year} ${car.make_name} ${car.model_name}`}
        </p>
      </header>
      <VehiclePassport carId={carId} />
    </div>
  );
}
