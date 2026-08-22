import { createServerFn } from "@tanstack/react-start";

/**
 * Buyer-safe vehicle passport data.
 * Runs server-side and deliberately projects ONLY non-sensitive fields:
 * no document URLs, ID/chassis numbers, admin notes, fraud notes or personal data.
 */
export const getVehiclePassport = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const carId = (input as { carId?: string } | undefined)?.carId;
    if (!carId || typeof carId !== "string") throw new Error("carId is required");
    return { carId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { carId } = data;

    const { data: car } = await supabaseAdmin
      .from("cars")
      .select(
        "id, seller_id, documents_verified, ntsa_verified, inspection_verified, verification_level, sellers(id, business_name, verification_badge, is_verified, created_at)",
      )
      .eq("id", carId)
      .maybeSingle();
    if (!car) return null;

    const seller = (car as any).sellers ?? null;

    const [{ data: cv }, { data: sv }, { data: insp }] = await Promise.all([
      supabaseAdmin
        .from("car_verifications")
        .select(
          "status, documents_verified, documents_verified_at, documents_verified_by, ntsa_verified, ntsa_verified_at, ntsa_verified_by, import_duties_verified, is_imported, has_financing, has_accident_history, accident_severity, encumbrance_found, ownership_mismatch, insurance_expiry, inspection_expiry, road_license_expiry, updated_at",
        )
        .eq("car_id", carId)
        .maybeSingle(),
      seller?.id
        ? supabaseAdmin
            .from("seller_verifications")
            .select("status, identity_verified, identity_verified_at, identity_verified_by")
            .eq("seller_id", seller.id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabaseAdmin
        .from("inspections")
        .select(
          "mechanic_verdict, overall_condition_score, buyer_summary, checklist, completed_at, status, admin_approved",
        )
        .eq("car_id", carId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Resolve verifier display names (AutoConnect staff first names only).
    const verifierIds = [
      cv?.documents_verified_by,
      cv?.ntsa_verified_by,
      sv?.identity_verified_by,
    ].filter(Boolean) as string[];
    const names: Record<string, string> = {};
    if (verifierIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", verifierIds);
      for (const p of profs ?? []) {
        const first = (p.full_name ?? "").trim().split(/\s+/)[0];
        names[p.id] = first ? `AutoConnect · ${first}` : "AutoConnect team";
      }
    }

    const approved = insp?.admin_approved === true;
    const checklist = approved ? ((insp?.checklist as any) ?? {}) : {};
    const items: Record<string, boolean> = checklist.items ?? {};
    const sections = ["mechanical", "electrical", "body", "extras"] as const;
    const sectionSummary = sections.map((key) => {
      const entries = Object.entries(items).filter(([k]) => k.startsWith(`${key}.`));
      return {
        key,
        total: entries.length,
        passed: entries.filter(([, v]) => v).length,
      };
    });

    const tyres = approved ? (checklist.tyres ?? null) : null;

    return {
      verificationLevel: car.verification_level ?? 0,
      seller: {
        name: seller?.business_name ?? null,
        verified: !!seller?.verification_badge,
        status: sv?.status ?? null,
        verifiedAt: sv?.identity_verified_at ?? null,
        verifiedBy: sv?.identity_verified_by ? (names[sv.identity_verified_by] ?? "AutoConnect team") : null,
        memberSince: seller?.created_at ?? null,
      },
      documents: {
        verified: !!car.documents_verified,
        status: cv?.status ?? null,
        verifiedAt: cv?.documents_verified_at ?? null,
        verifiedBy: cv?.documents_verified_by ? (names[cv.documents_verified_by] ?? "AutoConnect team") : null,
      },
      ntsa: {
        verified: !!car.ntsa_verified,
        status: cv?.status ?? null,
        verifiedAt: cv?.ntsa_verified_at ?? null,
        verifiedBy: cv?.ntsa_verified_by ? (names[cv.ntsa_verified_by] ?? "AutoConnect team") : null,
      },
      ownership: {
        clean: !!cv && !cv.encumbrance_found && !cv.ownership_mismatch,
        encumbranceFound: !!cv?.encumbrance_found,
        nameMismatch: !!cv?.ownership_mismatch,
        financed: !!cv?.has_financing,
        imported: !!cv?.is_imported,
        importDutiesVerified: !!cv?.import_duties_verified,
        insuranceExpiry: cv?.insurance_expiry ?? null,
        inspectionCertExpiry: cv?.inspection_expiry ?? null,
        roadLicenseExpiry: cv?.road_license_expiry ?? null,
      },
      history: {
        hasAccidentHistory: !!cv?.has_accident_history,
        accidentSeverity: cv?.accident_severity ?? null,
      },
      inspection: approved
        ? {
            done: !!car.inspection_verified,
            verdict: insp?.mechanic_verdict ?? null,
            score: insp?.overall_condition_score ?? null,
            summary: insp?.buyer_summary ?? null,
            completedAt: insp?.completed_at ?? null,
            sections: sectionSummary,
            tyres: tyres
              ? {
                  condition: tyres.condition ?? null,
                  size: tyres.size ?? null,
                  spare_present: !!tyres.spare_present,
                }
              : null,
          }
        : {
            done: false,
            verdict: null,
            score: null,
            summary: null,
            completedAt: null,
            pending: insp?.status === "scheduled" || insp?.status === "in_progress" || insp?.status === "completed",
            sections: [],
            tyres: null,
          },
    };
  });

export type VehiclePassportData = Awaited<ReturnType<typeof getVehiclePassport>>;

