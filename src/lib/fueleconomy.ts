/**
 * FuelEconomy.gov API Wrapper
 * Docs: https://www.fueleconomy.gov/feg/ws/index.shtml
 */

const BASE_URL = "https://www.fueleconomy.gov/ws/rest";

export interface FuelEconomyVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  engineSize?: string;
  cylinders?: string;
  cityMpg?: number;
  highwayMpg?: number;
  combMpg?: number;
  fuelType?: string;
  trany?: string;
}

/**
 * Searches for vehicle options by year, make, and model to get the Vehicle ID.
 */
export async function searchFuelEconomyVehicles(
  year: number,
  make: string,
  model: string
): Promise<string[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/vehicle/menu/options?year=${year}&make=${encodeURIComponent(
        make
      )}&model=${encodeURIComponent(model)}`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return [];

    const data = await res.json();
    
    // The API might return a single object or an array of objects in menuItem
    if (!data.menuItem) return [];
    
    const items = Array.isArray(data.menuItem) ? data.menuItem : [data.menuItem];
    return items.map((item: any) => item.value);
  } catch (error) {
    console.error("FuelEconomy search error:", error);
    return [];
  }
}

/**
 * Gets detailed vehicle specs by FuelEconomy Vehicle ID.
 */
export async function getFuelEconomyVehicleDetails(
  vehicleId: string
): Promise<FuelEconomyVehicle | null> {
  try {
    const res = await fetch(`${BASE_URL}/vehicle/${vehicleId}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      id: vehicleId,
      make: data.make,
      model: data.model,
      year: parseInt(data.year, 10),
      engineSize: data.displ,
      cylinders: data.cylinders,
      cityMpg: parseInt(data.city08, 10),
      highwayMpg: parseInt(data.highway08, 10),
      combMpg: parseInt(data.comb08, 10),
      fuelType: data.fuelType1,
      trany: data.trany,
    };
  } catch (error) {
    console.error("FuelEconomy details error:", error);
    return null;
  }
}
