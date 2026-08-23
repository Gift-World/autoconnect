/**
 * Kenya Revenue Authority (KRA) Current Retail Selling Price (CRSP) & Import Duty Calculator Engine
 *
 * Implements the East African Community (EAC) Customs Management Act & KRA standard motor vehicle tax schedules:
 * - Age-based Depreciation Schedule (from year of first registration)
 * - Import Duty (ID): 35% of Customs Value (CIF)
 * - Excise Duty (ED): Progressive rate based on Engine Displacement (CC) & Fuel Type
 *     * <= 1500cc: 20%
 *     * 1501cc - 2500cc: 25%
 *     * 2501cc - 3000cc: 30%
 *     * > 3000cc: 35%
 *     * Electric / Hybrid (EV/PHEV): 10%
 * - Value Added Tax (VAT): 16% of (Customs Value + Import Duty + Excise Duty)
 * - Import Declaration Fee (IDF): 3.5% of Customs Value
 * - Railway Development Levy (RDL): 2.0% of Customs Value
 * - Port CFS & Clearing charges estimation
 */

export type CrspVehicleModel = {
  make: string;
  model: string;
  bodyType: "SUV" | "Sedan" | "Hatchback" | "Station Wagon" | "Pickup" | "Van";
  engineCc: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  baseNewCrspKes: number; // Brand new showroom benchmark in KES
};

export const POPULAR_CRSP_DATABASE: CrspVehicleModel[] = [
  { make: "Toyota", model: "Land Cruiser Prado TX/TZ", bodyType: "SUV", engineCc: 2700, fuelType: "petrol", baseNewCrspKes: 12500000 },
  { make: "Toyota", model: "Land Cruiser Prado Diesel", bodyType: "SUV", engineCc: 2800, fuelType: "diesel", baseNewCrspKes: 13800000 },
  { make: "Toyota", model: "Land Cruiser LC300 / V8", bodyType: "SUV", engineCc: 3500, fuelType: "petrol", baseNewCrspKes: 26000000 },
  { make: "Toyota", model: "RAV4 (G / X / Adventure)", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 7200000 },
  { make: "Toyota", model: "RAV4 Hybrid", bodyType: "SUV", engineCc: 2500, fuelType: "hybrid", baseNewCrspKes: 7800000 },
  { make: "Toyota", model: "Harrier (Premium / Elegance)", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 6800000 },
  { make: "Toyota", model: "Premio / Allion (1.5L - 2.0L)", bodyType: "Sedan", engineCc: 1800, fuelType: "petrol", baseNewCrspKes: 4200000 },
  { make: "Toyota", model: "Corolla Fielder / Axio", bodyType: "Station Wagon", engineCc: 1500, fuelType: "petrol", baseNewCrspKes: 3300000 },
  { make: "Toyota", model: "Corolla Cross Hybrid", bodyType: "SUV", engineCc: 1800, fuelType: "hybrid", baseNewCrspKes: 5600000 },
  { make: "Toyota", model: "Vitz / Yaris (1.0L - 1.3L)", bodyType: "Hatchback", engineCc: 1300, fuelType: "petrol", baseNewCrspKes: 2200000 },
  { make: "Toyota", model: "Hilux Double Cab D-4D", bodyType: "Pickup", engineCc: 2400, fuelType: "diesel", baseNewCrspKes: 7900000 },
  { make: "Toyota", model: "Hiace Van / Super GL", bodyType: "Van", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 4800000 },

  { make: "Subaru", model: "Forester (XT / XS / Sport)", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 5900000 },
  { make: "Subaru", model: "Outback (Limited / Touring)", bodyType: "Station Wagon", engineCc: 2500, fuelType: "petrol", baseNewCrspKes: 6400000 },
  { make: "Subaru", model: "XV / Crosstrek", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 4700000 },
  { make: "Subaru", model: "Impreza Sport", bodyType: "Hatchback", engineCc: 1600, fuelType: "petrol", baseNewCrspKes: 3100000 },

  { make: "Mazda", model: "CX-5 (20S / 25S / XD)", bodyType: "SUV", engineCc: 2200, fuelType: "diesel", baseNewCrspKes: 5800000 },
  { make: "Mazda", model: "CX-3 / CX-30", bodyType: "SUV", engineCc: 1500, fuelType: "petrol", baseNewCrspKes: 3900000 },
  { make: "Mazda", model: "Demio / Mazda 2", bodyType: "Hatchback", engineCc: 1300, fuelType: "petrol", baseNewCrspKes: 2100000 },
  { make: "Mazda", model: "Axela / Mazda 3", bodyType: "Sedan", engineCc: 1500, fuelType: "petrol", baseNewCrspKes: 3200000 },

  { make: "Nissan", model: "X-Trail (20X / Hybrid)", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 4900000 },
  { make: "Nissan", model: "Note / Note e-Power", bodyType: "Hatchback", engineCc: 1200, fuelType: "hybrid", baseNewCrspKes: 2300000 },
  { make: "Nissan", model: "Navara Double Cab", bodyType: "Pickup", engineCc: 2500, fuelType: "diesel", baseNewCrspKes: 6800000 },

  { make: "Mercedes-Benz", model: "C-Class (C180 / C200)", bodyType: "Sedan", engineCc: 1991, fuelType: "petrol", baseNewCrspKes: 9800000 },
  { make: "Mercedes-Benz", model: "E-Class (E220d / E250)", bodyType: "Sedan", engineCc: 1950, fuelType: "diesel", baseNewCrspKes: 14200000 },
  { make: "Mercedes-Benz", model: "GLE 350d / 450", bodyType: "SUV", engineCc: 2987, fuelType: "diesel", baseNewCrspKes: 21000000 },

  { make: "BMW", model: "X3 (xDrive 20d / 20i)", bodyType: "SUV", engineCc: 1995, fuelType: "diesel", baseNewCrspKes: 10400000 },
  { make: "BMW", model: "X5 (xDrive 30d / 40i)", bodyType: "SUV", engineCc: 2993, fuelType: "diesel", baseNewCrspKes: 18500000 },
  { make: "BMW", model: "3 Series (320i / 320d)", bodyType: "Sedan", engineCc: 1998, fuelType: "petrol", baseNewCrspKes: 8900000 },

  { make: "Volkswagen", model: "Golf (TSI / Highline)", bodyType: "Hatchback", engineCc: 1400, fuelType: "petrol", baseNewCrspKes: 3700000 },
  { make: "Volkswagen", model: "Tiguan Allspace", bodyType: "SUV", engineCc: 2000, fuelType: "petrol", baseNewCrspKes: 7600000 },
  { make: "Volkswagen", model: "Touareg V6 TDI", bodyType: "SUV", engineCc: 2967, fuelType: "diesel", baseNewCrspKes: 16500000 },

  { make: "Land Rover", model: "Range Rover Sport SDV6", bodyType: "SUV", engineCc: 2993, fuelType: "diesel", baseNewCrspKes: 24000000 },
  { make: "Land Rover", model: "Defender 110", bodyType: "SUV", engineCc: 2996, fuelType: "petrol", baseNewCrspKes: 22000000 },
  { make: "Land Rover", model: "Discovery 5", bodyType: "SUV", engineCc: 2993, fuelType: "diesel", baseNewCrspKes: 17500000 },

  { make: "Isuzu", model: "D-Max Double Cab 3.0L", bodyType: "Pickup", engineCc: 2999, fuelType: "diesel", baseNewCrspKes: 7400000 },
  { make: "Mitsubishi", model: "Outlander (PHEV / 24G)", bodyType: "SUV", engineCc: 2400, fuelType: "hybrid", baseNewCrspKes: 5100000 },
];

/**
 * Standard KRA Depreciation Schedule Table
 * Maximum vehicle age allowed for import into Kenya is 8 years.
 */
export function getKraDepreciationRate(yearOfManufacture: number, currentYear = 2026): {
  ageYears: number;
  depreciationPercent: number;
  residualPercent: number;
  isEligibleForKenya: boolean;
} {
  const age = Math.max(0, currentYear - yearOfManufacture);
  let dep = 0;

  if (age === 0) dep = 10;
  else if (age === 1) dep = 20;
  else if (age === 2) dep = 30;
  else if (age === 3) dep = 40;
  else if (age === 4) dep = 50;
  else if (age === 5) dep = 60;
  else if (age === 6) dep = 70;
  else if (age === 7) dep = 75;
  else if (age === 8) dep = 80;
  else dep = 85; // >8 years (ineligible for general commercial import in Kenya)

  return {
    ageYears: age,
    depreciationPercent: dep,
    residualPercent: 100 - dep,
    isEligibleForKenya: age <= 8,
  };
}

/**
 * Determine Excise Duty Rate according to KRA schedule
 */
export function getKraExciseDutyRate(engineCc: number, fuelType: "petrol" | "diesel" | "hybrid" | "electric"): number {
  if (fuelType === "electric" || fuelType === "hybrid") {
    return 0.10; // 10% green incentive
  }
  if (engineCc <= 1500) return 0.20; // 20%
  if (engineCc <= 2500) return 0.25; // 25%
  if (engineCc <= 3000) return 0.30; // 30%
  return 0.35; // 35% for >3000cc
}

export type KraDutyBreakdown = {
  make: string;
  model: string;
  yearOfManufacture: number;
  engineCc: number;
  fuelType: "petrol" | "diesel" | "hybrid" | "electric";
  baseNewCrspKes: number;
  depreciationPercent: number;
  residualPercent: number;
  isEligibleForKenya: boolean;
  ageYears: number;

  // Values in KES
  customsValueKes: number;
  importDutyKes: number;
  exciseDutyKes: number;
  vatKes: number;
  idfKes: number;
  rdlKes: number;
  totalKraTaxesKes: number;

  // Port & Clearance Estimates
  portCfsFeesKes: number;
  clearingAgentFeesKes: number;
  registrationNumberPlatesKes: number;
  totalClearingAndPortKes: number;

  // Grand Total
  totalDutyAndClearingKes: number;
  estimatedUsdEquivalent: number;
};

const USD_TO_KES_ESTIMATE = 130.0;

export function calculateKraDuty({
  make,
  model,
  yearOfManufacture,
  engineCc,
  fuelType = "petrol",
  customCrspKes,
  currentYear = 2026,
}: {
  make: string;
  model: string;
  yearOfManufacture: number;
  engineCc: number;
  fuelType?: "petrol" | "diesel" | "hybrid" | "electric";
  customCrspKes?: number;
  currentYear?: number;
}): KraDutyBreakdown {
  // 1. Resolve Base CRSP
  let baseCrsp = customCrspKes;
  if (!baseCrsp) {
    const found = POPULAR_CRSP_DATABASE.find(
      (v) =>
        v.make.toLowerCase() === make.toLowerCase() &&
        (v.model.toLowerCase().includes(model.toLowerCase()) ||
          model.toLowerCase().includes(v.model.toLowerCase())),
    );
    baseCrsp = found?.baseNewCrspKes || (engineCc > 2500 ? 8000000 : 4500000);
  }

  // 2. Compute Depreciation
  const { ageYears, depreciationPercent, residualPercent, isEligibleForKenya } =
    getKraDepreciationRate(yearOfManufacture, currentYear);

  const customsValueKes = Math.round((baseCrsp * residualPercent) / 100);

  // 3. Tax Components
  // Import Duty = 35% of Customs Value
  const importDutyKes = Math.round(customsValueKes * 0.35);

  // Excise Duty = % of (Customs Value + Import Duty)
  const exciseRate = getKraExciseDutyRate(engineCc, fuelType);
  const exciseBase = customsValueKes + importDutyKes;
  const exciseDutyKes = Math.round(exciseBase * exciseRate);

  // VAT = 16% of (Customs Value + Import Duty + Excise Duty)
  const vatBase = customsValueKes + importDutyKes + exciseDutyKes;
  const vatKes = Math.round(vatBase * 0.16);

  // IDF = 3.5% of Customs Value
  const idfKes = Math.round(customsValueKes * 0.035);

  // RDL = 2.0% of Customs Value
  const rdlKes = Math.round(customsValueKes * 0.02);

  const totalKraTaxesKes =
    importDutyKes + exciseDutyKes + vatKes + idfKes + rdlKes;

  // 4. Local Port, CFS & Clearing Agent estimates (Mombasa/Nairobi ICD)
  const portCfsFeesKes = 85000;
  const clearingAgentFeesKes = 45000;
  const registrationNumberPlatesKes = 12500;
  const totalClearingAndPortKes =
    portCfsFeesKes + clearingAgentFeesKes + registrationNumberPlatesKes;

  const totalDutyAndClearingKes = totalKraTaxesKes + totalClearingAndPortKes;
  const estimatedUsdEquivalent = Math.round(
    totalDutyAndClearingKes / USD_TO_KES_ESTIMATE,
  );

  return {
    make,
    model,
    yearOfManufacture,
    engineCc,
    fuelType,
    baseNewCrspKes: baseCrsp,
    depreciationPercent,
    residualPercent,
    isEligibleForKenya,
    ageYears,
    customsValueKes,
    importDutyKes,
    exciseDutyKes,
    vatKes,
    idfKes,
    rdlKes,
    totalKraTaxesKes,
    portCfsFeesKes,
    clearingAgentFeesKes,
    registrationNumberPlatesKes,
    totalClearingAndPortKes,
    totalDutyAndClearingKes,
    estimatedUsdEquivalent,
  };
}

export function listCrspMakes(): string[] {
  return Array.from(new Set(POPULAR_CRSP_DATABASE.map((v) => v.make))).sort();
}

export function listCrspModelsForMake(make: string): CrspVehicleModel[] {
  return POPULAR_CRSP_DATABASE.filter(
    (v) => v.make.toLowerCase() === make.toLowerCase(),
  );
}
