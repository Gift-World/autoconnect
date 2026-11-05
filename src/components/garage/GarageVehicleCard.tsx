import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BadgeCheck, CalendarClock, FileText, Gauge, ShieldCheck, Wrench } from "lucide-react";
import { VehicleImage } from "@/components/VehicleImage";
import { cn } from "@/lib/utils";
import {
  daysUntil,
  dueLabel,
  dueTone,
  vehicleLabel,
  VERIFIED_OWNERSHIP_NOTE,
  type DueTone,
  type GarageVehicle,
} from "@/components/garage/garage-utils";

export type { GarageVehicle };

const TONE_CLS: Record<DueTone, string> = {
  overdue: "text-destructive",
  soon: "text-amber-700 dark:text-amber-400",
  ok: "text-emerald-700 dark:text-emerald-400",
  unset: "text-muted-foreground",
};

function Metric({
  icon,
  label,
  value,
  sub,
  tone = "unset",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: DueTone;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-muted/50 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-ac-accent">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1 truncate text-sm font-bold", tone === "unset" ? "text-foreground" : TONE_CLS[tone])}>
        {value}
      </p>
      {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function GarageVehicleCard({ vehicle }: { vehicle: GarageVehicle }) {
  const label = vehicleLabel(vehicle);
  const serviceDays = daysUntil(vehicle.next_service_at);
  const insuranceDays = daysUntil(vehicle.insurance_renews_at);
  const verified = vehicle.notes === VERIFIED_OWNERSHIP_NOTE;
  const serviceTone = dueTone(serviceDays);
  const insuranceTone = dueTone(insuranceDays);

  return (
    <article className="group flex flex-col overflow-hidden rounded-[28px] border border-border bg-card transition hover:border-ac-accent/50">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <VehicleImage
          src={null}
          alt={label}
          make={vehicle.make_name}
          model={vehicle.model_name}
          year={vehicle.year}
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ac-ink px-2.5 py-1 text-[11px] font-bold text-white">
              <BadgeCheck className="h-3.5 w-3.5 text-ac-accent" /> Bought on AutoConnect
            </span>
          ) : (
            <span />
          )}
          {vehicle.nickname && (
            <span className="max-w-[60%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ac-ink">
              {vehicle.nickname}
            </span>
          )}
        </div>
        {(serviceTone === "overdue" || insuranceTone === "overdue") && (
          <span className="absolute bottom-3 left-3 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold text-white">
            Needs attention
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-brand text-2xl">{label}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          {vehicle.vin ? "VIN stored privately" : "Add VIN when ready"}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Metric
            icon={<Gauge />}
            label="Mileage"
            value={
              vehicle.mileage != null
                ? `${vehicle.mileage.toLocaleString()} ${vehicle.mileage_unit}`
                : "Not recorded"
            }
          />
          <Metric
            icon={<Wrench />}
            label="Service"
            value={serviceDays === null ? "Set date" : dueLabel(serviceDays)}
            sub={
              vehicle.next_service_at
                ? new Date(vehicle.next_service_at).toLocaleDateString()
                : vehicle.next_service_mileage != null
                  ? `at ${vehicle.next_service_mileage.toLocaleString()} ${vehicle.mileage_unit}`
                  : undefined
            }
            tone={serviceTone}
          />
          <Metric
            icon={<ShieldCheck />}
            label="Insurance"
            value={insuranceDays === null ? "Add date" : dueLabel(insuranceDays)}
            sub={
              vehicle.insurance_renews_at
                ? new Date(vehicle.insurance_renews_at).toLocaleDateString()
                : undefined
            }
            tone={insuranceTone}
          />
        </div>
        {vehicle.next_service_at && vehicle.next_service_mileage != null && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Or at {vehicle.next_service_mileage.toLocaleString()} {vehicle.mileage_unit}, whichever
            comes first
          </p>
        )}
        {vehicle.notes && !verified && (
          <p className="mt-3 line-clamp-2 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground">
            {vehicle.notes}
          </p>
        )}

        <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
          <Link
            to="/passport/$carId"
            params={{ carId: vehicle.id }}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ac-ink px-4 text-sm font-bold text-white transition hover:bg-ac-ink-soft dark:bg-white dark:text-ac-ink dark:hover:bg-white/90"
          >
            Passport
          </Link>
          <Link
            to="/parts"
            search={{ q: `${vehicle.make_name} ${vehicle.model_name}` }}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Parts
          </Link>
          <Link
            to="/services"
            className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold text-foreground underline-offset-4 transition hover:bg-muted hover:underline"
          >
            <Wrench className="h-4 w-4 text-ac-accent" /> Book service for this vehicle
          </Link>
        </div>
      </div>
    </article>
  );
}
