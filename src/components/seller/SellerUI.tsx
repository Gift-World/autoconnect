import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Small presentation primitives shared by the seller workspace.
 * Dashboard rules: no scroll motion, tokens for neutral surfaces, ≥44px targets.
 */

type Tone = "default" | "accent" | "success" | "warning" | "danger";

const TONE_ICON: Record<Tone, string> = {
  default: "bg-muted text-foreground",
  accent: "bg-ac-accent text-ac-ink",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/12 text-destructive",
};

/** One big number. Use 3–4 in a row at the top of a dashboard page. */
export function StatTile({
  icon,
  label,
  value,
  sub,
  tone = "default",
  featured = false,
  loading = false,
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  /** Dark ink tile — use for the single most important number (earnings). */
  featured?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-between gap-4 rounded-3xl border p-4 sm:p-5",
        featured ? "border-transparent bg-ac-ink text-white" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "brand-kicker truncate",
            featured ? "text-ac-accent" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-full [&_svg]:h-4 [&_svg]:w-4",
              featured ? "bg-white/10 text-white" : TONE_ICON[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="min-w-0">
        {loading ? (
          <Skeleton className={cn("h-9 w-24", featured && "bg-white/15")} />
        ) : (
          <p className="font-brand truncate text-3xl leading-none sm:text-4xl">{value}</p>
        )}
        {sub && (
          <p
            className={cn(
              "mt-2 truncate text-xs",
              featured ? "text-white/65" : "text-muted-foreground",
            )}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

/** Rounded card section with an optional kicker, title and actions. */
export function Panel({
  kicker,
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  kicker?: string;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  const hasHead = kicker || title || description || actions;
  return (
    <section
      id={id}
      className={cn("min-w-0 rounded-3xl border border-border bg-card", className)}
    >
      {hasHead && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-6 sm:pt-6">
          <div className="min-w-0">
            {kicker && <p className="brand-kicker mb-1.5 text-muted-foreground">{kicker}</p>}
            {title && (
              <h2 className="font-brand text-xl leading-tight text-foreground sm:text-2xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4 sm:p-6", hasHead && "pt-4 sm:pt-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Intentional empty state: icon, plain sentence, one next step. */
export function EmptyPanel({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-3xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center sm:py-12",
        className,
      )}
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-ac-accent text-ac-ink [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </span>
      <p className="font-brand mt-4 text-lg text-foreground sm:text-xl">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Row-shaped loading placeholder for lists. */
export function ListSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
          <Skeleton className="h-14 w-16 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="hidden h-9 w-24 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

const NOTICE_TONE: Record<Exclude<Tone, "accent" | "default">, string> = {
  success: "border-success/30 bg-success/10 [&_.notice-icon]:text-success",
  warning: "border-warning/30 bg-warning/10 [&_.notice-icon]:text-warning",
  danger: "border-destructive/30 bg-destructive/10 [&_.notice-icon]:text-destructive",
};

/** Status banner (approved / under review / suspended …). */
export function Notice({
  tone,
  icon,
  title,
  children,
  action,
}: {
  tone: "success" | "warning" | "danger";
  icon: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center",
        NOTICE_TONE[tone],
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <span className="notice-icon mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-foreground">{title}</p>
          {children && <div className="mt-0.5 leading-6 text-muted-foreground">{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0 sm:ml-auto">{action}</div>}
    </div>
  );
}

/** Pill-shaped segmented filter for lists. */
export function FilterPills<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition",
              active
                ? "border-transparent bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
            {typeof o.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  active ? "bg-background/20" : "bg-muted",
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
