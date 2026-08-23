import { useState, useMemo } from "react";
import {
  Calculator,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Coins,
  ChevronDown,
  Info,
  CheckCircle2,
} from "lucide-react";
import {
  calculateKraDuty,
  listCrspMakes,
  listCrspModelsForMake,
  POPULAR_CRSP_DATABASE,
  type KraDutyBreakdown,
} from "@/lib/kra-crsp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function KraCrspCalculator({
  initialMake,
  initialModel,
  onApplyDuty,
}: {
  initialMake?: string;
  initialModel?: string;
  onApplyDuty?: (duty: KraDutyBreakdown) => void;
}) {
  const makes = useMemo(() => listCrspMakes(), []);
  const [selectedMake, setSelectedMake] = useState<string>(initialMake || "Toyota");
  const [selectedModel, setSelectedModel] = useState<string>(
    initialModel || "Land Cruiser Prado TX/TZ",
  );
  const [yearOfManufacture, setYearOfManufacture] = useState<number>(2019);
  const [engineCc, setEngineCc] = useState<number>(2700);
  const [fuelType, setFuelType] = useState<"petrol" | "diesel" | "hybrid" | "electric">("petrol");
  const [customCrspKes, setCustomCrspKes] = useState<number | undefined>(undefined);

  const availableModels = useMemo(
    () => listCrspModelsForMake(selectedMake),
    [selectedMake],
  );

  // Update engine CC and fuel when model changes
  const handleModelChange = (modelName: string) => {
    setSelectedModel(modelName);
    const found = availableModels.find((m) => m.model === modelName);
    if (found) {
      setEngineCc(found.engineCc);
      setFuelType(found.fuelType);
      setCustomCrspKes(undefined);
    }
  };

  const duty: KraDutyBreakdown = useMemo(() => {
    return calculateKraDuty({
      make: selectedMake,
      model: selectedModel,
      yearOfManufacture,
      engineCc,
      fuelType,
      customCrspKes,
    });
  }, [selectedMake, selectedModel, yearOfManufacture, engineCc, fuelType, customCrspKes]);

  const fmtKes = (amount: number) => `KES ${amount.toLocaleString()}`;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-emerald-950/40 via-background to-background p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                KRA CRSP Customs &amp; Import Duty Calculator
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  EAC Customs 2026 Table
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Compute exact Kenya Revenue Authority taxes, depreciation, and clearance estimates.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">8-Year Age Rule</span>
            {duty.isEligibleForKenya ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Eligible ({duty.ageYears} yrs old)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> Over 8 Yrs (Restricted)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Calculator Body */}
      <div className="p-6 grid gap-6 lg:grid-cols-12">
        {/* Left Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle Make</Label>
              <Select
                value={selectedMake}
                onValueChange={(val) => {
                  setSelectedMake(val);
                  const first = listCrspModelsForMake(val)[0];
                  if (first) {
                    setSelectedModel(first.model);
                    setEngineCc(first.engineCc);
                    setFuelType(first.fuelType);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Year of Manufacture</Label>
              <Select
                value={yearOfManufacture.toString()}
                onValueChange={(val) => setYearOfManufacture(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017].map((yr) => (
                    <SelectItem key={yr} value={yr.toString()}>
                      {yr} ({2026 - yr} yr {yr < 2018 ? "— Over 8yr" : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Select CRSP Model Benchmark</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((m) => (
                  <SelectItem key={m.model} value={m.model}>
                    {m.model} ({m.engineCc}cc {m.fuelType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Displacement (CC)</Label>
              <Input
                type="number"
                value={engineCc}
                onChange={(e) => setEngineCc(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fuel Type</Label>
              <Select
                value={fuelType}
                onValueChange={(v) =>
                  setFuelType(v as "petrol" | "diesel" | "hybrid" | "electric")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid (10% Tax Incentive)</SelectItem>
                  <SelectItem value="electric">Electric (EV)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CRSP Brand New Price:</span>
              <span className="font-semibold">{fmtKes(duty.baseNewCrspKes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">KRA Depreciation Applied:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {duty.depreciationPercent}% ({duty.residualPercent}% residual)
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-medium">
              <span>Customs Value (CIF Basis):</span>
              <span className="text-primary font-bold">{fmtKes(duty.customsValueKes)}</span>
            </div>
          </div>

          {!duty.isEligibleForKenya && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <strong>Warning:</strong> Vehicles older than 8 years from year of manufacture cannot be cleared for commercial registration in Kenya under KEBS/KRA KS 1515:2000 standards.
              </div>
            </div>
          )}
        </div>

        {/* Right Tax Schedule Breakdown (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border bg-muted/20 p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                KRA Tax Schedule Breakdown
              </span>
              <span className="text-xs font-mono text-muted-foreground">Rates: EAC CMA</span>
            </div>

            <div className="divide-y text-xs mt-2">
              <div className="py-2 flex justify-between">
                <div>
                  <span className="font-medium">1. Import Duty (ID)</span>
                  <span className="block text-[11px] text-muted-foreground">35% of Customs CIF Value</span>
                </div>
                <span className="font-mono font-semibold">{fmtKes(duty.importDutyKes)}</span>
              </div>

              <div className="py-2 flex justify-between">
                <div>
                  <span className="font-medium">2. Excise Duty (ED)</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {fuelType === "hybrid" || fuelType === "electric"
                      ? "10% (Green Incentive)"
                      : engineCc <= 1500
                        ? "20% (Displacement ≤1500cc)"
                        : engineCc <= 2500
                          ? "25% (Displacement ≤2500cc)"
                          : engineCc <= 3000
                            ? "30% (Displacement ≤3000cc)"
                            : "35% (>3000cc)"}{" "}
                    on (CIF + ID)
                  </span>
                </div>
                <span className="font-mono font-semibold">{fmtKes(duty.exciseDutyKes)}</span>
              </div>

              <div className="py-2 flex justify-between">
                <div>
                  <span className="font-medium">3. Value Added Tax (VAT)</span>
                  <span className="block text-[11px] text-muted-foreground">16% on (CIF + ID + ED)</span>
                </div>
                <span className="font-mono font-semibold">{fmtKes(duty.vatKes)}</span>
              </div>

              <div className="py-2 flex justify-between">
                <div>
                  <span className="font-medium">4. Import Declaration Fee (IDF)</span>
                  <span className="block text-[11px] text-muted-foreground">3.5% of CIF Value</span>
                </div>
                <span className="font-mono font-semibold">{fmtKes(duty.idfKes)}</span>
              </div>

              <div className="py-2 flex justify-between">
                <div>
                  <span className="font-medium">5. Railway Development Levy (RDL)</span>
                  <span className="block text-[11px] text-muted-foreground">2.0% of CIF Value</span>
                </div>
                <span className="font-mono font-semibold">{fmtKes(duty.rdlKes)}</span>
              </div>

              <div className="py-2 flex justify-between bg-primary/5 px-2 rounded font-semibold text-primary">
                <span>Total Direct KRA Taxes:</span>
                <span className="font-mono">{fmtKes(duty.totalKraTaxesKes)}</span>
              </div>
            </div>

            {/* Port & Clearing */}
            <div className="mt-3 rounded-lg border bg-background p-3 text-xs space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Mombasa CFS &amp; Port Wharfage:</span>
                <span className="font-mono">{fmtKes(duty.portCfsFeesKes)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Clearing Agent &amp; Declaration:</span>
                <span className="font-mono">{fmtKes(duty.clearingAgentFeesKes)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>NTSA Number Plates &amp; Sticker:</span>
                <span className="font-mono">{fmtKes(duty.registrationNumberPlatesKes)}</span>
              </div>
            </div>
          </div>

          {/* Total Banner */}
          <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground block font-medium">
                  Total Estimated Duty &amp; Clearance
                </span>
                <span className="text-xl font-extrabold text-foreground font-mono">
                  {fmtKes(duty.totalDutyAndClearingKes)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">USD Approx.</span>
                <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  ${duty.estimatedUsdEquivalent.toLocaleString()}
                </span>
              </div>
            </div>

            {onApplyDuty && (
              <Button
                onClick={() => onApplyDuty(duty)}
                className="w-full mt-3"
                size="sm"
                variant="default"
              >
                Apply This Duty Calculation To My Import Request
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
