import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { secondaryButton } from "@/components/account/dashboard-utils";

/**
 * Small presentation kit for the signed-in buyer / owner areas.
 * Calm, fast UI: no scroll motion, only hover / press transitions.
 */

export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = "default",
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "default" | "accent" | "ink";
  loading?: boolean;
}) {
  const toneCls =
    tone === "ink"
      ? "bg-ac-ink text-white border-transparent"
      : tone === "accent"
        ? "bg-ac-cream text-ac-ink border-transparent"
        : "bg-card text-foreground border-border";
  const sub = tone === "default" ? "text-muted-foreground" : tone === "ink" ? "text-white/65" : "text-ac-ink/70";
  return (
    <div className={cn("min-w-0 rounded-3xl border p-4 sm:p-5", toneCls)}>
      <div className={cn("flex items-center justify-between gap-2", sub)}>
        <span className="truncate text-xs font-bold">{label}</span>
        {icon && (
          <span
            className={cn(
              "shrink-0 [&_svg]:h-4 [&_svg]:w-4",
              tone === "ink" ? "text-ac-accent" : tone === "accent" ? "text-ac-ink" : "text-ac-accent",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-16" />
      ) : (
        <p className="font-brand mt-3 truncate text-3xl sm:text-4xl">{value}</p>
      )}
      {hint && <p className={cn("mt-1.5 line-clamp-2 text-xs", sub)}>{hint}</p>}
    </div>
  );
}

/** Dark "what matters now" card with a single call to action. */
export function NextStepCard({
  kicker = "Next step",
  title,
  body,
  icon,
  action,
  aside,
  className,
}: {
  kicker?: string;
  title: ReactNode;
  body?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] bg-ac-ink p-5 text-white sm:rounded-[36px] sm:p-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-60 w-60 rounded-full bg-ac-accent/20 blur-3xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {icon && (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ac-accent text-ac-ink [&_svg]:h-5 [&_svg]:w-5">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="brand-kicker text-ac-accent">{kicker}</p>
            <h2 className="font-brand mt-2 text-2xl sm:text-3xl">{title}</h2>
            {body && <div className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{body}</div>}
          </div>
        </div>
        {(action || aside) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {aside}
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  description,
  action,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {kicker && <p className="brand-kicker text-muted-foreground">{kicker}</p>}
        <h2 className="font-brand mt-1.5 text-2xl sm:text-3xl">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ListSkeleton({
  rows = 3,
  className = "h-24",
  grid,
}: {
  rows?: number;
  className?: string;
  grid?: string;
}) {
  return (
    <div className={grid ?? "space-y-3"} aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-3xl", className)} />
      ))}
    </div>
  );
}

export function ErrorNotice({
  title = "We couldn't load this right now",
  message = "Check your connection and refresh the page. Nothing you saved has been lost.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className={secondaryButton}>
          Try again
        </button>
      )}
    </div>
  );
}

/** Row-style link used for "everything else" shortcuts. */
export function ShortcutLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <Link
      to={to as never}
      className="group flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3.5 transition hover:border-ac-accent/60"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-foreground">{title}</span>
        {description && (
          <span className="block truncate text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

