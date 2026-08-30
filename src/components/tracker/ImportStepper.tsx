import React from "react";
import {
  Ship,
  CheckCircle2,
  Clock,
  CircleDot,
  MapPin,
  Calendar,
  Anchor,
  FileCheck2,
  Truck,
  Sparkles,
  ShieldCheck,
  Plane,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ImportStage {
  step: number;
  title: string;
  location: string;
  status: "completed" | "active" | "upcoming";
  date?: string;
  notes?: string;
}

export const DEFAULT_IMPORT_STAGES: ImportStage[] = [
  { step: 1, title: "Purchased at Auction", location: "USS Tokyo Auction, Japan", status: "completed", date: "Aug 12, 2026", notes: "Grade 4.5A verified. Original export certificate issued." },
  { step: 2, title: "Inland Transport to Port", location: "Yokohama Terminal", status: "completed", date: "Aug 15, 2026", notes: "Pre-shipment radiation & JEVIC odometer verification passed." },
  { step: 3, title: "Vessel Loading (Yokohama)", location: "Port of Yokohama, Berth 4", status: "completed", date: "Aug 18, 2026", notes: "Loaded onto RoRo Carrier MV Hoegh Target." },
  { step: 4, title: "In Transit (Indian Ocean)", location: "Indian Ocean Route · 14 Days Rem.", status: "active", date: "ETA Sep 04, 2026", notes: "Vessel cruising at 16.5 knots towards Port of Mombasa." },
  { step: 5, title: "Arrived at Mombasa Port", location: "Kilindini Harbour, Mombasa", status: "upcoming", date: "Est. Sep 05, 2026", notes: "Vessel discharge & port tally preparation." },
  { step: 6, title: "Customs Clearance & KRA", location: "Mombasa Customs Freight Station", status: "upcoming", date: "Est. Sep 08, 2026", notes: "KRA Simba / ICMS duty declaration & IDF clearance." },
  { step: 7, title: "Inland Delivery to Nairobi", location: "Nairobi Expressway Transit", status: "upcoming", date: "Est. Sep 11, 2026", notes: "Enclosed car-carrier transport from coast to capital." },
  { step: 8, title: "Ready for Pickup / Handover", location: "AutoConnect Nairobi Hub, Karen", status: "upcoming", date: "Est. Sep 12, 2026", notes: "Final valet detailing & NTSA logbook handover." },
];

interface ImportStepperProps {
  stages?: ImportStage[];
  currentStep?: number;
  carTitle?: string;
  trackingNumber?: string;
  vesselName?: string;
  className?: string;
}

export function ImportStepper({
  stages = DEFAULT_IMPORT_STAGES,
  currentStep = 4,
  carTitle = "2020 Toyota Land Cruiser Prado TX-L",
  trackingNumber = "AC-JP-89210-KE",
  vesselName = "MV Höegh Target (Voyage 26B)",
  className = "",
}: ImportStepperProps) {
  return (
    <div className={`rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-6 ${className}`}>
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Ship className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-foreground">{carTitle}</h3>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-[10px] font-mono">
                STAGE {currentStep} OF 8
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-mono">
              <span>Tracking Ref: <strong>{trackingNumber}</strong></span>
              <span>· Carrier: {vesselName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/60 px-3.5 py-2 rounded-2xl border border-border text-xs">
          <Clock className="h-4 w-4 text-teal-400" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Estimated Arrival</p>
            <p className="font-bold text-teal-400 font-mono">Sep 12, 2026</p>
          </div>
        </div>
      </div>

      {/* 8-Stage Stepper Track */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-teal-500 before:via-teal-500/60 before:to-slate-800">
        {stages.map((stage) => {
          const isDone = stage.status === "completed";
          const isActive = stage.status === "active";
          const isUpcoming = stage.status === "upcoming";

          return (
            <div key={stage.step} className="relative group">
              {/* Stepper Node Indicator */}
              <div
                className={`absolute -left-6 sm:-left-8 top-0.5 grid h-6 w-6 place-items-center rounded-full border-2 transition-all ${
                  isDone
                    ? "bg-teal-500 border-teal-400 text-slate-950 shadow-md shadow-teal-500/30"
                    : isActive
                    ? "bg-slate-950 border-teal-400 text-teal-400 animate-pulse ring-4 ring-teal-500/20"
                    : "bg-slate-900 border-slate-700 text-slate-500"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 stroke-[3]" />
                ) : isActive ? (
                  <CircleDot className="h-3.5 w-3.5" />
                ) : (
                  <span className="text-[10px] font-bold font-mono">{stage.step}</span>
                )}
              </div>

              {/* Stage Card */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? "border-teal-500/50 bg-teal-500/5 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/20"
                    : isDone
                    ? "border-border/80 bg-card/60"
                    : "border-border/40 bg-muted/20 opacity-75"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {stage.step}. {stage.title}
                    </span>
                    {isActive && (
                      <Badge className="bg-teal-500 text-slate-950 font-bold text-[9px] animate-pulse">
                        CURRENT STATUS
                      </Badge>
                    )}
                  </div>
                  {stage.date && (
                    <span className="text-xs font-mono font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {stage.date}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{stage.location}</span>
                </p>

                {stage.notes && (
                  <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-white/5 leading-relaxed">
                    {stage.notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
