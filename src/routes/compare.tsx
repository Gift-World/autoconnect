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
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Vehicle Comparison | AutoConnect" },
      {
        name: "description",
        content:
          "Compare specs, prices, mileage, engine capacity, and features side-by-side for up to 4 vehicles.",
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
  const { comparedVehicles, removeFromCompare, clearComparison, maxVehicles } =
    useVehicleComparison();
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
      <div className="mx-auto flex min-h-[65vh] max-w-[1360px] flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <div className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-ac-cream text-ac-ink">
          <Scale className="h-10 w-10" />
        </div>
        <p className="brand-kicker text-muted-foreground">Side-by-side decision desk</p>
        <h1 className="font-brand mt-3 text-3xl text-foreground sm:text-5xl">
          Vehicle Comparison
        </h1>
        <p className="text-muted-foreground max-w-md mt-3 text-sm sm:text-base leading-relaxed">
          You have not added any vehicles to compare yet. Browse our inventory and click the{" "}
          <span className="font-semibold text-foreground">"Compare"</span> icon on any listing to
          inspect them side-by-side.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link to="/cars">
            <Button className="h-11 rounded-full bg-ac-accent px-6 font-bold text-ac-ink hover:bg-ac-accent/90">
              Browse Vehicles
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/import">
            <Button variant="outline" className="h-11 rounded-full border-border px-6">
              Explore Import Stock
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Helper to check if values differ across cars
  const hasDifference = (getValue: (car: ComparedVehicle) => unknown) => {
    if (comparedVehicles.length <= 1) return false;
    const first = getValue(comparedVehicles[0]);
    return comparedVehicles.some((car) => getValue(car) !== first);
  };

  // Label column + one column per slot. Below md the table scrolls inside its own container
  // while the label column stays pinned.
  const gridCols = {
    gridTemplateColumns: `minmax(112px, 168px) repeat(${maxVehicles}, minmax(168px, 1fr))`,
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10">
      <PageHeader
        eyebrow="Side-by-side decision desk"
        title="Compare what matters"
        description={`Comparing ${comparedVehicles.length} of ${maxVehicles} vehicles. Highlight differences, save the link, and review the seller-supplied facts before you contact anyone.`}
        actions={<div className="flex flex-wrap items-center gap-3">
          {/* Highlight Differences Toggle */}
          <div className="flex min-h-11 items-center space-x-2 rounded-full border border-border bg-card px-4 py-2 text-xs">
            <Switch id="diff-mode" checked={onlyDifferences} onCheckedChange={setOnlyDifferences} />
            <Label htmlFor="diff-mode" className="text-xs cursor-pointer select-none">
              Highlight Differences
            </Label>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="h-11 gap-1.5 rounded-full border-border px-4 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="hidden h-11 gap-1.5 rounded-full border-border px-4 text-xs sm:flex"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print PDF</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearComparison}
            className="h-11 rounded-full text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Clear All
          </Button>
        </div>}
      />

      {/* Comparison Grid Table */}
      <p className="text-xs text-muted-foreground md:hidden">Swipe sideways inside the table to see every car.</p>
      <div className="overflow-x-auto overscroll-x-contain rounded-[28px] border border-border bg-card pb-2">
        <div className="w-max min-w-full divide-y divide-border">
          {/* Sticky Vehicle Cards Row */}
          <div className="grid gap-3 bg-muted/30 p-3 sm:gap-4 sm:p-6" style={gridCols}>
            <div className="sticky left-0 z-10 flex flex-col justify-end rounded-2xl bg-card/95 p-2 backdrop-blur">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vehicle Overview
              </span>
              <p className="text-[11px] text-muted-foreground mt-1">
                Compare seller-supplied details side by side.
              </p>
              {comparedVehicles.length < maxVehicles && (
                <Link to="/cars" className="mt-4 inline-block">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-full rounded-full border-dashed text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Vehicle
                  </Button>
                </Link>
              )}
            </div>

            {comparedVehicles.map((car) => (
              <div
                key={car.id}
                className="col-span-1 flex flex-col justify-between space-y-3 bg-card border border-border/80 rounded-2xl p-3 shadow-sm relative group"
              >
                <button
                  onClick={() => removeFromCompare(car.id)}
                  aria-label="Remove from comparison"
                  className="absolute top-2 right-2 z-10 h-9 w-9 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-md flex items-center justify-center text-muted-foreground transition-colors shadow-sm"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
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
                  <div className="mt-1 text-base font-extrabold tabular-nums text-foreground">
                    {formatPrice(car.price)}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {car.city || car.country || "Available locally"}
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-1.5">
                  <Link to="/cars/$id" params={{ id: car.id }}>
                    <Button
                      size="sm"
                      className="h-11 w-full rounded-full bg-ac-accent text-xs font-bold text-ac-ink hover:bg-ac-accent/90"
                    >
                      View Details
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                  <WhatsAppConcierge car={car} compact className="h-11 w-full rounded-full text-xs" />
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
                  <Button variant="ghost" size="sm" className="h-11 rounded-full text-xs">
                    + Add Car
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          {/* Section: Key Specifications */}
          <div className="p-4 sm:p-6 space-y-4">
            <h4 className="sticky left-0 flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <Gauge className="h-4 w-4" />
              Core Specifications
            </h4>

            <SpecRow
              label="Price"
              values={comparedVehicles.map((c) => formatPrice(c.price))}
              highlight={onlyDifferences && hasDifference((c) => c.price)}
              accent
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Year of Manufacture"
              values={comparedVehicles.map((c) => c.year.toString())}
              highlight={onlyDifferences && hasDifference((c) => c.year)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Mileage"
              values={comparedVehicles.map((c) =>
                c.mileage ? `${c.mileage.toLocaleString()} km` : "Undisclosed",
              )}
              highlight={onlyDifferences && hasDifference((c) => c.mileage)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Engine Capacity"
              values={comparedVehicles.map((c) =>
                c.engine_size_cc ? `${c.engine_size_cc.toLocaleString()} cc` : "N/A",
              )}
              highlight={onlyDifferences && hasDifference((c) => c.engine_size_cc)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Transmission"
              values={comparedVehicles.map((c) => c.transmission || "Automatic")}
              highlight={onlyDifferences && hasDifference((c) => c.transmission)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Fuel Type"
              values={comparedVehicles.map((c) => c.fuel_type || "Petrol")}
              highlight={onlyDifferences && hasDifference((c) => c.fuel_type)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Drivetrain"
              values={comparedVehicles.map((c) => c.drivetrain || "AWD / 4WD")}
              highlight={onlyDifferences && hasDifference((c) => c.drivetrain)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Steering Configuration"
              values={comparedVehicles.map((c) => c.steering || "Right Hand Drive (RHD)")}
              highlight={onlyDifferences && hasDifference((c) => c.steering)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Condition"
              values={comparedVehicles.map((c) => c.condition || "Foreign Used")}
              highlight={onlyDifferences && hasDifference((c) => c.condition)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Location"
              values={comparedVehicles.map((c) => `${c.city || "Nairobi"}, ${c.country || "KE"}`)}
              highlight={onlyDifferences && hasDifference((c) => `${c.city}-${c.country}`)}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
          </div>

          {/* Section: Trust, Escrow & History */}
          <div className="p-4 sm:p-6 space-y-4 bg-muted/20">
            <h4 className="sticky left-0 flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
              <ShieldCheck className="h-4 w-4" />
              Trust & Verification Passport
            </h4>

            <SpecRow
              label="Listing status"
              values={comparedVehicles.map((c) => (c.verified ? "Seller verified" : "Review listing details"))}
              icon={<ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Inspection evidence"
              values={comparedVehicles.map(() => "Ask seller or arrange inspection")}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Mileage evidence"
              values={comparedVehicles.map(() => "Confirm with seller")}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
            <SpecRow
              label="Ownership documents"
              values={comparedVehicles.map(() => "Request before purchase")}
              gridStyle={gridCols}
              slots={maxVehicles}
            />
          </div>

          {/* Section: Features & Equipment Matrix */}
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="sticky left-0 flex w-fit items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
                <Sparkles className="h-4 w-4" />
                Equipment & Options Checklist
              </h4>
            </div>

            {STANDARD_FEATURES_LIST.map((featureName) => {
              const hasDiff = hasDifference((car) => {
                const hasFeature = car.features?.some((f) =>
                  f.toLowerCase().includes(featureName.toLowerCase().slice(0, 8)),
                );
                return Boolean(hasFeature);
              });

              return (
                <div
                  key={featureName}
                  style={gridCols}
                  className={`grid gap-3 py-2.5 px-3 rounded-xl items-center text-xs transition-colors sm:gap-4 ${
                    onlyDifferences && hasDiff
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "hover:bg-muted/40"
                  }`}
                >
                  <div className="sticky left-0 z-10 rounded-lg bg-card/95 py-1 font-medium text-foreground backdrop-blur">{featureName}</div>
                  {comparedVehicles.map((car) => {
                    const hasFeature =
                      car.features?.some((f) =>
                        f.toLowerCase().includes(featureName.toLowerCase().slice(0, 8)),
                      ) ?? true; // default to true if features array is unspecified

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
                    <div
                      key={`feat-empty-${idx}`}
                      className="col-span-1 text-muted-foreground/40 text-center"
                    >
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
  gridStyle,
  slots = 4,
}: {
  gridStyle?: React.CSSProperties;
  slots?: number;
  label: string;
  values: string[];
  highlight?: boolean;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={gridStyle}
      className={`grid grid-cols-5 gap-3 py-2.5 px-3 rounded-xl items-center text-xs transition-colors sm:gap-4 ${
        highlight
          ? "bg-amber-500/10 border border-amber-500/30 text-foreground font-semibold"
          : "hover:bg-muted/40 text-muted-foreground"
      }`}
    >
      <div className="sticky left-0 z-10 flex items-center gap-1.5 rounded-lg bg-card/95 py-1 font-medium text-foreground backdrop-blur">
        {icon}
        <span>{label}</span>
      </div>
      {values.map((val, idx) => (
        <div
          key={idx}
          className={`col-span-1 ${accent ? "font-mono text-sm font-bold text-foreground" : "text-foreground font-medium"}`}
        >
          {val}
        </div>
      ))}
      {Array.from({ length: Math.max(0, slots - values.length) }).map((_, idx) => (
        <div key={`empty-spec-${idx}`} className="col-span-1 text-muted-foreground/40">
          —
        </div>
      ))}
    </div>
  );
}
