import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AlertTriangle, Car, ChevronRight, Plus, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE, useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";
import { GarageVehicleCard } from "@/components/garage/GarageVehicleCard";
import {
  daysUntil,
  dueLabel,
  dueTone,
  vehicleLabel,
  type GarageVehicle,
} from "@/components/garage/garage-utils";
import {
  ErrorNotice,
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { onDarkButton, primaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/garage")({
  head: () => ({ meta: [{ title: "My Garage — AutoConnect" }] }),
  component: GaragePage,
});

// This owner is a database-only preview record. It is deliberately read-only
// and is never used for a real signed-in customer's garage.
type OwnershipRow = {
  id: string;
  cars: {
    id: string;
    title: string | null;
    make_name: string | null;
    model_name: string | null;
    year: number | null;
    mileage: number | null;
    mileage_unit: "km" | "miles" | null;
    vin: string | null;
  } | null;
};

const PREVIEW_GARAGE_OWNER_ID = "f98e074f-e3ad-42e6-9a20-80f55e323045";

function GaragePage() {
  const { user, session } = useAuth();
  // Demo records are only for a visitor with no authenticated Supabase session.
  // A real customer must always see their own garage, even when preview personas
  // are enabled in a staging build.
  const isPreview = DEMO_MODE && !session;
  const ownerId = isPreview ? PREVIEW_GARAGE_OWNER_ID : user?.id;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    nickname: "",
    vin: "",
    mileage: "",
  });

  const vehicles = useQuery({
    queryKey: ["garage-vehicles", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      if (isPreview) {
        const response = await fetch("/api/public/preview-garage");
        const payload = (await response.json()) as { data?: GarageVehicle[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "Unable to load garage preview.");
        return payload.data ?? [];
      }
      let manualVehicles: GarageVehicle[] = [];
      try {
        const { data, error } = await supabase
          .from("garage_vehicles")
          .select(
            "id,nickname,make_name,model_name,year,vin,mileage,mileage_unit,next_service_at,next_service_mileage,insurance_renews_at,notes",
          )
          .eq("owner_id", ownerId!)
          .order("created_at", { ascending: false });
        if (error) {
          console.error("Error fetching garage_vehicles:", error);
        } else if (data) {
          manualVehicles = data as GarageVehicle[];
        }
      } catch (err) {
        console.error("Exception fetching garage_vehicles:", err);
      }

      // Fetch real ownership records, but gracefully handle missing table during development
      let ownData: OwnershipRow[] | null = null;
      try {
        const result = await supabase
          .from("ownerships")
          .select("id,cars!inner(id,title,make_name,model_name,year,mileage,mileage_unit,vin)")
          .eq("user_id", ownerId!)
          .eq("status", "current");

        if (result.error) {
          console.error("Error fetching ownerships:", result.error);
        } else {
          ownData = result.data as unknown as OwnershipRow[];
        }
      } catch (err) {
        console.error("Exception fetching ownerships:", err);
      }

      const purchasedVehicles: GarageVehicle[] = [];
      if (ownData && ownData.length > 0) {
        ownData.forEach((own) => {
          if (own.cars) {
            purchasedVehicles.push({
              id: own.cars.id,
              nickname: own.cars.title,
              make_name: own.cars.make_name || "Unknown Make",
              model_name: own.cars.model_name || "Unknown Model",
              year: own.cars.year || null,
              vin: own.cars.vin || null,
              mileage: own.cars.mileage || null,
              mileage_unit: own.cars.mileage_unit || "km",
              next_service_at: null,
              next_service_mileage: null,
              insurance_renews_at: null,
              notes: "AutoConnect Authenticated Ownership",
            });
          }
        });
      }

      // Merge and deduplicate by VIN (or ID) just in case
      // For demo users, manual vehicles are loaded. For production, ownerships are loaded.
      const merged = [...purchasedVehicles, ...manualVehicles];
      const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());
      return unique;
    },
  });

  const addVehicle = useMutation({
    mutationFn: async () => {
      if (isPreview)
        throw new Error("Preview vehicles cannot be modified. Please sign in to add your own.");
      if (!ownerId) throw new Error("Owner ID is missing");
      if (!form.make.trim()) throw new Error("Enter the vehicle make");
      const { error } = await supabase.from("garage_vehicles").insert({
        owner_id: ownerId,
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

  const list = vehicles.data ?? [];
  const reminders = list
    .flatMap((v) => [
      { v, kind: "Service" as const, days: daysUntil(v.next_service_at) },
      { v, kind: "Insurance renewal" as const, days: daysUntil(v.insurance_renews_at) },
    ])
    .filter((r) => r.days !== null && r.days <= 30)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
  const serviceSoon = reminders.filter((r) => r.kind === "Service").length;
  const insuranceSoon = reminders.filter((r) => r.kind === "Insurance renewal").length;
  const missingDates = list.filter((v) => !v.next_service_at || !v.insurance_renews_at).length;

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      {/* Owner hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-ac-ink p-6 text-white sm:rounded-[36px] sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-ac-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="brand-kicker text-ac-accent">My Garage</p>
            <h1 className="font-brand mt-4 text-4xl sm:text-5xl">
              Your car life, in one calm place.
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
              Keep your vehicles, evidence, service milestones and ownership decisions together.
              AutoConnect only uses data you add or verify.
            </p>
            {isPreview && (
              <p className="mt-4 inline-flex rounded-full border border-ac-accent/40 bg-ac-accent/15 px-3 py-1.5 text-xs font-semibold text-white">
                Preview data · safe, read-only Supabase records
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpen(true)} className={primaryButton}>
              <Plus className="h-4 w-4" /> Add vehicle
            </button>
            <Link to="/parts" className={onDarkButton}>
              Find compatible parts
            </Link>
          </div>
        </div>
      </section>

      <StatRow>
        <StatTile label="Vehicles" value={list.length} icon={<Car />} loading={vehicles.isLoading} />
        <StatTile
          label="Service due"
          hint="Within 30 days or overdue"
          value={serviceSoon}
          icon={<Wrench />}
          tone={serviceSoon ? "accent" : "default"}
          loading={vehicles.isLoading}
        />
        <StatTile
          label="Insurance renewals"
          hint="Within 30 days or overdue"
          value={insuranceSoon}
          icon={<ShieldCheck />}
          tone={insuranceSoon ? "accent" : "default"}
          loading={vehicles.isLoading}
        />
        <StatTile
          label="Missing dates"
          value={missingDates}
          hint="Service or insurance not set"
          icon={<AlertTriangle />}
          loading={vehicles.isLoading}
        />
      </StatRow>

      {/* What needs action now */}
      {reminders.length > 0 && (
        <section>
          <SectionHeading kicker="Coming up" title="Needs attention" />
          <ul className="overflow-hidden rounded-3xl border border-border bg-card">
            {reminders.map((r) => {
              const tone = dueTone(r.days);
              const rowCls =
                "flex min-h-16 items-center gap-3 px-4 py-3 transition hover:bg-muted/60 sm:px-5";
              const content = (
                <>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        tone === "overdue"
                          ? "bg-destructive text-white"
                          : "bg-ac-accent/15 text-ac-accent"
                      }`}
                    >
                      {r.kind === "Service" ? (
                        <Wrench className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">
                        {r.kind} · {r.v.nickname || vehicleLabel(r.v)}
                      </span>
                      <span
                        className={`block text-xs font-semibold ${
                          tone === "overdue"
                            ? "text-destructive"
                            : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {dueLabel(r.days)}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </>
              );
              return (
                <li key={`${r.v.id}-${r.kind}`} className="border-b border-border last:border-b-0">
                  {r.kind === "Service" ? (
                    <Link to="/services" className={rowCls}>
                      {content}
                    </Link>
                  ) : (
                    <Link to="/passport/$carId" params={{ carId: r.v.id }} className={rowCls}>
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <SectionHeading
          kicker="Your vehicles"
          title={`${list.length} vehicle${list.length === 1 ? "" : "s"}`}
          description={
            isPreview
              ? "Preview records are supplied from Supabase for UI and flow testing."
              : "Ownership data stays private to your account."
          }
        />

        {vehicles.isLoading ? (
          <ListSkeleton rows={3} className="h-[420px] rounded-[28px]" grid="grid gap-4 md:grid-cols-2 xl:grid-cols-3" />
        ) : vehicles.isError ? (
          <ErrorNotice
            title="We couldn't load your garage"
            message="Refresh once, then try again. Your existing marketplace data is unaffected."
            onRetry={() => void vehicles.refetch()}
          />
        ) : list.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((vehicle) => (
              <GarageVehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <EmptyState
              icon={<Car className="h-5 w-5" />}
              title="Add your first vehicle"
              description="Start with a make, model and year. You can add service, documents and ownership details over time."
            />
            <div className="flex justify-center">
              <Button variant="outline" className="min-h-11 rounded-full" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add a vehicle
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-brand text-2xl">Add to My Garage</DialogTitle>
            <DialogDescription>
              Keep it simple now. You can add service and document evidence later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Make *">
              <Input
                className="h-11"
                value={form.make}
                onChange={(event) => setForm({ ...form, make: event.target.value })}
                placeholder="Toyota"
              />
            </Field>
            <Field label="Model">
              <Input
                className="h-11"
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                placeholder="Land Cruiser Prado"
              />
            </Field>
            <Field label="Year">
              <Input
                className="h-11"
                type="number"
                min="1900"
                max="2100"
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
                placeholder="2019"
              />
            </Field>
            <Field label="Nickname">
              <Input
                className="h-11"
                value={form.nickname}
                onChange={(event) => setForm({ ...form, nickname: event.target.value })}
                placeholder="Family car"
              />
            </Field>
            <Field label="Mileage">
              <Input
                className="h-11"
                type="number"
                min="0"
                value={form.mileage}
                onChange={(event) => setForm({ ...form, mileage: event.target.value })}
                placeholder="68000"
              />
            </Field>
            <Field label="VIN (optional)">
              <Input
                className="h-11"
                value={form.vin}
                onChange={(event) => setForm({ ...form, vin: event.target.value })}
                placeholder="17 characters"
              />
            </Field>
          </div>
          <button
            type="button"
            disabled={addVehicle.isPending}
            onClick={() => addVehicle.mutate()}
            className={`${primaryButton} w-full`}
          >
            {addVehicle.isPending ? "Saving…" : "Add vehicle securely"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      <Label>{label}</Label>
      {children}
    </label>
  );
}
