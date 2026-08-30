import React, { useState } from "react";
import { ShieldCheck, Sparkles, Info, CheckCircle2, ChevronRight, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateAutoConnectScore,
  type ScoreVehicleData,
  type AutoConnectScoreResult,
} from "@/lib/autoconnect-score";

interface AutoConnectScoreBadgeProps {
  vehicleData: ScoreVehicleData;
  variant?: "card" | "detail" | "compact";
  className?: string;
  showExplanationLink?: boolean;
}

export function AutoConnectScoreBadge({
  vehicleData,
  variant = "card",
  className = "",
  showExplanationLink = false,
}: AutoConnectScoreBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const result: AutoConnectScoreResult = calculateAutoConnectScore(vehicleData);

  // Variant 1: Compact Circular badge for Listing Cards (Corner overlay)
  if (variant === "card" || variant === "compact") {
    return (
      <>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setModalOpen(true);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-md backdrop-blur-md transition-all hover:scale-105 ${result.badgeBg} ${result.badgeBorder} ${className}`}
              >
                <ShieldCheck className={`h-3.5 w-3.5 ${result.colorClass}`} />
                <span className={`text-xs font-black font-mono ${result.colorClass}`}>
                  {result.score}
                </span>
                <span className="text-[10px] font-semibold text-white/90 hidden sm:inline">
                  Score™
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white border-slate-700 p-2.5 max-w-[200px] text-xs">
              <p className="font-bold flex items-center gap-1 text-teal-400">
                <Sparkles className="h-3 w-3" /> AutoConnect Score: {result.score}/100
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                {result.tierLabel} rating based on inspection, seller vetting & title verification.
              </p>
              <p className="text-[10px] text-teal-300 underline mt-1.5 cursor-pointer">
                Click to view breakdown →
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <ScoreExplanationDialog
          open={modalOpen}
          onOpenChange={setModalOpen}
          result={result}
        />
      </>
    );
  }

  // Variant 2: Prominent Detail Page Score Section with Interactive Breakdown
  return (
    <>
      <div className={`rounded-2xl border ${result.badgeBorder} ${result.badgeBg} p-4 sm:p-5 shadow-sm ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Circular Gauge Score */}
            <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-slate-950/80 border-2 ${result.badgeBorder} shadow-inner`}>
              <span className={`text-xl font-extrabold font-mono ${result.colorClass}`}>
                {result.score}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 -mt-2">
                / 100
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-foreground flex items-center gap-1.5">
                  AutoConnect Score™
                  <Badge variant="outline" className={`text-[10px] font-bold ${result.badgeBorder} ${result.textColor}`}>
                    {result.tierLabel}
                  </Badge>
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI & human-audited trust index based on {result.breakdown.length} verification benchmarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 underline flex items-center gap-1"
            >
              <HelpCircle className="h-3.5 w-3.5" /> What's this score?
            </button>
          </div>
        </div>

        {/* Quick Mini Factor Badges */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-white/10 text-xs">
          {result.breakdown.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="truncate">{item.label}</span>
              <span className="font-mono text-foreground font-bold ml-auto">{item.points}pt</span>
            </div>
          ))}
        </div>
      </div>

      <ScoreExplanationDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        result={result}
      />
    </>
  );
}

function ScoreExplanationDialog({
  open,
  onOpenChange,
  result,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  result: AutoConnectScoreResult;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border-border">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-teal-400" />
            AutoConnect Score™ Breakdown
          </DialogTitle>
          <DialogDescription className="text-xs">
            How we calculate vehicle reliability, seller trust, and paperwork authentication.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Header Score summary */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800 text-white">
            <div>
              <p className="text-xs text-slate-400">Total Trust Rating</p>
              <p className="text-2xl font-black font-mono text-teal-400">{result.score} / 100</p>
            </div>
            <Badge className={`${result.badgeBg} ${result.badgeBorder} ${result.textColor} font-bold text-xs py-1 px-3`}>
              {result.tierLabel}
            </Badge>
          </div>

          {/* Factor Rows */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weighted Factor Breakdown
            </p>
            <div className="space-y-2">
              {result.breakdown.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-border/70 bg-card/60 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                      {item.label}
                    </span>
                    <span className="font-mono font-bold text-teal-400">
                      {item.points} / {item.maxPoints} pts
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pl-5.5">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Score Tier Legend */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
            <p className="font-bold text-foreground">Score Index Tiers:</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span><strong>80-100:</strong> Excellent Trust</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                <span><strong>60-79:</strong> Good Quality</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span><strong>40-59:</strong> Fair Condition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span><strong>&lt; 40:</strong> Limited Info</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
