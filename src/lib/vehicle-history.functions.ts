import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Vehicle-history partner adapters.
 *
 * These functions must never manufacture a result.  A partner's credential and
 * an approved integration are required before its result can be shown as
 * evidence in the product.
 */

export type DvlaMotRecord = {
  registrationNumber: string;
  make: string;
  model: string;
  firstUsedDate: string;
  fuelType: string;
  primaryColour: string;
  motStatus: "Valid" | "Expired" | "No details held";
  motExpiryDate?: string;
  hasAdvisories: boolean;
  totalTestsRecorded: number;
  odometerHistory: { date: string; value: number; unit: "mi" | "km" }[];
  recentTests: {
    completedDate: string;
    testResult: "PASSED" | "FAILED";
    expiryDate?: string;
    odometerValue?: number;
    defects: { text: string; type: "ADVISORY" | "DANGEROUS" | "MAJOR" | "MINOR" }[];
  }[];
  isLiveApi: boolean;
};

export type JapaneseJevicRecord = {
  chassisNumber: string;
  make: string;
  model: string;
  modelCode: string;
  year: number;
  auctionHouse: string;
  auctionGrade: string; // e.g. "4.5 / 5.0"
  interiorGrade: string; // e.g. "B"
  exteriorGrade: string; // e.g. "A"
  radiationChecked: boolean;
  radiationLevel: string; // e.g. "0.08 μSv/h (Safe)"
  odometerVerified: boolean;
  exportOdometerKm: number;
  inspectionCertificateNumber: string;
  issuingAuthority: "JEVIC" | "QISJ" | "EAA" | "CarVX Japan";
  status: "verified" | "clear";
};

export type NtsaTimsRecord = {
  registrationNumber: string;
  logbookNumber: string;
  chassisNumber: string;
  engineNumber: string;
  make: string;
  model: string;
  registeredOwnerType: "Individual" | "Corporate" | "Financier-Linked";
  encumbranceStatus: "CLEAN_NO_CAVEATS" | "FINANCIER_CAVEAT_HELD" | "RESTRICTED";
  financierName?: string;
  roadworthinessExpiry: string;
  dutyPaidStatus: "FULL_DUTY_PAID" | "DUTY_FREE_EXEMPT" | "PENDING_ASSESSMENT";
  status: "verified" | "flagged";
};

export type AkiInsuranceRecord = {
  registrationNumber: string;
  policyStatus: "ACTIVE" | "EXPIRED" | "NONE";
  underwriter: string;
  coverType: "Comprehensive" | "Third Party Only";
  isTotalLossWriteOff: boolean;
  salvageRegistryStatus: "CLEAN_NO_CLAIMS" | "MINOR_REPAIRED" | "TOTAL_LOSS_SALVAGE";
  expiryDate: string;
};

export const checkUkDvlaMot = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        vrmOrVin: z.string().min(3).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<DvlaMotRecord> => {
    const vrm = data.vrmOrVin.toUpperCase().replace(/\s+/g, "");
    const apiKey = process.env.UK_DVLA_MOT_API_KEY;

    if (apiKey) {
      try {
        const res = await fetch(
          `https://beta.check-mot.service.gov.uk/trade/vehicles/mot-tests?registration=${encodeURIComponent(vrm)}`,
          {
            headers: {
              Accept: "application/json+v6",
              "x-api-key": apiKey,
            },
          },
        );
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json[0]) {
            const v = json[0];
            const tests = (v.motTests || []).map((t: any) => ({
              completedDate: t.completedDate,
              testResult: t.testResult,
              expiryDate: t.expiryDate,
              odometerValue: Number(t.odometerValue) || undefined,
              defects: (t.rfrAndComments || []).map((c: any) => ({
                text: c.text,
                type: c.type,
              })),
            }));

            return {
              registrationNumber: v.registration,
              make: v.make,
              model: v.model,
              firstUsedDate: v.firstUsedDate,
              fuelType: v.fuelType,
              primaryColour: v.primaryColour,
              motStatus: tests[0]?.testResult === "PASSED" ? "Valid" : "Expired",
              motExpiryDate: tests[0]?.expiryDate,
              hasAdvisories: tests.some((t: any) => t.defects.length > 0),
              totalTestsRecorded: tests.length,
              odometerHistory: tests
                .filter((t: any) => t.odometerValue)
                .map((t: any) => ({
                  date: t.completedDate.split(" ")[0],
                  value: t.odometerValue,
                  unit: "mi",
                })),
              recentTests: tests.slice(0, 5),
              isLiveApi: true,
            };
          }
        }
      } catch (err) {
        console.warn("DVLA MOT live check failed:", err);
        throw new Error("The official MOT service is temporarily unavailable. Please try again later.");
      }
    }

    throw new Error("MOT checks are not connected yet. No MOT result has been verified.");
  });

export const checkJapaneseJevic = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        chassisNumber: z.string().min(5).max(30),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<JapaneseJevicRecord> => {
    void data;
    throw new Error("JEVIC/CarVX checks are not connected yet. Upload a real inspection certificate for review.");
  });

export const checkNtsaTims = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        regNumber: z.string().min(4).max(12),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<NtsaTimsRecord> => {
    void data;
    throw new Error("NTSA verification is not connected yet. No ownership or clearance result has been verified.");
  });

export const checkAkiInsurance = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        regNumber: z.string().min(4).max(12),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<AkiInsuranceRecord> => {
    void data;
    throw new Error("Insurance verification is not connected yet. No cover or claims result has been verified.");
  });
