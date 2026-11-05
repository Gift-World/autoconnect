import type { ReactNode } from "react";
import { Check, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Presentation pieces for the step-by-step "create a listing" flow. */

export type WizardStep = { id: string; label: string };

/** Big, clear progress: a segmented bar plus "Step x of y". */
export function WizardProgress({
  steps,
  current,
  maxVisited,
  onJump,
}: {
  steps: WizardStep[];
  current: number;
  maxVisited: number;
  onJump: (index: number) => void;
}) {
  return (
    <nav aria-label="Listing steps" className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-foreground">
          Step {current + 1} <span className="text-muted-foreground">of {steps.length}</span>
        </p>
        <p className="truncate text-muted-foreground">{steps[current]?.label}</p>
      </div>
      <ol className="flex gap-1.5">
        {steps.map((s, i) => {
          const reachable = i <= maxVisited;
          return (
            <li key={s.id} className="flex-1">
              <button
                type="button"
                onClick={() => reachable && onJump(i)}
                disabled={!reachable}
                aria-current={i === current ? "step" : undefined}
                aria-label={`${s.label}${i < current ? " (done)" : ""}`}
                title={s.label}
                className="group block w-full py-2 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-colors",
                    i < current
                      ? "bg-foreground"
                      : i === current
                        ? "bg-ac-accent"
                        : reachable
                          ? "bg-foreground/25 group-hover:bg-foreground/40"
                          : "bg-muted",
                  )}
                />
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** One question per screen: kicker, big title, short helper line. */
export function StepIntro({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="mb-6 sm:mb-8">
      <p className="brand-kicker text-muted-foreground">{kicker}</p>
      <h2 className="font-brand mt-2 text-3xl leading-[1.05] text-foreground sm:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

/** Large tappable options (Airbnb-style) for short enum fields. */
export function ChoiceTiles<T extends string>({
  value,
  onChange,
  options,
  columns = "grid-cols-2 sm:grid-cols-3",
  ariaLabel,
}: {
  value: T | "" | undefined;
  onChange: (v: T) => void;
  options: { value: T; label: string; hint?: string }[];
  columns?: string;
  ariaLabel: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2.5", columns)}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex min-h-[56px] flex-col items-start justify-center rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99]",
              active
                ? "border-foreground bg-foreground/[0.04] ring-1 ring-foreground"
                : "border-border bg-card hover:border-foreground/40",
            )}
          >
            <span className="pr-6 text-sm font-semibold text-foreground">{o.label}</span>
            {o.hint && <span className="mt-0.5 text-xs text-muted-foreground">{o.hint}</span>}
            {active && (
              <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Friendly AI / data helper card used inside steps. */
export function HelperCard({
  icon,
  title,
  badge,
  children,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-ac-accent/30 bg-ac-accent/[0.07] p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{title}</p>
            {badge && (
              <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {badge}
              </span>
            )}
          </div>
          {children && (
            <div className="mt-1 text-sm leading-6 text-muted-foreground">{children}</div>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}

/** Live preview of how the listing card will look to buyers. */
export function ListingPreview({
  coverUrl,
  title,
  subtitle,
  price,
  location,
  photoCount,
}: {
  coverUrl?: string | null;
  title: string;
  subtitle?: string;
  price?: string;
  location?: string;
  photoCount: number;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative aspect-[4/3] bg-muted">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover photo preview" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <span className="text-xs">Your cover photo shows here</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ac-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white">
          {photoCount} {photoCount === 1 ? "photo" : "photos"}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <p className="line-clamp-2 font-semibold leading-snug text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {price && <p className="font-brand pt-1 text-xl text-foreground">{price}</p>}
        {location && <p className="text-xs text-muted-foreground">{location}</p>}
      </div>
    </div>
  );
}

/** Pass / to-do line for the quality checklist on the review step. */
export function CheckLine({ ok, label, hint }: { ok: boolean; label: string; hint?: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
          ok ? "bg-success text-white" : "border-2 border-warning",
        )}
      >
        {ok && <Check className="h-3 w-3" />}
      </span>
      <span className="min-w-0 text-sm">
        <span className={ok ? "text-foreground" : "font-semibold text-foreground"}>{label}</span>
        {!ok && hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </li>
  );
}
