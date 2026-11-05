import { X, RotateCcw } from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { cn } from "@/lib/utils";

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
  /** "inline" renders bare chips for use inside a horizontally scrolling chip row. */
  variant?: "wrap" | "inline";
  className?: string;
}

export function getActiveFilterChips(search: ActiveFilterChipsProps["search"]) {
  const chips: { key: string; label: string }[] = [];

  if (search.q?.trim()) {
    chips.push({ key: "q", label: `“${search.q.trim()}”` });
  }
  if (search.make) {
    chips.push({ key: "make", label: search.make });
  }
  if (search.country) {
    const country = countryByCode(search.country);
    chips.push({
      key: "country",
      label: `${country?.flag ?? ""} ${country?.name ?? search.country}`.trim(),
    });
  }
  if (search.condition) {
    chips.push({ key: "condition", label: search.condition });
  }
  if (search.maxPrice != null) {
    chips.push({ key: "maxPrice", label: `Max $${search.maxPrice.toLocaleString()}` });
  }
  if (search.minPrice != null) {
    chips.push({ key: "minPrice", label: `Min $${search.minPrice.toLocaleString()}` });
  }
  if (search.minYear != null || search.maxYear != null) {
    const yr = `${search.minYear ?? 1990}–${search.maxYear ?? 2026}`;
    chips.push({ key: "minYear", label: `Year ${yr}` });
  }
  if (search.rhd) {
    chips.push({ key: "rhd", label: search.rhd === "right" ? "RHD" : "LHD" });
  }
  if (search.exportOnly) {
    chips.push({ key: "exportOnly", label: "Export only" });
  }
  if (search.near && search.near > 0) {
    chips.push({ key: "near", label: `Within ${search.near} km` });
  }
  return chips;
}

export function ActiveFilterChips({
  search,
  onRemove,
  onResetAll,
  variant = "wrap",
  className,
}: ActiveFilterChipsProps) {
  const chips = getActiveFilterChips(search);
  if (chips.length === 0) return null;

  const items = (
    <>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onRemove(chip.key)}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-foreground/80 bg-foreground px-4 text-sm font-semibold capitalize text-background transition hover:opacity-90"
          aria-label={`Remove filter ${chip.label}`}
        >
          <span className="max-w-[180px] truncate">{chip.label}</span>
          <X className="h-3.5 w-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={onResetAll}
        className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Clear all
      </button>
    </>
  );

  if (variant === "inline") return items;

  return (
    <div className={cn("flex flex-wrap items-center gap-2 py-2", className)}>
      <span className="mr-1 text-xs font-semibold text-muted-foreground">
        Applied ({chips.length})
      </span>
      {items}
    </div>
  );
}
