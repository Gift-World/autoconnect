import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarPlus, CarFront, MapPin, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Mechanics & Garages — AutoConnect" }] }),
  component: ServicesPage,
});
type Provider = {
  id: string;
  name: string;
  provider_type: string;
  country: string;
  city: string | null;
  description: string | null;
  phone: string | null;
  is_verified: boolean;
};
const labels: Record<string, string> = {
  mechanic: "Mechanic",
  garage: "Garage",
  inspection: "Inspection",
  logistics: "Logistics",
  insurance: "Insurance",
  roadside: "Roadside help",
};

function ServicesPage() {
  const providers = useQuery({
    queryKey: ["approved-service-providers"],
    queryFn: async () => {
      const response = await fetch("/api/public/service-providers");
      const payload = (await response.json()) as { data?: Provider[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load providers.");
      return payload.data ?? [];
    },
  });
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <section className="rounded-3xl border bg-slate-950 p-7 text-white shadow-xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-300">
          Car care network
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          A trusted next step after you buy.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Find mechanics, garages and inspection providers in one calm directory. You keep control
          of every contact and appointment.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-teal-400 text-slate-950 hover:bg-teal-300">
            <Link to="/garage">Open My Garage</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/parts">Find parts</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
            <Link to="/service-bookings">Manage service requests</Link>
          </Button>
        </div>
      </section>
      {providers.isLoading ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton className="h-60 rounded-2xl" key={i} />
          ))}
        </div>
      ) : providers.isError ? (
        <EmptyState
          icon={<Wrench />}
          title="Service directory is unavailable"
          description="Please refresh and try again."
        />
      ) : providers.data?.length ? (
        <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {providers.data.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </section>
      ) : (
        <EmptyState
          icon={<Wrench />}
          title="No service providers yet"
          description="Approved mechanics and garages will appear here."
        />
      )}
    </main>
  );
}
function ProviderCard({ provider }: { provider: Provider }) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("Routine service");
  const [requestedFor, setRequestedFor] = useState("");
  const [notes, setNotes] = useState("");
  const vehicles = useQuery({
    queryKey: ["booking-garage-vehicles", session?.user.id],
    enabled: !!session?.user.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garage_vehicles")
        .select("id,make_name,model_name,year,nickname")
        .eq("owner_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const booking = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error("Please sign in to request an appointment.");
      if (!vehicleId) throw new Error("Choose the vehicle this work is for.");
      if (!requestedFor) throw new Error("Choose a preferred date and time.");
      const { error } = await supabase.from("service_bookings").insert({
        customer_id: session.user.id,
        provider_id: provider.id,
        garage_vehicle_id: vehicleId,
        service_type: serviceType.trim() || "Service request",
        requested_for: new Date(requestedFor).toISOString(),
        customer_notes: notes.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service request sent", { description: "The provider can now quote or confirm it." });
      setOpen(false);
      setNotes("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <article className="flex min-h-60 flex-col rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Wrench className="h-5 w-5" />
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">
          {labels[provider.provider_type] ?? provider.provider_type}
        </span>
      </div>
      <h2 className="mt-5 text-lg font-bold">{provider.name}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {provider.description ?? "Approved AutoConnect service provider."}
      </p>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        {provider.city ? `${provider.city}, ` : ""}
        {provider.country}
      </p>
      {provider.is_verified && (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-teal-700">
          <BadgeCheck className="h-3.5 w-3.5" /> Verified provider
        </p>
      )}
      
      {!user || !session ? (
        <Button
          onClick={() => toast.info("Sign in with a test or customer account to request an appointment.")}
          className="mt-auto w-full"
          size="sm"
        >
          <CalendarPlus className="mr-2 h-4 w-4" /> Request appointment
        </Button>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="mt-auto w-full" size="sm">
              <CalendarPlus className="mr-2 h-4 w-4" /> Book Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Book {provider.name}</DialogTitle>
              <DialogDescription>
                Connect a vehicle from your Garage to request an appointment.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {vehicles.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading your garage…</p>
              ) : !vehicles.data?.length ? (
                <div className="rounded-xl border bg-muted/40 p-4 text-center text-sm">
                  <CarFront className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                  <p className="text-muted-foreground">Add a vehicle to My Garage before requesting service.</p>
                  <Button onClick={() => setOpen(false)} variant="outline" size="sm" className="mt-3" asChild>
                    <Link to="/garage">Go to My Garage</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`vehicle-${provider.id}`}>Vehicle</Label>
                    <select id={`vehicle-${provider.id}`} value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="h-10 rounded-md border bg-background px-3 text-sm">
                      <option value="">Select a vehicle</option>
                      {vehicles.data.map((vehicle) => <option value={vehicle.id} key={vehicle.id}>{`${vehicle.year ?? ""} ${vehicle.make_name} ${vehicle.model_name ?? ""}`.trim()}{vehicle.nickname ? ` · ${vehicle.nickname}` : ""}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5"><Label htmlFor={`service-${provider.id}`}>Service needed</Label><Input id={`service-${provider.id}`} value={serviceType} onChange={(event) => setServiceType(event.target.value)} placeholder="Diagnostics, maintenance, inspection…" /></div>
                  <div className="grid gap-1.5"><Label htmlFor={`when-${provider.id}`}>Preferred time</Label><Input id={`when-${provider.id}`} type="datetime-local" value={requestedFor} onChange={(event) => setRequestedFor(event.target.value)} /></div>
                  <div className="grid gap-1.5"><Label htmlFor={`notes-${provider.id}`}>What should the provider know?</Label><Textarea id={`notes-${provider.id}`} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Symptoms, inspection notes, or a question…" /></div>
                  <Button disabled={booking.isPending} onClick={() => booking.mutate()} className="w-full">{booking.isPending ? "Sending request…" : "Send service request"}</Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}
