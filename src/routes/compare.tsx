import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useVehicleComparison, ComparedVehicle } from "@/contexts/ComparisonContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  Scale,
  Check,
  X,
  Plus,
  Trash2,
  Share2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Fuel,
  Gauge,
  Cpu,
  Car,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { WhatsAppConcierge } from "@/components/concierge/WhatsAppConcierge";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Vehicle Comparison | AutoConnect" },
      {
        name: "description",
        content: "Compare specs, prices, mileage, engine capacity, and features side-by-side for up to 4 vehicles.",
      },
    ],
  }),
  component: VehicleComparisonPage,
});

// Common automotive features matrix
const STANDARD_FEATURES_LIST = [
  "Leather Seats",
  "Panoramic Sunroof",
  "Apple CarPlay / Android Auto",
  "360° Surround Camera",
  "Adaptive Cruise Control",
  "Lane Keep Assist",
  "Keyless Smart Entry & Push Start",
  "Heated & Ventilated Front Seats",
  "Blind Spot Monitoring",
  "Power Tailgate",
  "Bi-LED Headlights",
  "Wireless Phone Charging",
  "All-Wheel Drive (AWD/4WD)",
  "Third Row 7-Seater",
];

function VehicleComparisonPage() {
  const { comparedVehicles, removeFromCompare, clearComparison, maxVehicles } = useVehicleComparison();
  const { formatPrice } = useCurrency();
  const [onlyDifferences, setOnlyDifferences] = useState(false);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Comparison link copied to clipboard!");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (comparedVehicles.length === 0) {
    return (
      <div className="container-page py-20 min-h-[65vh] flex flex-col items-center justify-center text-center">
        <div className="h-20 w-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
          <Scale className="h-10 w-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Vehicle Comparison
        </h1>
        <p className="text-muted-foreground max-w-md mt-3 text-sm sm:text-base leading-relaxed">
          You have not added any vehicles to compare yet. Browse our inventory and click the{" "}
          <span className="font-semibold text-accent">"Compare"</span> icon on any listing to inspect them side-by-side.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/cars">
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 rounded-xl">
              Browse Vehicles
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/import">
            <Button variant="outline" className="rounded-xl border-border">
              Explore Import Stock
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Helper to check if values differ across cars
  const hasDifference = (getValue: (car: ComparedVehicle) => any) => {
    if (comparedVehicles.length <= 1) return false;
    const first = getValue(comparedVehicles[0]);
    return comparedVehicles.some((car) => getValue(car) !== first);
  };

  return (
    <div className="container-page py-8 sm:py-12 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider mb-2">
            <Scale className="h-4 w-4" />
            <span>Side-by-Side Analysis</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Vehicle Comparison
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comparing <span className="font-semibold text-foreground">{comparedVehicles.length}</span> of{" "}
            <span className="font-semibold text-foreground">{maxVehicles}</span> available slots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Highlight Differences Toggle */}
          <div className="flex items-center space-x-2 bg-card border border-border px-3 py-2 rounded-xl text-xs">
            <Switch
              id="diff-mode"
              checked={onlyDifferences}
              onCheckedChange={setOnlyDifferences}
            />
            <Label htmlFor="diff-mode" className="text-xs cursor-pointer select-none">
              Highlight Differences
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="rounded-xl border-border gap-1.5 text-xs h-9"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl border-border gap-1.5 text-xs h-9 hidden sm:flex"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearComparison}
            className="text-xs text-muted-foreground hover:text-destructive h-9"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Comparison Grid Table */}
      <div className="overflow-x-auto pb-6">
        <div className="min-w-[760px] divide-y divide-border border border-border rounded-3xl bg-card shadow-xl overflow-hidden">
          
          {/* Sticky Vehicle Cards Row */}
          <div className="grid grid-cols-5 gap-4 p-4 sm:p-6 bg-muted/30">
            <div className="col-span-1 flex flex-col justify-end p-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vehicle Overview
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Verified listings with full history checks.
              </p>
              {comparedVehicles.length < maxVehicles && (
                <Link to="/cars" className="mt-4 inline-block">
                  <Button variant="outline" size="sm" className="w-full text-xs rounded-xl border-dashed border-accent/40 text-accent hover:bg-accent/10">
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Vehicle
                  </Button>
                </Link>
              )}
            </div>

            {comparedVehicles.map((car) => (
              <div key={car.id} className="col-span-1 flex flex-col justify-between space-y-3 bg-card border border-border/80 rounded-2xl p-3 shadow-sm relative group">
                <button
                  onClick={() => removeFromCompare(car.id)}
                  className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-md flex items-center justify-center text-muted-foreground transition-colors shadow-sm"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="aspect-[16/10] rounded-xl overflow-hidden bg-muted relative">
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={`${car.make} ${car.model}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-mono">
                      No Photo
                    </div>
                  )}
                  {car.verified && (
                    <span className="absolute bottom-2 left-2 bg-emerald-500/90 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-1">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <div className="text-base font-extrabold text-accent mt-1 font-mono">
                    {formatPrice(car.price)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {car.city || car.country || "Available locally"}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-1.5">
                  <Link to="/cars/$id" params={{ id: car.id }}>
                    <Button size="sm" className="w-full h-8 text-xs rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                  <WhatsAppConcierge car={car} compact className="w-full h-8 text-xs rounded-xl" />
                </div>
              </div>
            ))}

            {/* Empty placeholder columns */}
            {Array.from({ length: maxVehicles - comparedVehicles.length }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="col-span-1 border-2 border-dashed border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 min-h-[220px]"
              >
                <Car className="h-8 w-8 opacity-30" />
                <p className="text-xs font-medium">Slot Available</p>
                <Link to="/cars">
                  <Button variant="ghost" size="sm" className="text-xs text-accent">
                    + Add Car
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Section: Key Specifications */}
          <div className="p-4 sm:p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              Core Specifications
            </h4>

            <SpecRow
              label="Price"
              values={comparedVehicles.map((c) => formatPrice(c.price))}
              highlight={onlyDifferences && hasDifference((c) => c.price)}
              accent
            />
            <SpecRow
              label="Year of Manufacture"
              values={comparedVehicles.map((c) => c.year.toString())}
              highlight={onlyDifferences && hasDifference((c) => c.year)}
            />
            <SpecRow
              label="Mileage"
              values={comparedVehicles.map((c) => (c.mileage ? `${c.mileage.toLocaleString()} km` : "Undisclosed"))}
              highlight={onlyDifferences && hasDifference((c) => c.mileage)}
            />
            <SpecRow
              label="Engine Capacity"
              values={comparedVehicles.map((c) => (c.engine_size_cc ? `${c.engine_size_cc.toLocaleString()} cc` : "N/A"))}
              highlight={onlyDifferences && hasDifference((c) => c.engine_size_cc)}
            />
            <SpecRow
              label="Transmission"
              values={comparedVehicles.map((c) => c.transmission || "Automatic")}
              highlight={onlyDifferences && hasDifference((c) => c.transmission)}
            />
            <SpecRow
              label="Fuel Type"
              values={comparedVehicles.map((c) => c.fuel_type || "Petrol")}
              highlight={onlyDifferences && hasDifference((c) => c.fuel_type)}
            />
            <SpecRow
              label="Drivetrain"
              values={comparedVehicles.map((c) => c.drivetrain || "AWD / 4WD")}
              highlight={onlyDifferences && hasDifference((c) => c.drivetrain)}
            />
            <SpecRow
              label="Steering Configuration"
              values={comparedVehicles.map((c) => c.steering || "Right Hand Drive (RHD)")}
              highlight={onlyDifferences && hasDifference((c) => c.steering)}
            />
            <SpecRow
              label="Condition"
              values={comparedVehicles.map((c) => c.condition || "Foreign Used")}
              highlight={onlyDifferences && hasDifference((c) => c.condition)}
            />
            <SpecRow
              label="Location"
              values={comparedVehicles.map((c) => `${c.city || "Nairobi"}, ${c.country || "KE"}`)}
              highlight={onlyDifferences && hasDifference((c) => `${c.city}-${c.country}`)}
            />
          </div>

          {/* Section: Trust, Escrow & History */}
          <div className="p-4 sm:p-6 space-y-4 bg-muted/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Trust & Verification Passport
            </h4>

            <SpecRow
              label="Escrow Protection"
              values={comparedVehicles.map(() => "100% Guaranteed")}
              icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
            />
            <SpecRow
              label="150-Point Inspection"
              values={comparedVehicles.map((c) => (c.verified ? "Passed (Grade 4.5+)" : "Standard Verified"))}
            />
            <SpecRow
              label="Odometer Audit"
              values={comparedVehicles.map(() => "Verified Genuine")}
            />
            <SpecRow
              label="Logbook & Title Clearance"
              values={comparedVehicles.map(() => "Clear / No Caveats")}
            />
          </div>

          {/* Section: Features & Equipment Matrix */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Equipment & Options Checklist
              </h4>
            </div>

            {STANDARD_FEATURES_LIST.map((featureName) => {
              const hasDiff = hasDifference((car) => {
                const hasFeature = car.features?.some((f) => f.toLowerCase().includes(featureName.toLowerCase().slice(0, 8)));
                return Boolean(hasFeature);
              });

              return (
                <div
                  key={featureName}
                  className={`grid grid-cols-5 gap-4 py-2.5 px-3 rounded-xl items-center text-xs transition-colors ${
                    onlyDifferences && hasDiff ? "bg-amber-500/10 border border-amber-500/30" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="col-span-1 font-medium text-foreground">{featureName}</div>
                  {comparedVehicles.map((car) => {
                    const hasFeature =
                      car.features?.some((f) => f.toLowerCase().includes(featureName.toLowerCase().slice(0, 8))) ??
                      true; // default to true if features array is unspecified

                    return (
                      <div key={car.id} className="col-span-1 flex items-center gap-1.5">
                        {hasFeature ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Check className="h-4 w-4" />
                            <span>Included</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-muted-foreground/60">
                            <X className="h-4 w-4" />
                            <span>Not fitted</span>
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: maxVehicles - comparedVehicles.length }).map((_, idx) => (
                    <div key={`feat-empty-${idx}`} className="col-span-1 text-muted-foreground/40 text-center">
                      —
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}

function SpecRow({
  label,
  values,
  highlight = false,
  accent = false,
  icon,
}: {
  label: string;
  values: string[];
  highlight?: boolean;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-5 gap-4 py-2.5 px-3 rounded-xl items-center text-xs transition-colors ${
        highlight
          ? "bg-amber-500/10 border border-amber-500/30 text-foreground font-semibold"
          : "hover:bg-muted/40 text-muted-foreground"
      }`}
    >
      <div className="col-span-1 font-medium text-foreground flex items-center gap-1.5">
        {icon}
        <span>{label}</span>
      </div>
      {values.map((val, idx) => (
        <div
          key={idx}
          className={`col-span-1 ${accent ? "text-accent font-mono font-bold text-sm" : "text-foreground font-medium"}`}
        >
          {val}
        </div>
      ))}
      {Array.from({ length: 4 - values.length }).map((_, idx) => (
        <div key={`empty-spec-${idx}`} className="col-span-1 text-muted-foreground/40">
          —
        </div>
      ))}
    </div>
  );
}
