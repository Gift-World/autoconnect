import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Ship,
  Search,
  MapPin,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Anchor,
  Navigation,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImportStepper, DEFAULT_IMPORT_STAGES } from "@/components/tracker/ImportStepper";

export const Route = createFileRoute("/import-tracker")({
  head: () => ({ meta: [{ title: "Japan Import Shipping Tracker — AutoConnect" }] }),
  component: ImportTrackerPage,
});

const DEMO_SHIPMENTS = [
  {
    id: "AC-JP-89210-KE",
    carTitle: "2020 Toyota Land Cruiser Prado TX-L",
    origin: "Port of Yokohama, Japan",
    destination: "Nairobi Hub, Kenya",
    carrier: "MV Höegh Target (Voyage 26B)",
    currentStage: 4,
    statusText: "In Transit (Indian Ocean)",
    eta: "Sep 12, 2026",
    vin: "GDJ150-0049281",
    photo: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "AC-JP-91042-KE",
    carTitle: "2019 Mazda CX-5 2.2D XD L-Package",
    origin: "Port of Nagoya, Japan",
    destination: "Mombasa Port CFS",
    carrier: "MV Morning Concert",
    currentStage: 6,
    statusText: "Customs Clearance & KRA",
    eta: "Sep 08, 2026",
    vin: "KF2P-203918",
    photo: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80",
  },
];

function ImportTrackerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipment, setSelectedShipment] = useState(DEMO_SHIPMENTS[0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = DEMO_SHIPMENTS.find(
      (s) =>
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.carTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (found) {
      setSelectedShipment(found);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/60 border border-teal-500/30 text-white shadow-xl">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-mono">
            <Anchor className="h-3.5 w-3.5" /> LIVE RO-RO CARRIER TRACKING
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Japan & Global Import Shipping Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time multi-stage tracking for your direct auction imports from Yokohama, Nagoya, and Kobe to Mombasa and Nairobi.
          </p>
        </div>

        {/* Search by Tracking ID / VIN */}
        <form onSubmit={handleSearch} className="w-full md:w-80 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter Tracking # or Chassis VIN"
              className="h-11 pl-9 rounded-xl bg-slate-900 border-slate-700 text-white text-xs font-mono placeholder:text-slate-500"
            />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 text-xs">
            Track Vehicle
          </Button>
        </form>
      </div>

      {/* Main Grid: Active Shipments + Stepper */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left: Shipment Selector Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Ship className="h-4 w-4 text-teal-400" /> Active Vessels in Transit ({DEMO_SHIPMENTS.length})
          </h2>

          <div className="space-y-2.5">
            {DEMO_SHIPMENTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedShipment(s)}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${
                  selectedShipment.id === s.id
                    ? "border-teal-500 bg-teal-500/10 shadow-md shadow-teal-500/10 ring-1 ring-teal-500/30"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex gap-3">
                  <img
                    src={s.photo}
                    alt={s.carTitle}
                    className="h-16 w-20 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[10px] font-bold text-teal-400">{s.id}</span>
                    <h4 className="text-xs font-bold text-foreground truncate mt-0.5">{s.carTitle}</h4>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary" /> ETA: {s.eta}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Guaranteed Logistics Assurance Card */}
          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs text-muted-foreground space-y-2">
            <p className="font-bold text-teal-400 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" /> 100% Insured Ro-Ro Sea Freight
            </p>
            <p className="text-[11px] leading-relaxed">
              Every vehicle shipped through AutoConnect includes comprehensive marine insurance, JEVIC pre-export radiation testing, and KRA Simba customs bond clearance.
            </p>
          </div>
        </div>

        {/* Right: Detailed Stepper */}
        <div>
          <ImportStepper
            carTitle={selectedShipment.carTitle}
            trackingNumber={selectedShipment.id}
            vesselName={selectedShipment.carrier}
            currentStep={selectedShipment.currentStage}
          />
        </div>
      </div>
    </div>
  );
}
