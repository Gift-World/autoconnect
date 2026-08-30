import React, { useState } from "react";
import {
  Calculator,
  Car,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Banknote,
  MapPin,
  Calendar,
  Gauge,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

const POPULAR_MAKES = [
  "Toyota",
  "Subaru",
  "Mazda",
  "Mercedes-Benz",
  "BMW",
  "Nissan",
  "Honda",
  "Land Rover",
  "Volkswagen",
  "Ford",
  "Mitsubishi",
  "Audi",
  "Lexus",
  "Isuzu",
  "Hyundai",
];

// Reference baseline market valuation table (in KES) for year 2018
const BASELINE_VALUATIONS: Record<string, number> = {
  "toyota prado": 5800000,
  "toyota harrier": 3400000,
  "toyota rav4": 3100000,
  "toyota fielder": 1650000,
  "toyota axio": 1550000,
  "toyota vitz": 1150000,
  "toyota hilux": 4200000,
  "subaru outback": 2650000,
  "subaru forester": 2450000,
  "mazda cx-5": 2550000,
  "mazda demio": 1100000,
  "mercedes-benz c-class": 3800000,
  "mercedes-benz e-class": 4900000,
  "bmw 5 series": 4200000,
  "bmw x5": 6200000,
  "nissan x-trail": 2100000,
  "nissan note": 1050000,
  "volkswagen golf": 1850000,
  "land rover discovery": 5400000,
  "ford ranger": 3900000,
};

interface TradeInEstimatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetCarTitle?: string;
  targetCarPrice?: number;
}

export function TradeInEstimatorModal({
  open,
  onOpenChange,
  targetCarTitle,
  targetCarPrice,
}: TradeInEstimatorModalProps) {
  const { formatPrice } = useCurrency();

  const [make, setMake] = useState("Toyota");
  const [model, setModel] = useState("Prado");
  const [year, setYear] = useState("2018");
  const [mileage, setMileage] = useState("75000");
  const [condition, setCondition] = useState<"excellent" | "good" | "fair" | "poor">("good");
  const [location, setLocation] = useState("Nairobi");

  const [estimatedMin, setEstimatedMin] = useState<number | null>(null);
  const [estimatedMax, setEstimatedMax] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);

  const calculateTradeInValue = (e: React.FormEvent) => {
    e.preventDefault();

    const lookupKey = `${make.toLowerCase()} ${model.toLowerCase()}`.trim();
    let base = 2500000;

    // Find closest matching baseline
    for (const [key, val] of Object.entries(BASELINE_VALUATIONS)) {
      if (lookupKey.includes(key) || key.includes(lookupKey) || lookupKey.includes(key.split(" ")[1])) {
        base = val;
        break;
      }
    }

    // Year adjustment from 2018 base
    const yr = parseInt(year, 10) || 2018;
    const yearDiff = yr - 2018;
    const yearMultiplier = 1 + yearDiff * 0.08;
    base = base * yearMultiplier;

    // Condition adjustment
    let conditionMult = 1.0;
    if (condition === "excellent") conditionMult = 1.05;
    else if (condition === "good") conditionMult = 1.00;
    else if (condition === "fair") conditionMult = 0.90;
    else if (condition === "poor") conditionMult = 0.75;

    // Mileage adjustment: per 10k over 80k km, reduce by 2%
    const km = parseInt(mileage, 10) || 80000;
    let mileageMult = 1.0;
    if (km > 80000) {
      const overSteps = Math.floor((km - 80000) / 10000);
      mileageMult = Math.max(0.70, 1.0 - overSteps * 0.02);
    } else if (km < 50000) {
      mileageMult = 1.04;
    }

    const calculatedMid = Math.round(base * conditionMult * mileageMult);
    const minVal = Math.round(calculatedMid * 0.93);
    const maxVal = Math.round(calculatedMid * 1.07);

    setEstimatedMin(minVal);
    setEstimatedMax(maxVal);
    setCalculated(true);
  };

  const handleApplyTradeIn = () => {
    toast.success("Trade-In Estimate Applied!", {
      description: `Valuation of ${formatPrice(estimatedMin || 0)} - ${formatPrice(estimatedMax || 0)} saved to your profile.`,
      icon: <CheckCircle2 className="h-4 w-4 text-teal-400" />,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border-border p-0">
        <div className="bg-slate-950 p-5 border-b border-white/10 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Calculator className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                Trade-In Valuation Estimator
                <Badge variant="outline" className="text-[10px] bg-teal-500/15 text-teal-300 border-teal-500/30">
                  INSTANT QUOTE
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Find out what your current car is worth in Kenya's live market
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {!calculated ? (
            <form onSubmit={calculateTradeInValue} className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Make</Label>
                  <Select value={make} onValueChange={setMake}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-xl">
                      {POPULAR_MAKES.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Model</Label>
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. Prado, CX-5, Outback"
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Manufacture Year</Label>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-xl">
                      {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2010].map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Odometer Mileage (km)</Label>
                  <Input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="75000"
                    className="h-11 rounded-xl font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Vehicle Condition</Label>
                  <Select value={condition} onValueChange={(v: any) => setCondition(v)}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="excellent">Excellent (Like new)</SelectItem>
                      <SelectItem value="good">Good (Clean, minor wear)</SelectItem>
                      <SelectItem value="fair">Fair (Normal scratches)</SelectItem>
                      <SelectItem value="poor">Poor (Needs repair)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Current Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Nairobi">Nairobi</SelectItem>
                      <SelectItem value="Mombasa">Mombasa</SelectItem>
                      <SelectItem value="Kisumu">Kisumu</SelectItem>
                      <SelectItem value="Nakuru">Nakuru</SelectItem>
                      <SelectItem value="Eldoret">Eldoret</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2 mt-2"
              >
                <Sparkles className="h-4 w-4" /> Calculate Trade-In Value
              </Button>
            </form>
          ) : (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Valuation Result Card */}
              <div className="rounded-2xl border border-teal-500/30 bg-teal-500/10 p-5 text-center space-y-2">
                <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
                  Estimated Trade-In Market Value
                </p>
                <p className="text-2xl sm:text-3xl font-black text-foreground font-mono">
                  {formatPrice(estimatedMin || 0)} – {formatPrice(estimatedMax || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  For: {year} {make} {model} · {parseInt(mileage).toLocaleString()} km ({condition} condition)
                </p>
              </div>

              {targetCarTitle && targetCarPrice && (
                <div className="p-3.5 rounded-xl border border-border bg-card/60 text-xs space-y-1.5">
                  <span className="font-bold text-foreground">Applying toward: {targetCarTitle}</span>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Listed Price:</span>
                    <span className="font-mono text-foreground">{formatPrice(targetCarPrice)}</span>
                  </div>
                  <div className="flex justify-between text-teal-400 font-bold">
                    <span>Est. Net Cash Balance:</span>
                    <span className="font-mono">
                      {formatPrice(Math.max(0, targetCarPrice - (estimatedMax || 0)))}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCalculated(false)}
                  className="h-11 px-4 rounded-xl text-xs"
                >
                  Recalculate
                </Button>
                <Button
                  type="button"
                  onClick={handleApplyTradeIn}
                  className="flex-1 h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2"
                >
                  <span>Apply Toward New Purchase</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
