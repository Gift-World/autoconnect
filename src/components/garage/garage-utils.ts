/** Pure helpers and types for My Garage. */

export type GarageVehicle = {
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

export const VERIFIED_OWNERSHIP_NOTE = "AutoConnect Authenticated Ownership";

/** Whole days from today until `date` (negative when in the past). */
export function daysUntil(date: string | null): number | null {
  if (!date) return null;
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

export type DueTone = "overdue" | "soon" | "ok" | "unset";

export function dueTone(days: number | null): DueTone {
  if (days === null) return "unset";
  if (days < 0) return "overdue";
  if (days <= 30) return "soon";
  return "ok";
}

export function dueLabel(days: number | null): string {
  if (days === null) return "Not set";
  if (days < 0) return `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  if (days <= 60) return `In ${days} days`;
  return `In ${Math.round(days / 30)} months`;
}

export function vehicleLabel(v: GarageVehicle) {
  return `${v.year ? `${v.year} ` : ""}${v.make_name} ${v.model_name ?? ""}`.trim();
}

