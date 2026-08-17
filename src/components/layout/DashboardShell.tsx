import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export type DashboardNavItem = {
  to: string;
  icon: ReactNode;
  label: string;
  exact?: boolean;
  badge?: ReactNode;
};

export type DashboardNavSection = {
  label?: string;
  items: DashboardNavItem[];
};

interface DashboardShellProps {
  area: string;
  areaSubtitle?: string;
  sections: DashboardNavSection[];
  children: ReactNode;
}

export function DashboardShell({ area, areaSubtitle, sections, children }: DashboardShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-secondary/30 via-background to-background">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:py-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] lg:w-[260px] lg:shrink-0">
          <div className="rounded-2xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur lg:p-4">
            <div className="mb-3 hidden px-2 lg:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {area}
              </div>
              {areaSubtitle && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">{areaSubtitle}</p>
              )}
            </div>

            {/* Mobile: horizontal scroll */}
            <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:hidden">
              {sections.flatMap((s) => s.items).map((it) => {
                const active = isActive(it.to, it.exact);
                return (
                  <Link
                    key={it.to}
                    to={it.to as never}
                    className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-primary/30 bg-primary text-primary-foreground shadow-sm"
                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="[&_svg]:h-3.5 [&_svg]:w-3.5">{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop: vertical, grouped */}
            <div className="hidden lg:block">
              {sections.map((section, sIdx) => (
                <div key={sIdx} className={sIdx > 0 ? "mt-5 border-t border-border/60 pt-4" : ""}>
                  {section.label && (
                    <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
                      {section.label}
                    </div>
                  )}
                  <ul className="space-y-0.5">
                    {section.items.map((it) => {
                      const active = isActive(it.to, it.exact);
                      return (
                        <li key={it.to}>
                          <Link
                            to={it.to as never}
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                              active
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            }`}
                          >
                            {active && (
                              <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
                            )}
                            <span
                              className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                                active
                                  ? "bg-primary/15 text-primary"
                                  : "bg-muted/60 text-muted-foreground group-hover:text-foreground"
                              } [&_svg]:h-4 [&_svg]:w-4`}
                            >
                              {it.icon}
                            </span>
                            <span className="flex-1 truncate font-medium">{it.label}</span>
                            {it.badge}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
