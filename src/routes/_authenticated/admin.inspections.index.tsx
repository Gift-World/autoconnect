import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  FilterChips,
  QueueEmpty,
  QueueSkeleton,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/inspections/")({
  component: AdminInspections,
});

type Row = {
  id: string;
  status: string;
  scheduled_date: string | null;
  mechanic_verdict: string | null;
  admin_approved: boolean | null;
  created_at: string;
  cars: { id: string; title: string } | null;
  sellers: { business_name: string | null } | null;
};

function AdminInspections() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("inspections")
      .select(
        "id,status,scheduled_date,mechanic_verdict,admin_approved,created_at,cars(id,title),sellers(business_name)",
      )
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const open = rows.filter((r) => !r.admin_approved);
  const approved = rows.filter((r) => r.admin_approved);
  const inFilter =
    filter === "open"
      ? oldestFirst(open, (r) => r.created_at)
      : filter === "approved"
        ? approved
        : rows;
  const term = search.trim().toLowerCase();
  const visible = term
    ? inFilter.filter((r) =>
        `${r.cars?.title ?? ""} ${r.sellers?.business_name ?? ""}`.toLowerCase().includes(term),
      )
    : inFilter;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Inspection operations"
        title="Review the evidence trail"
        description="Assign work, collect the report, then make an accountable approval decision."
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Inspection filters"
            active={filter}
            onSelect={setFilter}
            options={[
              { key: "open", label: "Not yet approved", count: open.length },
              { key: "approved", label: "Approved", count: approved.length },
              { key: "all", label: "All inspections", count: rows.length },
            ]}
          />
        }
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search car or seller…"
      />

      <AdminPanel>
        {loading ? (
          <QueueSkeleton rows={4} />
        ) : visible.length === 0 ? (
          <QueueEmpty
            icon={<Wrench />}
            title="Nothing here yet."
            description={
              rows.length === 0
                ? "Inspection requests appear here once a seller or buyer books one."
                : "No inspections match this filter or search."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 p-4 text-sm transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-stone text-ac-ink">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <Link
                      to="/cars/$id"
                      params={{ id: r.cars?.id ?? "" }}
                      className="block truncate font-semibold hover:underline"
                    >
                      {r.cars?.title ?? "Car"}
                    </Link>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {r.sellers?.business_name ?? "—"}
                      {r.scheduled_date && ` · ${r.scheduled_date}`}
                      {r.mechanic_verdict && ` · Verdict: ${r.mechanic_verdict}`}
                      {!r.admin_approved && ` · opened ${ageOf(r.created_at)} ago`}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <StatusPill status={r.status} />
                      {r.mechanic_verdict && <StatusPill status={r.mechanic_verdict} />}
                      {r.admin_approved && <StatusPill status="approved" label="Approved" />}
                    </div>
                  </div>
                </div>
                <Button size="sm" asChild className={TAP}>
                  <Link to="/admin/inspections/$id" params={{ id: r.id }}>
                    Open <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>
    </AdminPage>
  );
}
