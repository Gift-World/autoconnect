// NHTSA vPIC API helpers — free, no key required.
// Docs: https://vpic.nhtsa.dot.gov/api/

const BASE = "https://vpic.nhtsa.dot.gov/api/vehicles";

export interface NhtsaMake {
  Make_ID: number;
  Make_Name: string;
}

export interface NhtsaModel {
  Model_ID: number;
  Model_Name: string;
}

export interface DecodedVin {
  vin: string;
  make?: string;
  model?: string;
  year?: string;
  bodyClass?: string;
  fuelType?: string;
  transmission?: string;
  engineCylinders?: string;
  displacementL?: string;
  driveType?: string;
  manufacturer?: string;
  plant?: string;
  raw: Record<string, string>;
}

/** Cache makes in memory — list is large but static. */
let makesCache: NhtsaMake[] | null = null;

export async function getAllMakes(): Promise<NhtsaMake[]> {
  if (makesCache) return makesCache;
  const res = await fetch(`${BASE}/GetMakesForVehicleType/car?format=json`);
  if (!res.ok) throw new Error("Failed to fetch makes");
  const json = (await res.json()) as { Results: { MakeId: number; MakeName: string }[] };
  makesCache = json.Results.map((r) => ({ Make_ID: r.MakeId, Make_Name: r.MakeName })).sort((a, b) =>
    a.Make_Name.localeCompare(b.Make_Name),
  );
  return makesCache;
}

const modelsCache = new Map<string, NhtsaModel[]>();

export async function getModelsForMake(makeName: string): Promise<NhtsaModel[]> {
  const key = makeName.toLowerCase();
  if (modelsCache.has(key)) return modelsCache.get(key)!;
  const res = await fetch(
    `${BASE}/GetModelsForMake/${encodeURIComponent(makeName)}?format=json`,
  );
  if (!res.ok) throw new Error("Failed to fetch models");
  const json = (await res.json()) as { Results: NhtsaModel[] };
  const models = (json.Results ?? [])
    .map((m) => ({ Model_ID: m.Model_ID, Model_Name: m.Model_Name }))
    .sort((a, b) => a.Model_Name.localeCompare(b.Model_Name));
  modelsCache.set(key, models);
  return models;
}

/** Decode a 17-character VIN. NHTSA returns many fields; we keep the useful ones. */
export async function decodeVin(vin: string): Promise<DecodedVin> {
  const clean = vin.trim().toUpperCase();
  if (clean.length !== 17) throw new Error("VIN must be 17 characters");
  const res = await fetch(`${BASE}/DecodeVinValues/${encodeURIComponent(clean)}?format=json`);
  if (!res.ok) throw new Error("Failed to decode VIN");
  const json = (await res.json()) as { Results: Record<string, string>[] };
  const r = json.Results?.[0] ?? {};
  return {
    vin: clean,
    make: r.Make || undefined,
    model: r.Model || undefined,
    year: r.ModelYear || undefined,
    bodyClass: r.BodyClass || undefined,
    fuelType: r.FuelTypePrimary || undefined,
    transmission: r.TransmissionStyle || undefined,
    engineCylinders: r.EngineCylinders || undefined,
    displacementL: r.DisplacementL || undefined,
    driveType: r.DriveType || undefined,
    manufacturer: r.Manufacturer || undefined,
    plant: r.PlantCountry || undefined,
    raw: r,
  };
}

/** Map NHTSA fuel/body/transmission strings to our DB enums. */
export function normalizeFuel(s?: string): string | undefined {
  if (!s) return undefined;
  const x = s.toLowerCase();
  if (x.includes("electric") && !x.includes("hybrid")) return "electric";
  if (x.includes("hybrid")) return "hybrid";
  if (x.includes("diesel")) return "diesel";
  if (x.includes("gasoline") || x.includes("petrol")) return "petrol";
  return "other";
}

export function normalizeTransmission(s?: string): string | undefined {
  if (!s) return undefined;
  const x = s.toLowerCase();
  if (x.includes("auto")) return "automatic";
  if (x.includes("manual")) return "manual";
  if (x.includes("semi") || x.includes("dual")) return "semi-automatic";
  return undefined;
}

export function normalizeBody(s?: string): string | undefined {
  if (!s) return undefined;
  const x = s.toLowerCase();
  if (x.includes("sedan")) return "sedan";
  if (x.includes("suv") || x.includes("sport utility")) return "suv";
  if (x.includes("hatch")) return "hatchback";
  if (x.includes("pickup") || x.includes("truck")) return "pickup";
  if (x.includes("van") || x.includes("minivan")) return "van";
  if (x.includes("coupe")) return "coupe";
  if (x.includes("wagon")) return "wagon";
  if (x.includes("convertible") || x.includes("roadster")) return "convertible";
  if (x.includes("bus")) return "bus";
  return "other";
}
