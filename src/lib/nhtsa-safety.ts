/**
 * NHTSA Safety Ratings API Wrapper
 * Docs: https://api.nhtsa.gov/SafetyRatings/
 */

const BASE_URL = "https://api.nhtsa.gov/SafetyRatings";

export interface NhtsaSafetyRating {
  VehicleId: number;
  VehicleDescription: string;
  OverallRating: string;
  OverallFrontCrashRating: string;
  OverallSideCrashRating: string;
  RolloverRating: string;
  RolloverPossibility: number;
  ComplaintsCount: number;
  RecallsCount: number;
  InvestigationCount: number;
}

/**
 * Get VehicleId for a specific year, make, model
 */
export async function getSafetyVehicleId(
  year: number,
  make: string,
  model: string
): Promise<number | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/modelyear/${year}/make/${encodeURIComponent(
        make
      )}/model/${encodeURIComponent(model)}?format=json`
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (data.Results && data.Results.length > 0) {
      return data.Results[0].VehicleId;
    }
  } catch (error) {
    console.error("NHTSA Safety VehicleId fetch error:", error);
  }
  return null;
}

/**
 * Get Safety Ratings by VehicleId
 */
export async function getSafetyRatings(
  vehicleId: number
): Promise<NhtsaSafetyRating | null> {
  try {
    const res = await fetch(`${BASE_URL}/VehicleId/${vehicleId}?format=json`);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.Results && data.Results.length > 0) {
      return data.Results[0];
    }
  } catch (error) {
    console.error("NHTSA Safety Ratings fetch error:", error);
  }
  return null;
}
