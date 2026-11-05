import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Intentional empty / error state for the import, yard, parts and care pages.
 * Always gives the visitor a next step.
 */
export function StoryEmpty({
  icon,
  kicker,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondary,
  tone = "neutral",
  className,
}: {
  icon: ReactNode;
  kicker?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  secondary?: ReactNode;
  tone?: "neutral" | "warning";
  className?: string;
}) {
  const action =
    actionLabel && actionTo ? (
      <Link
        to={actionTo}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:gap-3"
      >
        {actionLabel} <ArrowRight className="h-4 w-4" />
      </Link>
    ) : actionLabel && onAction ? (
      <button
        type="button"
        onClick={onAction}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:gap-3"
      >
        {actionLabel} <ArrowRight className="h-4 w-4" />
      </button>
    ) : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] border border-dashed p-8 sm:p-12",
        tone === "warning"
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-border bg-card",
        className,
      )}
    >
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <span
          className={cn(
            "grid h-16 w-16 shrink-0 place-items-center rounded-2xl [&_svg]:h-7 [&_svg]:w-7",
            tone === "warning"
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
              : "bg-ac-accent/15 text-ac-accent",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          {kicker && <p className="brand-kicker text-muted-foreground">{kicker}</p>}
          <h3 className="font-brand mt-1 text-2xl text-foreground sm:text-3xl">{title}</h3>
          {description && (
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
          )}
          {(action || secondary) && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {action}
              {secondary}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Small secondary text link used beside a primary action. */
export function QuietLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      {children}
    </Link>
  );
}
