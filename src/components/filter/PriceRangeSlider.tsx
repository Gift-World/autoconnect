import { Label } from "@/components/ui/label";

interface PriceRangeSliderProps {
  maxPrice: number | undefined;
  onChange: (val: number | undefined) => void;
  currency?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function PriceRangeSlider({
  maxPrice,
  onChange,
  currency = "$",
  min = 0,
  max = 100000,
  step = 2500,
}: PriceRangeSliderProps) {
  const currentVal = maxPrice ?? max;
  const percentage = Math.min(100, Math.max(0, ((currentVal - min) / (max - min)) * 100));

  const presets = [
    { label: "Under $15k", val: 15000 },
    { label: "Under $30k", val: 30000 },
    { label: "Under $60k", val: 60000 },
    { label: "Any Budget", val: undefined },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Max Price Filter
        </Label>
        <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
          {maxPrice == null ? "Any Price" : `Up to $${maxPrice.toLocaleString()}`}
        </span>
      </div>

      {/* Slider Track with fill */}
      <div className="relative pt-1">
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-75"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          onChange={(e) => {
            const num = Number(e.target.value);
            onChange(num >= max ? undefined : num);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Filter maximum vehicle price"
        />
      </div>

      <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>${min.toLocaleString()}</span>
        <span>${max.toLocaleString()}+</span>
      </div>

      {/* Quick Budget Presets */}
      <div className="grid grid-cols-2 gap-1.5 pt-1">
        {presets.map((preset) => {
          const isActive = maxPrice === preset.val;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.val)}
              className={`text-[11px] py-1.5 px-2 rounded-lg border transition-all truncate ${
                isActive
                  ? "bg-teal-500/15 border-teal-500 text-teal-600 dark:text-teal-300 font-bold"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
