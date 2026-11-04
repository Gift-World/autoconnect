import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export type Crumb = { label: string; to?: string };

/**
 * Standard page header used across buyer, seller and admin surfaces.
 * Presentation only — no data behaviour.
 */
export function PageHeader({
  title,
  description,
  crumbs,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="world-panel relative mb-6 px-5 py-5 sm:mb-8 sm:px-7 sm:py-6">
      <div className="world-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-sky-300/15 blur-3xl" />
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="relative mb-3">
          <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {crumbs.map((c, i) => (
              <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                {c.to ? (
                  <Link to={c.to as never} className="transition hover:text-foreground">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{c.label}</span>
                )}
                {i < crumbs.length - 1 && <ChevronRight className="h-3 w-3 opacity-60" />}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="world-kicker mb-2">{eyebrow}</p>}
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em] text-foreground sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 self-center">{actions}</div>}
      </div>
    </header>
  );
}
