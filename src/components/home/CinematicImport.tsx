import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Globe,
  Plane,
  Ship,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Calculator,
  CheckCircle2,
  Clock,
  Banknote,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ImportCorridor {
  id: string;
  source: { country: string; flag: string; port: string };
  dest: { country: string; flag: string; port: string };
  popularModels: string;
  shippingTime: string;
  savings: string;
  dutyStatus: string;
  inspection: string;
}

const CORRIDORS: ImportCorridor[] = [
  {
    id: "jp-ke",
    source: { country: "Japan", flag: "🇯🇵", port: "Yokohama / Kobe Port" },
    dest: { country: "Kenya", flag: "🇰🇪", port: "Mombasa Port" },
    popularModels: "Toyota Land Cruiser, Harrier, Prado, Subaru Outback",
    shippingTime: "21–28 Days RoRo Freight",
    savings: "Save 20–28% vs local showroom retail",
    dutyStatus: "Full KRA CRSP Customs Clearance Handled",
    inspection: "JEVIC / QISJ Pre-Export Mileage Certification",
  },
  {
    id: "uk-ke",
    source: { country: "United Kingdom", flag: "🇬🇧", port: "Southampton Port" },
    dest: { country: "Kenya", flag: "🇰🇪", port: "Mombasa Port" },
    popularModels: "Range Rover Sport, Defender, BMW X5, Mercedes GLE",
    shippingTime: "28–35 Days Containerized",
    savings: "Save 18–25% on British Luxury Specifications",
    dutyStatus: "UK VAT Export Reclaim Support & Clearances",
    inspection: "HPI Clear & AA UK 150-Point Multi-Check",
  },
  {
    id: "ae-ke",
    source: { country: "UAE (Dubai)", flag: "🇦🇪", port: "Jebel Ali Port" },
    dest: { country: "Kenya", flag: "🇰🇪", port: "Mombasa Port" },
    popularModels: "Lexus LX600, Nissan Patrol V8, Toyota LC300 GR-Sport",
    shippingTime: "14–21 Days Express Sea Freight",
    savings: "Direct Access to GCC Desert & Heavy-Duty Specs",
    dutyStatus: "Direct Port-to-Port Documentation",
    inspection: "Dubai RTA Certificate & Physical Appraisal",
  },
  {
    id: "de-ke",
    source: { country: "Germany", flag: "🇩🇪", port: "Hamburg Port" },
    dest: { country: "Kenya", flag: "🇰🇪", port: "Mombasa Port" },
    popularModels: "Porsche Cayenne, Audi Q7, BMW M-Performance",
    shippingTime: "30–35 Days Maritime Transit",
    savings: "Save on High-End European Executive Lineup",
    dutyStatus: "EU Certificate of Conformity & Customs Bond",
    inspection: "TÜV Rheinland Comprehensive Technical Report",
  },
];

export function CinematicImport() {
  const [activeCorridorId, setActiveCorridorId] = useState("jp-ke");
  const activeCorridor = CORRIDORS.find((c) => c.id === activeCorridorId) || CORRIDORS[0];

  return (
    <section className="relative overflow-hidden bg-[#070b14] py-20 lg:py-28 text-white">
      {/* Subtle world grid and ambient glow */}
      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-[140px]" />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300 backdrop-blur-md">
            <Globe className="h-3.5 w-3.5 text-teal-400" />
            Global Sourcing Infrastructure
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
            Your next car could be{" "}
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              thousands of kilometres away.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Direct international vehicle procurement without middleman markups. From Japanese auction houses to UK luxury dealer networks — delivered to your doorstep with full escrow protection.
          </p>
        </div>

        {/* Corridor Switcher Tabs */}
        <div className="mt-12 flex flex-wrap justify-center gap-2">
          {CORRIDORS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCorridorId(c.id)}
              className={`flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeCorridorId === c.id
                  ? "bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-105"
                  : "border border-white/10 bg-slate-900/80 text-slate-300 hover:border-teal-500/30 hover:bg-slate-800"
              }`}
            >
              <span>{c.source.flag}</span>
              <span>{c.source.country}</span>
              <ArrowRight className="h-3.5 w-3.5 opacity-60" />
              <span>{c.dest.flag}</span>
              <span>{c.dest.country}</span>
            </button>
          ))}
        </div>

        {/* Interactive Corridor Display Panel */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-white/15 bg-slate-900/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left: Corridor Route Visual */}
            <div className="lg:col-span-7 space-y-6">
              {/* Route Endpoints */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                {/* Origin */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl">{activeCorridor.source.flag}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      Origin Port
                    </span>
                    <h4 className="font-display text-base sm:text-lg font-bold text-white">
                      {activeCorridor.source.country}
                    </h4>
                    <p className="text-xs text-slate-400">{activeCorridor.source.port}</p>
                  </div>
                </div>

                {/* Freight Indicator */}
                <div className="flex flex-col items-center justify-center px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20">
                  <Ship className="h-5 w-5 text-teal-400 animate-pulse" />
                  <span className="mt-1 text-[11px] font-bold text-teal-300">
                    {activeCorridor.shippingTime}
                  </span>
                </div>

                {/* Destination */}
                <div className="flex items-center gap-3">
                  <span className="text-3xl sm:text-4xl">{activeCorridor.dest.flag}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                      Destination
                    </span>
                    <h4 className="font-display text-base sm:text-lg font-bold text-white">
                      {activeCorridor.dest.country}
                    </h4>
                    <p className="text-xs text-slate-400">{activeCorridor.dest.port}</p>
                  </div>
                </div>
              </div>

              {/* Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <TrendingDown className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">Direct Sourcing Value</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeCorridor.savings}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <ShieldCheck className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">Pre-Export Certification</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeCorridor.inspection}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <Banknote className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">Customs & Duty Protocol</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeCorridor.dutyStatus}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">Top Sourced Makes</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeCorridor.popularModels}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Import Cost Calculator Card */}
            <div className="lg:col-span-5 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                    Live Duty & Landed Cost Engine
                  </span>
                  <Calculator className="h-5 w-5 text-teal-400" />
                </div>

                <h3 className="font-display mt-3 text-xl font-bold text-white">
                  Calculate Total Landed Cost in Under 60 Seconds
                </h3>

                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Know exact KRA duties, shipping freight, port handling charges, and inspection fees before committing a single shilling.
                </p>

                {/* Estimated sample pill */}
                <div className="mt-6 rounded-xl bg-teal-950/40 border border-teal-500/20 p-3.5 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Estimated CIF Value:</span>
                    <span className="font-bold text-white">From $12,500</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">KRA Import Duty + VAT:</span>
                    <span className="font-bold text-white">Calculated by Engine</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-teal-500/20 pt-2">
                    <span className="text-teal-300 font-semibold">Buyer Protection:</span>
                    <span className="font-bold text-teal-300">100% Escrow Backed</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  asChild
                  size="lg"
                  className="w-full h-12 rounded-xl bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 shadow-md shadow-teal-500/20"
                >
                  <Link to="/import">
                    Calculate Import Cost <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-center text-[11px] text-slate-400">
                  Zero commitment. Get verified quote matches from vetted exporters.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
