import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center sm:px-12">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ac-cream text-ac-ink [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="text-lg font-extrabold tracking-tight text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ac-ink px-5 text-sm font-bold text-white transition hover:gap-3 dark:bg-ac-accent dark:text-ac-ink"
        >
          {actionLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
