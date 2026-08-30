import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Dot,
} from "recharts";
import { TrendingDown, Sparkles, Info, ShieldCheck } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";

interface PriceDepreciationChartProps {
  currentPrice: number;
  year?: number;
  make?: string;
  model?: string;
  mileage?: number;
  currency?: string;
  className?: string;
}

export function PriceDepreciationChart({
  currentPrice,
  year = 2019,
  make = "Toyota",
  model = "Prado",
  mileage = 65000,
  currency = "KES",
  className = "",
}: PriceDepreciationChartProps) {
  const { formatPrice } = useCurrency();

  const chartData = useMemo(() => {
    const carAge = Math.max(1, new Date().getFullYear() - year);
    const isToyota =
      make.toLowerCase().includes("toyota") ||
      make.toLowerCase().includes("lexus") ||
      model.toLowerCase().includes("prado") ||
      model.toLowerCase().includes("cruiser");
    const isHighMileage = (mileage || 0) > 100000;

    // Base rate
    let baseAnnualDepreciation = 0.10;
    if (carAge <= 3) {
      baseAnnualDepreciation = 0.15;
    } else if (carAge >= 8) {
      baseAnnualDepreciation = 0.05;
    }

    // Toyota / Prado retention discount (-3%)
    if (isToyota) {
      baseAnnualDepreciation = Math.max(0.03, baseAnnualDepreciation - 0.03);
    }

    // High mileage penalty (+2%)
    if (isHighMileage) {
      baseAnnualDepreciation += 0.02;
    }

    const sixMonthsRate = baseAnnualDepreciation * 0.5;
    const oneYearRate = baseAnnualDepreciation;
    const twoYearsRate = baseAnnualDepreciation * 1.85;
    const threeYearsRate = baseAnnualDepreciation * 2.6;

    const valNow = Math.round(currentPrice);
    const val6m = Math.round(currentPrice * (1 - sixMonthsRate));
    const val1y = Math.round(currentPrice * (1 - oneYearRate));
    const val2y = Math.round(currentPrice * (1 - twoYearsRate));
    const val3y = Math.round(currentPrice * (1 - threeYearsRate));

    return [
      { period: "Today", value: valNow, isCurrent: true, label: "Listed Price" },
      { period: "+6 Mos", value: val6m, isCurrent: false, label: "Est. 6 Months" },
      { period: "+1 Year", value: val1y, isCurrent: false, label: "Est. 1 Year" },
      { period: "+2 Years", value: val2y, isCurrent: false, label: "Est. 2 Years" },
      { period: "+3 Years", value: val3y, isCurrent: false, label: "Est. 3 Years" },
    ];
  }, [currentPrice, year, make, model, mileage]);

  const retentionPercent = Math.round(
    ((chartData[chartData.length - 1].value) / currentPrice) * 100
  );

  return (
    <div className={`rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              Projected Value Over Time
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Estimates only
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Market depreciation projection for {year} {make} {model}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 px-3 py-1.5 rounded-xl border border-border text-xs">
          <Sparkles className="h-3.5 w-3.5 text-teal-400" />
          <span className="text-muted-foreground">3-Yr Value Retention:</span>
          <span className="font-bold text-teal-400 font-mono">{retentionPercent}%</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="h-56 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickFormatter={(v) => {
                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                return String(v);
              }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl text-xs text-white space-y-1">
                      <p className="font-bold text-teal-300">{data.label}</p>
                      <p className="font-mono text-sm font-extrabold text-white">
                        {formatPrice(data.value)}
                      </p>
                      {data.isCurrent ? (
                        <p className="text-[10px] text-teal-400 font-semibold">● Current asking price</p>
                      ) : (
                        <p className="text-[10px] text-slate-400">
                          Estimated resale value in Kenya
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#14b8a6"
              strokeWidth={3}
              dot={{ fill: "#14b8a6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 7, fill: "#2dd4bf", stroke: "#0f172a", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-start gap-2">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <span>
          Based on average depreciation rates for this make and model in Kenya. Actual value depends on condition, mileage accrual, maintenance history, and market demand.
        </span>
      </div>
    </div>
  );
}
