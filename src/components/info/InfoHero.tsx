import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared pill-button class strings for the trust / help / legal pages. */
export const pillPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac-accent focus-visible:ring-offset-2";
export const pillOnDark =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
export const pillOutline =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-bold text-foreground transition hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export const pillInk =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ac-ink px-6 text-sm font-bold text-white transition hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ac-accent";

/**
 * Dark, photo-backed page hero used by Trust, Payments and Disputes.
 * The hero clips its own photo only; nothing pinned lives inside it.
 */
export function InfoHero({
  kicker,
  title,
  intro,
  image,
  imageAlt = "",
  children,
  footer,
  compact = false,
}: {
  kicker: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  image?: string;
  imageAlt?: string;
  /** Action buttons. */
  children?: ReactNode;
  /** Optional strip rendered at the bottom of the hero (facts, chips). */
  footer?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="px-3 pt-3 sm:px-5 sm:pt-5">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
        {image && (
          <>
            <img
              src={image}
              alt={imageAlt}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.92),rgba(11,19,36,.55)_55%,rgba(11,19,36,.35))]" />
          </>
        )}
        <div
          className={cn(
            "mx-auto flex max-w-[1360px] flex-col justify-end p-6 sm:p-10 lg:p-14",
            compact ? "min-h-[360px] sm:min-h-[420px]" : "min-h-[520px] sm:min-h-[600px]",
          )}
        >
          <div className="max-w-4xl">
            <div className="brand-kicker flex items-center gap-2 text-ac-accent">{kicker}</div>
            <h1 className="font-brand mt-5 text-4xl sm:text-6xl lg:text-7xl">{title}</h1>
            {intro && (
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">{intro}</p>
            )}
            {children && <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
          </div>
          {footer && <div className="mt-10 border-t border-white/15 pt-6">{footer}</div>}
        </div>
      </div>
    </section>
  );
}

/** Section heading block: kicker + bold display title + optional lead. */
export function SectionHeading({
  kicker,
  title,
  lead,
  className,
  id,
}: {
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <p className="brand-kicker text-muted-foreground">{kicker}</p>
      <h2 id={id} className="font-brand mt-4 text-3xl text-foreground sm:text-5xl">
        {title}
      </h2>
      {lead && <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{lead}</p>}
    </div>
  );
}
