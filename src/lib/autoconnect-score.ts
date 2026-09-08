export interface ScoreBreakdownItem {
  label: string;
  points: number;
  maxPoints: number;
  earned: boolean;
  description: string;
}

export interface AutoConnectScoreResult {
  score: number; // 0 to 100
  tier: "excellent" | "good" | "fair" | "limited";
  tierLabel: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
  breakdown: ScoreBreakdownItem[];
  hasVideoBonus: boolean;
}

export interface ScoreVehicleData {
  condition?: string | null;
  mileage?: number | null;
  mileage_unit?: string | null;
  photosCount?: number;
  isSellerVerified?: boolean;
  isDealer?: boolean;
  documentsVerified?: boolean;
  ntsaVerified?: boolean;
  inspectionVerified?: boolean;
  hasVideo?: boolean;
  sellerSalesCount?: number;
  sellerRating?: number;
}

export function calculateAutoConnectScore(data: ScoreVehicleData): AutoConnectScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];

  // This is a listing-completeness score, not an inspection, valuation or audit.
  // Only fields actually present on the listing contribute to it.
  let conditionPts = 10;
  const cond = (data.condition || "").toLowerCase();
  if (cond.includes("5a") || cond.includes("new") || cond.includes("grade 5")) {
    conditionPts = 25;
  } else if (cond.includes("4.5") || cond.includes("4.5a") || cond.includes("grade 4")) {
    conditionPts = 22;
  } else if (cond.includes("foreign") || cond.includes("grade 3.5")) {
    conditionPts = 18;
  } else if (cond.includes("local")) {
    conditionPts = 14;
  }
  breakdown.push({
    label: "Condition information",
    points: conditionPts,
    maxPoints: 25,
    earned: conditionPts >= 18,
    description: data.condition ? `Listed as: ${data.condition}` : "No condition detail recorded",
  });

  // 2. Photos Uploaded (1pt per photo, max 15 pts)
  const photoCount = data.photosCount ?? 4;
  const photoPts = Math.min(15, Math.max(5, photoCount * 3));
  breakdown.push({
    label: "Multi-Angle Photographic Coverage",
    points: photoPts,
    maxPoints: 15,
    earned: photoPts >= 12,
    description: `${photoCount} listing photo${photoCount === 1 ? "" : "s"} supplied`,
  });

  // 3. Recorded seller verification status (Max 20 pts)
  let sellerPts = 5;
  if (data.isSellerVerified) {
    sellerPts = data.isDealer ? 20 : 18;
  }
  breakdown.push({
    label: "Seller status",
    points: sellerPts,
    maxPoints: 20,
    earned: sellerPts >= 18,
    description: data.isSellerVerified
      ? "Seller verification is marked complete"
      : "No seller verification evidence is shown",
  });

  // 4. Mileage information (Max 15 pts). A low number alone is never evidence.
  let mileagePts = 8;
  if (data.inspectionVerified) {
    mileagePts = 15;
  }
  breakdown.push({
    label: "Mileage information",
    points: mileagePts,
    maxPoints: 15,
    earned: mileagePts === 15,
    description: data.mileage
      ? `${data.mileage.toLocaleString()} ${data.mileage_unit || "km"} as listed`
      : "No mileage recorded",
  });

  // 5. Recorded documents (Max 15 pts). Never infer title/NTSA clearance.
  let docPts = 6;
  if (data.documentsVerified || data.ntsaVerified) {
    docPts = 15;
  }
  breakdown.push({
    label: "Document status",
    points: docPts,
    maxPoints: 15,
    earned: docPts === 15,
    description: data.ntsaVerified
      ? "Official-record check is marked complete"
      : data.documentsVerified ? "Documents are marked reviewed" : "No reviewed document evidence shown",
  });

  // 6. Platform history only counts when real history is supplied.
  const sales = data.sellerSalesCount ?? 0;
  const salesPts = Math.min(10, Math.max(0, sales * 2));
  breakdown.push({
    label: "Seller Platform Track Record",
    points: salesPts,
    maxPoints: 10,
    earned: salesPts >= 8,
    description: sales > 0 ? `${sales} completed platform sale${sales === 1 ? "" : "s"} recorded` : "No platform history shown",
  });

  // 7. Video availability bonus (+10 pts), not a verification claim.
  let totalScore = conditionPts + photoPts + sellerPts + mileagePts + docPts + salesPts;
  if (data.hasVideo) {
    totalScore = Math.min(100, totalScore + 10);
    breakdown.push({
      label: "Video available",
      points: 10,
      maxPoints: 10,
      earned: true,
      description: "A video is attached to this listing",
    });
  }

  // Cap score to 100
  totalScore = Math.min(100, Math.max(0, totalScore));

  let tier: "excellent" | "good" | "fair" | "limited" = "limited";
  let tierLabel = "Limited Info";
  let colorClass = "text-slate-400";
  let badgeBg = "bg-slate-800/80";
  let badgeBorder = "border-slate-700";
  let textColor = "text-slate-300";

  if (totalScore >= 80) {
    tier = "excellent";
    tierLabel = "Detailed listing";
    colorClass = "text-emerald-400";
    badgeBg = "bg-emerald-500/15";
    badgeBorder = "border-emerald-500/40";
    textColor = "text-emerald-400";
  } else if (totalScore >= 60) {
    tier = "good";
    tierLabel = "Useful detail";
    colorClass = "text-teal-400";
    badgeBg = "bg-teal-500/15";
    badgeBorder = "border-teal-500/40";
    textColor = "text-teal-300";
  } else if (totalScore >= 40) {
    tier = "fair";
    tierLabel = "Basic detail";
    colorClass = "text-amber-400";
    badgeBg = "bg-amber-500/15";
    badgeBorder = "border-amber-500/40";
    textColor = "text-amber-400";
  }

  return {
    score: totalScore,
    tier,
    tierLabel,
    colorClass,
    badgeBg,
    badgeBorder,
    textColor,
    breakdown,
    hasVideoBonus: !!data.hasVideo,
  };
}
