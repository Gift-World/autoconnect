// Guided listing requirements — shared between seller UI and admin review.

export type PhotoKind =
  | "front"
  | "back"
  | "driver_side"
  | "passenger_side"
  | "dashboard"
  | "cluster"
  | "engine_bay"
  | "chassis"
  | "engine_number"
  | "chassis_number"
  | "boot"
  | "front_interior"
  | "back_interior"
  | "roof_interior"
  | "tyre"
  | "spare_tyre";

export const REQUIRED_PHOTO_KINDS: PhotoKind[] = [
  "front",
  "back",
  "driver_side",
  "passenger_side",
  "dashboard",
  "cluster",
  "engine_bay",
  "chassis",
  "engine_number",
  "chassis_number",
  "boot",
  "front_interior",
  "back_interior",
  "roof_interior",
  "tyre",
];

export const OPTIONAL_PHOTO_KINDS: PhotoKind[] = ["spare_tyre"];

export const PHOTO_LABELS: Record<PhotoKind, string> = {
  front: "Front",
  back: "Back",
  driver_side: "Driver side",
  passenger_side: "Passenger side",
  dashboard: "Dashboard",
  cluster: "Instrument cluster",
  engine_bay: "Engine bay",
  chassis: "Chassis / frame",
  engine_number: "Engine number",
  chassis_number: "Chassis number",
  boot: "Boot / trunk",
  front_interior: "Front interior",
  back_interior: "Back interior",
  roof_interior: "Roof / interior ceiling",
  tyre: "Tyres",
  spare_tyre: "Spare tyre (if available)",
};

export type RequiredDocKind = "logbook" | "seller_id" | "insurance" | "inspection";

export const REQUIRED_DOC_KINDS: RequiredDocKind[] = [
  "logbook",
  "seller_id",
  "insurance",
  "inspection",
];

export const DOC_LABELS: Record<string, string> = {
  logbook: "Logbook",
  seller_id: "Seller ID",
  insurance: "Insurance certificate",
  inspection: "Inspection certificate",
  title: "Title / Ownership",
  registration: "Registration",
  export_cert: "Export certificate",
  customs: "Customs / Duty",
  other: "Other",
};

export function missingPhotoKinds(present: (string | null | undefined)[]): PhotoKind[] {
  const set = new Set(present.filter(Boolean) as string[]);
  return REQUIRED_PHOTO_KINDS.filter((k) => !set.has(k));
}

export function missingDocKinds(present: (string | null | undefined)[]): RequiredDocKind[] {
  const set = new Set(present.filter(Boolean) as string[]);
  return REQUIRED_DOC_KINDS.filter((k) => !set.has(k));
}
