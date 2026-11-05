import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Shared presentation primitives for the admin console.
 * Presentation only — no data behaviour lives here.
 */

/** Touch-friendly action button sizing: 44px on touch / small screens, compact on desktop. */
export const TAP = "h-11 rounded-full px-4 text-sm lg:h-9 lg:pointer-coarse:h-11";
export const TAP_ICON =
  "h-11 w-11 rounded-full lg:h-9 lg:w-9 lg:pointer-coarse:h-11 lg:pointer-coarse:w-11";

/** Human "time since" for queue ages (e.g. "3h", "2d"). */
export function ageOf(iso: string | null | undefined) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "—";
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Sort a copy oldest-first by an ISO date field. */
export function oldestFirst<T>(rows: T[], pick: (r: T) => string | null | undefined) {
  return [...rows].sort((a, b) => {
    const ta = new Date(pick(a) ?? 0).getTime() || 0;
    const tb = new Date(pick(b) ?? 0).getTime() || 0;
    return ta - tb;
  });
}

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("min-w-0 space-y-4 sm:space-y-6", className)}>{children}</div>;
}

/** Calm card surface used for every admin section. */
export function AdminPanel({
  kicker,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  kicker?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHead = kicker || title || description || actions;
  return (
    <section
      className={cn("min-w-0 overflow-hidden rounded-3xl border border-border bg-card", className)}
    >
      {hasHead && (
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <div className="min-w-0">
            {kicker && <p className="brand-kicker text-muted-foreground">{kicker}</p>}
            {title && (
              <h2 className="font-brand mt-1 text-xl text-foreground sm:text-2xl">{title}</h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(bodyClassName)}>{children}</div>
    </section>
  );
}

/** Big-number tile for a queue that needs a human. Links to the queue. */
export function QueueTile({
  to,
  label,
  count,
  hint,
  icon,
  loading,
}: {
  to: string;
  label: string;
  count: number | null | undefined;
  hint?: string;
  icon: ReactNode;
  loading?: boolean;
}) {
  const hot = (count ?? 0) > 0;
  return (
    <Link
      to={to as never}
      className={cn(
        "group relative flex min-h-[132px] flex-col justify-between rounded-3xl border p-4 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5",
        hot
          ? "border-ac-accent/40 bg-ac-accent/10 hover:border-ac-accent"
          : "border-border bg-card hover:border-foreground/25",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full [&_svg]:h-4 [&_svg]:w-4",
            hot ? "bg-ac-accent text-ac-ink" : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </span>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-10 w-16 rounded-xl" />
        ) : (
          <p className="font-brand text-4xl tabular-nums text-foreground sm:text-5xl">
            {count ?? 0}
          </p>
        )}
        <p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </Link>
  );
}

/** Quiet platform stat tile. */
export function StatTile({
  icon,
  label,
  value,
  sub,
  loading,
  tone = "default",
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  loading?: boolean;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneCls =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-foreground";
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24 rounded-lg" />
      ) : (
        <div className={cn("font-brand mt-2 truncate text-2xl tabular-nums sm:text-3xl", toneCls)}>
          {value}
        </div>
      )}
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export type FilterOption = { key: string; label: string; count?: number };

/** Rounded filter chips with counts. Scrolls inside itself on narrow screens. */
export function FilterChips({
  options,
  active,
  onSelect,
  label = "Filter",
}: {
  options: FilterOption[];
  active: string;
  onSelect: (key: string) => void;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]"
    >
      {options.map((o) => {
        const on = o.key === active;
        return (
          <button
            key={o.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(o.key)}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold capitalize transition lg:h-9 lg:pointer-coarse:h-11",
              on
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  on ? "bg-background/20" : "bg-muted text-foreground",
                )}
              >
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Toolbar row: filters on the left, search + actions on the right. */
export function AdminToolbar({
  filters,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  actions,
}: {
  filters?: ReactNode;
  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-3xl border border-border bg-card p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">{filters}</div>
      {(onSearch || actions) && (
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          {onSearch && (
            <label className="relative block min-w-0 sm:w-72">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search ?? ""}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-11 w-full rounded-full pl-10 lg:h-9 lg:pointer-coarse:h-11"
              />
            </label>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
    </div>
  );
}

/** Intentional loading placeholder for queue lists. */
export function QueueSkeleton({ rows = 4, media = false }: { rows?: number; media?: boolean }) {
  return (
    <div className="divide-y divide-border" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 sm:px-6">
          {media && <Skeleton className="h-14 w-20 shrink-0 rounded-xl" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5 rounded-full" />
            <Skeleton className="h-3 w-3/5 rounded-full" />
          </div>
          <Skeleton className="hidden h-9 w-24 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Calm empty state that lives inside a panel. */
export function QueueEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ac-cream text-ac-ink [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="font-brand mt-4 text-xl text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function QueueError({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Small inline label that marks AI output. */
export function AiTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-ac-powder px-2 py-0.5 text-[11px] font-bold text-ac-ink",
        className,
      )}
    >
      <Sparkles className="h-3 w-3" /> AI suggestion
    </span>
  );
}

/** Wrapper for AI helper output. Always states it is a suggestion, not a decision. */
export function AiSuggestion({
  title,
  children,
  footnote = "AI suggestion only. Check the evidence yourself before you decide.",
  tone = "neutral",
  className,
}: {
  title?: ReactNode;
  children: ReactNode;
  footnote?: ReactNode;
  tone?: "neutral" | "low" | "medium" | "high";
  className?: string;
}) {
  const toneCls =
    tone === "high"
      ? "border-destructive/40 bg-destructive/5"
      : tone === "medium"
        ? "border-amber-500/40 bg-amber-500/5"
        : tone === "low"
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border bg-muted/40";
  return (
    <div className={cn("rounded-2xl border p-3 text-xs sm:p-4", toneCls, className)}>
      <div className="flex flex-wrap items-center gap-2">
        <AiTag />
        {title && <span className="font-semibold text-foreground">{title}</span>}
      </div>
      <div className="mt-2 text-foreground/90">{children}</div>
      {footnote && <p className="mt-2 text-[11px] text-muted-foreground">{footnote}</p>}
    </div>
  );
}

/** Label / value row for detail sheets. */
export function KV({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-border/70 py-2.5 text-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
