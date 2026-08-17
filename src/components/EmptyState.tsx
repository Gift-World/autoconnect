import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

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
    <div className="rounded-xl border border-dashed border-border bg-card/60 p-12 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full border border-border bg-muted text-muted-foreground [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="font-display text-base text-foreground">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {actionLabel && actionTo && (
        <Button asChild className="mt-5">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
