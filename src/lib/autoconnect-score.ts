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

  // 1. Auction Grade / Condition (Max 25 pts)
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
    label: "Vehicle Grade & Physical Condition",
    points: conditionPts,
    maxPoints: 25,
    earned: conditionPts >= 18,
    description: data.condition || "Standard Inspection Grade",
  });

  // 2. Photos Uploaded (1pt per photo, max 15 pts)
  const photoCount = data.photosCount ?? 4;
  const photoPts = Math.min(15, Math.max(5, photoCount * 3));
  breakdown.push({
    label: "Multi-Angle Photographic Coverage",
    points: photoPts,
    maxPoints: 15,
    earned: photoPts >= 12,
    description: `${photoCount} verified high-resolution photographs uploaded`,
  });

  // 3. Seller Verification Status (Max 20 pts)
  let sellerPts = 5;
  if (data.isSellerVerified) {
    sellerPts = data.isDealer ? 20 : 18;
  }
  breakdown.push({
    label: "Seller Vetting & Identity Clearance",
    points: sellerPts,
    maxPoints: 20,
    earned: sellerPts >= 18,
    description: data.isSellerVerified ? "Identity & Business KYC Verified" : "Basic Registered Seller",
  });

  // 4. Mileage Documentation & Verification (Max 15 pts)
  let mileagePts = 8;
  if (data.inspectionVerified || (data.mileage && data.mileage < 120000)) {
    mileagePts = 15;
  }
  breakdown.push({
    label: "Odometer & Mileage Verification",
    points: mileagePts,
    maxPoints: 15,
    earned: mileagePts === 15,
    description: data.mileage ? `${data.mileage.toLocaleString()} ${data.mileage_unit || "km"} Verified` : "Self-reported odometer",
  });

  // 5. Import Documents & NTSA Logbook (Max 15 pts)
  let docPts = 6;
  if (data.documentsVerified || data.ntsaVerified) {
    docPts = 15;
  }
  breakdown.push({
    label: "NTSA Title & Customs Duty Clearance",
    points: docPts,
    maxPoints: 15,
    earned: docPts === 15,
    description: data.ntsaVerified ? "NTSA Logbook & Tax Duty Certified" : "Standard documentation uploaded",
  });

  // 6. Seller History & Escrow Track Record (Max 10 pts)
  const sales = data.sellerSalesCount ?? 3;
  const salesPts = Math.min(10, Math.max(5, sales * 2));
  breakdown.push({
    label: "Seller Platform Track Record",
    points: salesPts,
    maxPoints: 10,
    earned: salesPts >= 8,
    description: `${sales}+ successful verified escrow sales completed`,
  });

  // 7. Video Verification Bonus (+10 pts)
  let totalScore = conditionPts + photoPts + sellerPts + mileagePts + docPts + salesPts;
  if (data.hasVideo) {
    totalScore = Math.min(100, totalScore + 10);
    breakdown.push({
      label: "360° Guided Walk-Around Video Bonus",
      points: 10,
      maxPoints: 10,
      earned: true,
      description: "Video walk-around verified by AutoConnect",
    });
  }

  // Cap score to 100
  totalScore = Math.min(100, Math.max(35, totalScore));

  let tier: "excellent" | "good" | "fair" | "limited" = "limited";
  let tierLabel = "Limited Info";
  let colorClass = "text-slate-400";
  let badgeBg = "bg-slate-800/80";
  let badgeBorder = "border-slate-700";
  let textColor = "text-slate-300";

  if (totalScore >= 80) {
    tier = "excellent";
    tierLabel = "Excellent Trust";
    colorClass = "text-emerald-400";
    badgeBg = "bg-emerald-500/15";
    badgeBorder = "border-emerald-500/40";
    textColor = "text-emerald-400";
  } else if (totalScore >= 60) {
    tier = "good";
    tierLabel = "Good Quality";
    colorClass = "text-teal-400";
    badgeBg = "bg-teal-500/15";
    badgeBorder = "border-teal-500/40";
    textColor = "text-teal-300";
  } else if (totalScore >= 40) {
    tier = "fair";
    tierLabel = "Fair Condition";
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
