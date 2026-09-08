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
    <header className="relative mb-6 overflow-hidden rounded-[28px] border border-border/80 bg-card px-5 py-5 shadow-card sm:mb-8 sm:px-7 sm:py-6">
      <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-teal-400/10 blur-3xl" />
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
          {eyebrow && <p className="eyebrow mb-2 text-teal-700 dark:text-teal-300">{eyebrow}</p>}
          <h1 className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">{title}</h1>
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
