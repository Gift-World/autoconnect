import { X, RotateCcw } from "lucide-react";
import { countryByCode } from "@/lib/countries";

interface ActiveFilterChipsProps {
  search: {
    q?: string;
    country?: string;
    make?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    minYear?: number;
    maxYear?: number;
    exportOnly?: boolean;
    rhd?: string;
    near?: number;
  };
  onRemove: (key: string) => void;
  onResetAll: () => void;
}

export function ActiveFilterChips({ search, onRemove, onResetAll }: ActiveFilterChipsProps) {
  const chips: { key: string; label: string }[] = [];

  if (search.q?.trim()) {
    chips.push({ key: "q", label: `Search: "${search.q.trim()}"` });
  }

  if (search.make) {
    chips.push({ key: "make", label: `Make: ${search.make}` });
  }

  if (search.country) {
    const country = countryByCode(search.country);
    chips.push({ key: "country", label: `Country: ${country?.flag ?? ""} ${country?.name ?? search.country}` });
  }

  if (search.condition) {
    chips.push({ key: "condition", label: `Condition: ${search.condition}` });
  }

  if (search.maxPrice != null) {
    chips.push({ key: "maxPrice", label: `Max: $${search.maxPrice.toLocaleString()}` });
  }

  if (search.minPrice != null) {
    chips.push({ key: "minPrice", label: `Min: $${search.minPrice.toLocaleString()}` });
  }

  if (search.minYear != null || search.maxYear != null) {
    const yr = `${search.minYear ?? 1990} - ${search.maxYear ?? 2026}`;
    chips.push({ key: "minYear", label: `Year: ${yr}` });
  }

  if (search.rhd) {
    chips.push({ key: "rhd", label: search.rhd === "right" ? "RHD" : "LHD" });
  }

  if (search.exportOnly) {
    chips.push({ key: "exportOnly", label: "Export Only" });
  }

  if (search.near && search.near > 0) {
    chips.push({ key: "near", label: `Within ${search.near} km` });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap py-2 mb-2">
      <span className="text-xs font-semibold text-muted-foreground mr-1">
        Applied ({chips.length}):
      </span>

      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-teal-500/10 border border-teal-500/30 text-teal-700 dark:text-teal-300 font-medium"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            className="text-teal-700/60 dark:text-teal-300/60 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetAll}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium ml-1 transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        <span>Clear all</span>
      </button>
    </div>
  );
}
