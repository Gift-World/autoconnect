import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Gauge,
  Fuel,
  Settings2,
  Calendar,
  Sparkles,
  MapPin,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SPOTLIGHT_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1600&auto=format&fit=crop&q=85",
    label: "Exterior Front 3/4",
  },
  {
    url: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=1600&auto=format&fit=crop&q=85",
    label: "Cockpit & Leather",
  },
  {
    url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1600&auto=format&fit=crop&q=85",
    label: "Road Profile",
  },
];

export function SpotlightDiscovery() {
  const [activeImgIdx, setActiveImgIdx] = useState(0);

  return (
    <section className="relative overflow-hidden bg-background py-20 lg:py-28">
      {/* Background architectural subtle accents */}
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />

      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
              <Sparkles className="h-3.5 w-3.5" /> Curated Flagship Showcase
            </div>
            <h2 className="font-display mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Discover your next drive.
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
            Every week our automotive curators highlight an exceptional verified listing with full logbook clearance, on-site diagnostics, and escrow backing.
          </p>
        </div>

        {/* Featured Vehicle Showcase Card */}
        <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Dominant Vehicle Imagery */}
            <div className="relative lg:col-span-7 bg-slate-950 min-h-[360px] sm:min-h-[480px] flex flex-col justify-between overflow-hidden">
              <img
                src={SPOTLIGHT_IMAGES[activeImgIdx].url}
                alt="2024 Toyota Land Cruiser Prado TX-L"
                className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
              />

              {/* Gradient overlays for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Top badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <Badge className="bg-teal-500 text-slate-950 font-bold px-3 py-1 text-xs shadow-md">
                  ★ SPOTLIGHT OF THE WEEK
                </Badge>
                <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                  🇰🇪 Nairobi Stock · Immediate Handover
                </span>
              </div>

              {/* Bottom perspective thumbnails */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {SPOTLIGHT_IMAGES.map((img, idx) => (
                    <button
                      key={img.label}
                      onClick={() => setActiveImgIdx(idx)}
                      className={`h-12 w-16 overflow-hidden rounded-lg border-2 transition-all ${
                        activeImgIdx === idx
                          ? "border-teal-400 scale-105 shadow-md"
                          : "border-white/30 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>

                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-white/90 bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                  150-Pt Inspected
                </span>
              </div>
            </div>

            {/* Right Information & Specifications */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-10 lg:col-span-5 bg-card">
              <div>
                {/* Year and Title */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2024 · TX-L Edition
                  </span>
                  <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                    Right Hand Drive
                  </Badge>
                </div>

                <h3 className="font-display mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  Toyota Land Cruiser Prado
                </h3>

                {/* Price Display */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-teal-600 dark:text-teal-400">
                    KSh 8,900,000
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    (Approx. $68,500 USD)
                  </span>
                </div>

                {/* Location and Verified Seller */}
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-teal-500 shrink-0" />
                  <span>Nairobi, Kenya</span>
                  <span>•</span>
                  <span className="font-semibold text-foreground">Capital Motors Dealership</span>
                </div>

                {/* Trust and status pills */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified Logbook & NTSA
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300">
                    <Lock className="h-3.5 w-3.5" />
                    Escrow Protection Ready
                  </span>
                </div>

                {/* Key Spec Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/80 pt-6">
                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                    <Gauge className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase">Mileage</p>
                      <p className="text-sm font-bold text-foreground">12,400 km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                    <Fuel className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase">Engine & Fuel</p>
                      <p className="text-sm font-bold text-foreground">2.8L Diesel Turbo</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                    <Settings2 className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase">Transmission</p>
                      <p className="text-sm font-bold text-foreground">6-Speed Auto 4x4</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/50 p-3">
                    <Calendar className="h-5 w-5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <p className="text-[11px] font-medium text-muted-foreground uppercase">Condition</p>
                      <p className="text-sm font-bold text-foreground">Mint / Grade 4.5</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                <Button
                  asChild
                  className="w-full sm:flex-1 h-12 rounded-2xl bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 shadow-md transition-all duration-200"
                >
                  <Link to="/cars" search={{ q: "Prado" } as never}>
                    View Vehicle Specification
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto h-12 rounded-2xl border-border hover:bg-muted font-semibold"
                >
                  <Link to="/how-payments-work">
                    How Escrow Works
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
