import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  Wallet,
  Car,
  KeyRound,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type EscrowMilestoneStep =
  | "deposit_pending"
  | "deposit_paid"
  | "inspection_passed"
  | "full_payment_held"
  | "handover_completed"
  | "funds_released"
  | "disputed";

interface MilestoneConfig {
  key: EscrowMilestoneStep;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  buyerNote: string;
  sellerNote: string;
  icon: typeof ShieldCheck;
}

export const ESCROW_MILESTONES: MilestoneConfig[] = [
  {
    key: "deposit_paid",
    stepNumber: 1,
    label: "Deposit Secured in Escrow",
    shortLabel: "Deposit Paid",
    description: "Deposit funds held in AutoConnect safe escrow vault.",
    buyerNote: "Your initial deposit is protected until independent inspection passes.",
    sellerNote: "Buyer has locked commitment deposit. Ready for inspection check.",
    icon: Wallet,
  },
  {
    key: "inspection_passed",
    stepNumber: 2,
    label: "Vehicle Inspection Passed",
    shortLabel: "Inspection Passed",
    description: "42-point mechanical check and document verification verified.",
    buyerNote: "Digital inspection passport is certified. You can approve to proceed with full balance.",
    sellerNote: "Inspection passed successfully. Buyer is notified to fulfill balance.",
    icon: FileCheck2,
  },
  {
    key: "full_payment_held",
    stepNumber: 3,
    label: "Full Payment in Vault",
    shortLabel: "Full Payment",
    description: "100% purchase amount secured in escrow before vehicle handover.",
    buyerNote: "Your funds remain safe in escrow until you inspect and collect the car.",
    sellerNote: "Full purchase funds are verified and secured. You may issue gate pass.",
    icon: Lock,
  },
  {
    key: "handover_completed",
    stepNumber: 4,
    label: "Vehicle Handover & Gate Pass",
    shortLabel: "Handover / Gate Pass",
    description: "Physical car handover, keys exchanged, and gate pass scanned.",
    buyerNote: "Inspect vehicle in person, sign physical handover slip, and confirm receipt.",
    sellerNote: "Vehicle released to buyer with authorized gate pass.",
    icon: KeyRound,
  },
  {
    key: "funds_released",
    stepNumber: 5,
    label: "Funds Released to Seller",
    shortLabel: "Funds Released",
    description: "Escrow funds unlocked and disbursed to seller account.",
    buyerNote: "Transaction completed successfully. Ownership transferred.",
    sellerNote: "Funds transferred to your registered settlement bank account.",
    icon: CheckCircle2,
  },
];

interface EscrowMilestoneTrackerProps {
  currentStatus?: string;
  onStatusChange?: (newStatus: EscrowMilestoneStep) => void;
  carTitle?: string;
  totalAmount?: string | number;
  currency?: string;
  isSimulated?: boolean;
}

export function EscrowMilestoneTracker({
  currentStatus = "deposit_paid",
  onStatusChange,
  carTitle = "Toyota Land Cruiser Prado TX-L 2021",
  totalAmount = "KES 6,250,000",
  currency = "KES",
  isSimulated = false,
}: EscrowMilestoneTrackerProps) {
  const { activeRole } = useAuth();
  const [internalStatus, setInternalStatus] = useState<EscrowMilestoneStep>(
    (currentStatus as EscrowMilestoneStep) || "deposit_paid"
  );

  const activeStatus = isSimulated ? internalStatus : ((currentStatus as EscrowMilestoneStep) || internalStatus);

  const getCurrentStepIndex = () => {
    switch (activeStatus) {
      case "deposit_pending":
        return 0;
      case "deposit_paid":
        return 1;
      case "inspection_passed":
        return 2;
      case "full_payment_held":
        return 3;
      case "handover_completed":
        return 4;
      case "funds_released":
        return 5;
      case "disputed":
        return 2;
      default:
        return 1;
    }
  };

  const currentStepIdx = getCurrentStepIndex();

  const handleAdvanceState = (nextState: EscrowMilestoneStep) => {
    setInternalStatus(nextState);
    onStatusChange?.(nextState);
    const stepObj = ESCROW_MILESTONES.find((s) => s.key === nextState);
    toast.success(`Escrow Milestone Updated: ${stepObj?.label || nextState}`, {
      description: `Transitioned status to ${nextState.replace(/_/g, " ")}`,
      icon: <Sparkles className="h-4 w-4 text-primary" />,
    });
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">AutoConnect Escrow Milestone Tracker</h3>
              <p className="text-xs text-muted-foreground">
                Buyer protection & automated order-to-cash release protocol
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-primary/30 bg-primary/5 text-primary text-xs">
            <Lock className="h-3 w-3" /> Secure Vault · {totalAmount}
          </Badge>
          {activeStatus === "funds_released" ? (
            <Badge className="bg-emerald-600 text-white text-xs">Completed</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs capitalize">
              Step {Math.min(currentStepIdx, 5)} of 5
            </Badge>
          )}
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="my-6">
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-muted -z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-0"
            style={{
              width: `${Math.min(100, Math.max(0, ((currentStepIdx - 1) / (ESCROW_MILESTONES.length - 1)) * 100))}%`,
            }}
          />

          {/* Steps */}
          <div className="relative z-10 flex justify-between">
            {ESCROW_MILESTONES.map((m, idx) => {
              const isCompleted = idx + 1 < currentStepIdx;
              const isCurrent = idx + 1 === currentStepIdx;
              const isPending = idx + 1 > currentStepIdx;
              const Icon = m.icon;

              return (
                <div
                  key={m.key}
                  className="flex flex-col items-center text-center cursor-pointer group"
                  onClick={() => handleAdvanceState(m.key)}
                >
                  <div
                    className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-2xl border-2 transition-all duration-300 ${
                      isCompleted
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : isCurrent
                        ? "border-primary bg-card text-primary ring-4 ring-primary/20 shadow-md scale-105"
                        : "border-border/80 bg-muted/60 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                  <div className="mt-2 max-w-[80px] sm:max-w-[110px]">
                    <p
                      className={`text-[11px] sm:text-xs font-semibold line-clamp-1 ${
                        isCurrent
                          ? "text-primary"
                          : isCompleted
                          ? "text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {m.shortLabel}
                    </p>
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {isCompleted ? "Verified" : isCurrent ? "In Progress" : "Upcoming"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Milestone Card */}
      {(() => {
        const currentMilestone =
          ESCROW_MILESTONES[Math.min(Math.max(0, currentStepIdx - 1), ESCROW_MILESTONES.length - 1)];
        const StepIcon = currentMilestone.icon;

        return (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <StepIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">
                      Stage {currentMilestone.stepNumber}: {currentMilestone.label}
                    </h4>
                    <Badge className="bg-primary/20 text-primary text-[10px]">Active Stage</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {currentMilestone.description}
                  </p>
                  <p className="mt-2 text-xs font-medium text-foreground/90">
                    {activeRole === "seller" || activeRole === "yard_manager"
                      ? `Seller Guidance: ${currentMilestone.sellerNote}`
                      : `Buyer Guidance: ${currentMilestone.buyerNote}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons based on state */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {currentStepIdx === 1 && (
                  <Button
                    size="sm"
                    onClick={() => handleAdvanceState("inspection_passed")}
                    className="bg-primary text-primary-foreground"
                  >
                    Confirm Inspection Passed <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                {currentStepIdx === 2 && (
                  <Button
                    size="sm"
                    onClick={() => handleAdvanceState("full_payment_held")}
                    className="bg-primary text-primary-foreground"
                  >
                    Lock Full Payment in Vault <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                {currentStepIdx === 3 && (
                  <Button
                    size="sm"
                    onClick={() => handleAdvanceState("handover_completed")}
                    className="bg-primary text-primary-foreground"
                  >
                    Issue Gate Pass & Handover <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                {currentStepIdx === 4 && (
                  <Button
                    size="sm"
                    onClick={() => handleAdvanceState("funds_released")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Release Escrow to Seller <CheckCircle2 className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
                {currentStepIdx === 5 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdvanceState("deposit_paid")}
                  >
                    Reset Demo Flow
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Escrow Trust Assurance Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          Bank-grade escrow: Funds are never paid out until buyer physically accepts vehicle.
        </span>
        <span className="font-mono text-[10px] bg-muted/60 px-2 py-0.5 rounded">
          ESCROW-ID: AC-{Math.abs(carTitle.length * 997).toString().padStart(6, "0")}
        </span>
      </div>
    </div>
  );
}
