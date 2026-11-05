import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminToolbar, FilterChips } from "@/components/admin/AdminUI";

export type QueueCount = { key: string; label: string; count: number };

/**
 * Shared header for admin review queues: page title, then a toolbar with
 * live counts (as filter chips), search and optional actions.
 * Counts are clickable when onSelect is provided.
 */
export function QueueToolbar({
  title,
  description,
  eyebrow = "Review queue",
  counts = [],
  active,
  onSelect,
  search,
  onSearch,
  searchPlaceholder = "Search…",
  children,
  headerActions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  counts?: QueueCount[];
  active?: string;
  onSelect?: (key: string) => void;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  /** Extra toolbar actions (bulk actions, buttons). */
  children?: ReactNode;
  /** Actions shown in the page header (primary page-level actions). */
  headerActions?: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={headerActions}
      />
      <AdminToolbar
        filters={
          counts.length > 0 ? (
            onSelect ? (
              <FilterChips
                options={counts}
                active={active ?? ""}
                onSelect={onSelect}
                label={`${title} filters`}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {counts.map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground"
                  >
                    {c.label}
                    <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-foreground">
                      {c.count}
                    </span>
                  </span>
                ))}
              </div>
            )
          ) : null
        }
        search={search}
        onSearch={onSearch}
        searchPlaceholder={searchPlaceholder}
        actions={children}
      />
    </div>
  );
}
