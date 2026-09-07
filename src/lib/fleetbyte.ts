import { getAllMakes, getModelsForMake } from "./nhtsa";

/**
 * fleetByte Catalog API Wrapper
 * Provides vehicle makes, models, years, and variants.
 * Falls back to NHTSA vPIC if the fleetByte API key is missing or the request fails.
 */

const FLEETBYTE_API_KEY = import.meta.env.VITE_FLEETBYTE_API_KEY;
const BASE_URL = "https://api.fleetbyte.com/v1"; // Assumed URL, requires confirmation

export interface FleetByteMake {
  id: string;
  name: string;
}

export interface FleetByteModel {
  id: string;
  name: string;
}

export interface FleetByteVariant {
  id: string;
  name: string;
  year: number;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  engine_size?: string;
}

/**
 * Get all vehicle makes from fleetByte, falling back to NHTSA if unavailable.
 */
export async function getFleetByteMakes(): Promise<{ id: string; name: string }[]> {
  if (FLEETBYTE_API_KEY) {
    try {
      const res = await fetch(`${BASE_URL}/makes`, {
        headers: {
          Authorization: `Bearer ${FLEETBYTE_API_KEY}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data.makes.map((m: any) => ({ id: m.id, name: m.name }));
      }
    } catch (error) {
      console.warn("fleetByte makes failed, falling back to NHTSA", error);
    }
  }

  // Fallback to NHTSA
  const nhtsaMakes = await getAllMakes();
  return nhtsaMakes.map((m) => ({ id: String(m.Make_ID), name: m.Make_Name }));
}

/**
 * Get models for a specific make from fleetByte, falling back to NHTSA.
 */
export async function getFleetByteModels(makeName: string): Promise<{ id: string; name: string }[]> {
  if (FLEETBYTE_API_KEY) {
    try {
      const res = await fetch(`${BASE_URL}/models?make=${encodeURIComponent(makeName)}`, {
        headers: {
          Authorization: `Bearer ${FLEETBYTE_API_KEY}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        return data.models.map((m: any) => ({ id: m.id, name: m.name }));
      }
    } catch (error) {
      console.warn("fleetByte models failed, falling back to NHTSA", error);
    }
  }

  // Fallback to NHTSA
  const nhtsaModels = await getModelsForMake(makeName);
  return nhtsaModels.map((m) => ({ id: String(m.Model_ID), name: m.Model_Name }));
}

/**
 * Get variants (trims) for a specific make, model, and year.
 * NHTSA does not provide variant data in the same way, so this returns an empty array if fleetByte fails.
 */
export async function getFleetByteVariants(
  makeName: string,
  modelName: string,
  year: number
): Promise<FleetByteVariant[]> {
  if (!FLEETBYTE_API_KEY) return [];

  try {
    const res = await fetch(
      `${BASE_URL}/variants?make=${encodeURIComponent(makeName)}&model=${encodeURIComponent(
        modelName
      )}&year=${year}`,
      {
        headers: {
          Authorization: `Bearer ${FLEETBYTE_API_KEY}`,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.variants;
    }
  } catch (error) {
    console.warn("fleetByte variants failed", error);
  }

  return [];
}
