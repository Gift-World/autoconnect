import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { RoleSwitcher } from "@/components/RoleSwitcher";

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
    <div className="relative min-h-[calc(100vh-4rem)] bg-background">
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:gap-8 lg:py-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-[5.5rem] lg:h-[calc(100vh-7rem)] lg:w-[264px] lg:shrink-0">
          <div className="rounded-3xl border border-border bg-card p-2 lg:h-full lg:overflow-y-auto lg:border-0 lg:bg-ac-ink lg:p-4 lg:text-white">
            <div className="mb-3 hidden px-2 lg:block">
              <div className="flex items-center justify-between gap-2">
                <div className="brand-kicker text-ac-accent">{area}</div>
              </div>
              {areaSubtitle && (
                <p className="mt-1 text-xs text-white/60">{areaSubtitle}</p>
              )}
              <div className="mt-3 flex flex-col gap-1.5 border-t border-white/10 pt-3 text-foreground">
                <RoleSwitcher className="w-full justify-between" />
                <Link
                  to="/dashboard"
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-ac-accent hover:text-ac-accent"
                >
                  <span>All-in-One Portal</span>
                </Link>
              </div>
            </div>

            {/* Mobile: horizontal scroll */}
            <nav aria-label={`${area} sections`} className="flex gap-1.5 overflow-x-auto p-1 lg:hidden">
              {sections
                .flatMap((s) => s.items)
                .map((it) => {
                  const active = isActive(it.to, it.exact);
                  return (
                    <Link
                      key={it.to}
                      to={it.to as never}
                      className={`flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                        active
                          ? "bg-ac-ink text-white dark:bg-ac-accent dark:text-ac-ink"
                          : "bg-muted text-muted-foreground hover:text-foreground"
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
                <div key={sIdx} className={sIdx > 0 ? "mt-5 border-t border-white/10 pt-4" : ""}>
                  {section.label && (
                  <div className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white/45">
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
                            className={`group relative flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm transition ${
                              active
                                ? "bg-white/10 text-white"
                                : "text-white/65 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            {active && (
                              <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-ac-accent" />
                            )}
                            <span
                              className={`grid h-7 w-7 place-items-center rounded-lg transition ${
                                active
                                  ? "bg-ac-accent text-ac-ink"
                                  : "bg-white/5 text-white/70 group-hover:text-white"
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
