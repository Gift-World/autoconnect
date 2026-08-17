import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type QueueCount = { key: string; label: string; count: number };

/**
 * Shared header for admin review queues: title, live counts and a search box.
 * Counts are clickable when onSelect is provided.
 */
export function QueueToolbar({
  title,
  description,
  counts = [],
  active,
  onSelect,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  children,
}: {
  title: string;
  description?: string;
  counts?: QueueCount[];
  active?: string;
  onSelect?: (key: string) => void;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
          {onSearch && (
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-56 pl-8"
              />
            </div>
          )}
        </div>
      </div>

      {counts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {counts.map((c) => {
            const isActive = active === c.key;
            const clickable = Boolean(onSelect);
            return (
              <button
                key={c.key}
                type="button"
                disabled={!clickable}
                onClick={() => onSelect?.(c.key)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground"
                } ${clickable ? "hover:border-primary/50 hover:text-foreground" : "cursor-default"}`}
              >
                {c.label}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-foreground">
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
