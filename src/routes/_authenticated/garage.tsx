import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Car, ClipboardCheck, FileText, Gauge, Plus, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/garage")({
  head: () => ({ meta: [{ title: "My Garage — AutoConnect" }] }),
  component: GaragePage,
});

type GarageVehicle = {
  id: string;
  nickname: string | null;
  make_name: string;
  model_name: string | null;
  year: number | null;
  vin: string | null;
  mileage: number | null;
  mileage_unit: "km" | "miles";
  next_service_at: string | null;
  next_service_mileage: number | null;
  insurance_renews_at: string | null;
  notes: string | null;
};

// This owner is a database-only preview record. It is deliberately read-only
// and is never used for a real signed-in customer's garage.
const PREVIEW_GARAGE_OWNER_ID = "f98e074f-e3ad-42e6-9a20-80f55e323045";

function GaragePage() {
  const { user } = useAuth();
  const isPreview = DEMO_MODE;
  const ownerId = isPreview ? PREVIEW_GARAGE_OWNER_ID : user?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ make: "", model: "", year: "", nickname: "", vin: "", mileage: "" });

  const vehicles = useQuery({
    queryKey: ["garage-vehicles", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      if (isPreview) {
        const response = await fetch("/api/public/preview-garage");
        const payload = await response.json() as { data?: GarageVehicle[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load garage preview.");
        return payload.data ?? [];
      }
      const { data, error } = await supabase.from("garage_vehicles").select("id,nickname,make_name,model_name,year,vin,mileage,mileage_unit,next_service_at,next_service_mileage,insurance_renews_at,notes").eq("owner_id", ownerId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as GarageVehicle[];
    },
  });

  const addVehicle = useMutation({
    mutationFn: async () => {
      if (isPreview) throw new Error("Preview records are read-only. Sign in to add a personal vehicle.");
      if (!user) throw new Error("Please sign in first");
      if (!form.make.trim()) throw new Error("Enter the vehicle make");
      const { error } = await supabase.from("garage_vehicles").insert({
        owner_id: user.id,
        make_name: form.make.trim(),
        model_name: form.model.trim() || null,
        year: form.year ? Number(form.year) : null,
        nickname: form.nickname.trim() || null,
        vin: form.vin.trim() || null,
        mileage: form.mileage ? Number(form.mileage) : null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["garage-vehicles", ownerId] });
      setOpen(false);
      setForm({ make: "", model: "", year: "", nickname: "", vin: "", mileage: "" });
      toast.success("Vehicle added to My Garage");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-6 text-white shadow-xl sm:p-9">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">My Garage</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Your car life, in one calm place.</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            Keep your vehicles, evidence, service milestones and ownership decisions together. AutoConnect only uses data you add or verify.
          </p>
          {isPreview && <p className="mt-4 inline-flex rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-100">Preview data · safe, read-only Supabase records</p>}
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => isPreview ? toast.info("Preview records are read-only. Sign in to add your own vehicle.") : setOpen(true)} className="bg-teal-400 text-slate-950 hover:bg-teal-300">
              <Plus className="mr-2 h-4 w-4" /> Add a vehicle
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/parts">Find compatible parts</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Your vehicles</h2>
            <p className="mt-1 text-sm text-muted-foreground">{isPreview ? "Preview records are supplied from Supabase for UI and flow testing." : "Ownership data stays private to your account."}</p>
          </div>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
            {vehicles.data?.length ?? 0} vehicle{(vehicles.data?.length ?? 0) === 1 ? "" : "s"}
          </span>
        </div>

        {vehicles.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-56 rounded-2xl" />)}
          </div>
        ) : vehicles.isError ? (
          <EmptyState
            icon={<ShieldCheck className="h-5 w-5" />}
            title="We couldn't load your garage"
            description="Refresh once, then try again. Your existing marketplace data is unaffected."
          />
        ) : vehicles.data?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vehicles.data.map((vehicle) => <GarageCard key={vehicle.id} vehicle={vehicle} />)}
          </div>
        ) : (
          <EmptyState
            icon={<Car className="h-5 w-5" />}
            title="Add your first vehicle"
            description="Start with a make, model and year. You can add service, documents and ownership details over time."
          />
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add to My Garage</DialogTitle>
            <DialogDescription>Keep it simple now. You can add service and document evidence later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make *"><Input value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} placeholder="Toyota" /></Field>
            <Field label="Model"><Input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="Land Cruiser Prado" /></Field>
            <Field label="Year"><Input type="number" min="1900" max="2100" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} placeholder="2019" /></Field>
            <Field label="Nickname"><Input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="Family car" /></Field>
            <Field label="Mileage"><Input type="number" min="0" value={form.mileage} onChange={(event) => setForm({ ...form, mileage: event.target.value })} placeholder="68000" /></Field>
            <Field label="VIN (optional)"><Input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value })} placeholder="17 characters" /></Field>
          </div>
          <Button disabled={addVehicle.isPending} onClick={() => addVehicle.mutate()} className="w-full">
            {addVehicle.isPending ? "Saving…" : "Add vehicle securely"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="grid gap-1.5 text-sm font-medium"><Label>{label}</Label>{children}</label>;
}

function GarageCard({ vehicle }: { vehicle: GarageVehicle }) {
  const label = `${vehicle.year ? `${vehicle.year} ` : ""}${vehicle.make_name} ${vehicle.model_name ?? ""}`.trim();
  const serviceDue = vehicle.next_service_at ? new Date(vehicle.next_service_at).toLocaleDateString() : null;
  return (
    <article className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Car className="h-5 w-5" /></span>
        {vehicle.nickname && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{vehicle.nickname}</span>}
      </div>
      <h3 className="mt-4 text-lg font-bold">{label}</h3>
      <div className="mt-4 space-y-2 border-t pt-4 text-xs text-muted-foreground">
        <p className="flex items-center gap-2"><Gauge className="h-3.5 w-3.5 text-primary" /> {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} ${vehicle.mileage_unit}` : "Mileage not recorded"}</p>
        <p className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5 text-primary" /> {serviceDue ? `Service due ${serviceDue}` : "Set your next service"}</p>
        <p className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /> {vehicle.vin ? "VIN stored privately" : "Add VIN when ready"}</p>
      </div>
      <div className="mt-4 flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/parts">Parts</Link></Button>
        <Button asChild size="sm" variant="outline" className="flex-1"><Link to="/import">Import</Link></Button>
      </div>
    </article>
  );
}
