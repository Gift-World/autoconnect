import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Phone, Calendar, Wallet, Trash2, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { countryByCode } from "@/lib/countries";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  FilterChips,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP_ICON,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/import-requests")({
  head: () => ({ meta: [{ title: "Import Requests — Admin — AutoConnect" }] }),
  component: AdminImportsPage,
});

type ImportRow = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_country: string;
  make_name: string;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  preferred_condition: string | null;
  additional_notes: string | null;
  status: string;
  created_at: string;
};

const STATUSES = ["open", "in_progress", "fulfilled", "closed"] as const;

function AdminImportsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>("open");
  const [q, setQ] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ImportRow[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-imports"] });

  async function setStatus(r: ImportRow, status: string) {
    const { error } = await supabase.from("import_requests").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked as ${status.replace("_", " ")}`);
    refresh();
  }
  async function remove(r: ImportRow) {
    if (!confirm("Delete this request?")) return;
    const { error } = await supabase.from("import_requests").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  const all = data ?? [];
  const term = q.trim().toLowerCase();
  const filtered = (rows: ImportRow[]) =>
    term
      ? rows.filter(
          (r) =>
            r.make_name.toLowerCase().includes(term) ||
            r.model_name?.toLowerCase().includes(term) ||
            r.buyer_name.toLowerCase().includes(term) ||
            r.buyer_email.toLowerCase().includes(term),
        )
      : rows;

  const byStatus = (s: string) => filtered(all.filter((r) => r.status === s));
  // Open and in-progress requests are queues: oldest first.
  const current =
    tab === "open" || tab === "in_progress"
      ? oldestFirst(byStatus(tab), (r) => r.created_at)
      : byStatus(tab);

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Buyer demand"
        title="Import requests"
        description="Manage buyer import requests across the platform."
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Import request status"
            active={tab}
            onSelect={setTab}
            options={STATUSES.map((s) => ({
              key: s,
              label: s.replace("_", " "),
              count: byStatus(s).length,
            }))}
          />
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search by buyer, make, or model…"
      />

      {isError && (
        <QueueError>Import requests could not load. This is not an empty result.</QueueError>
      )}

      <AdminPanel>
        {isLoading ? (
          <QueueSkeleton rows={4} />
        ) : current.length === 0 ? (
          <QueueEmpty
            icon={<Inbox />}
            title="No requests"
            description={
              tab === "open"
                ? "When a buyer asks AutoConnect to source a car, the request lands here."
                : "Nothing in this status. Try another filter or clear the search."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {current.map((r) => (
              <Row key={r.id} r={r} onSetStatus={setStatus} onDelete={remove} />
            ))}
          </ul>
        )}
      </AdminPanel>
    </AdminPage>
  );
}

function Row({
  r,
  onSetStatus,
  onDelete,
}: {
  r: ImportRow;
  onSetStatus: (r: ImportRow, s: string) => void;
  onDelete: (r: ImportRow) => void;
}) {
  const dest = countryByCode(r.buyer_country);
  const budget =
    r.budget_min || r.budget_max
      ? `${r.budget_min?.toLocaleString() ?? "—"}–${r.budget_max?.toLocaleString() ?? "—"} ${r.budget_currency}`
      : "—";
  return (
    <li className="p-4 transition hover:bg-muted/30 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold">
            {r.make_name} {r.model_name ?? ""}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({r.year_from ?? "any"}–{r.year_to ?? "any"})
            </span>
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{r.buyer_name}</span>
            <a
              href={`mailto:${r.buyer_email}`}
              className="inline-flex min-h-8 items-center gap-1 break-all hover:text-primary"
            >
              <Mail className="h-3 w-3 shrink-0" /> {r.buyer_email}
            </a>
            {r.buyer_phone && (
              <a
                href={`tel:${r.buyer_phone}`}
                className="inline-flex min-h-8 items-center gap-1 hover:text-primary"
              >
                <Phone className="h-3 w-3" /> {r.buyer_phone}
              </a>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Wallet className="h-3 w-3" /> {budget}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {dest ? `${dest.flag} ${dest.name}` : r.buyer_country}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()} ·{" "}
              {ageOf(r.created_at)} ago
            </span>
            {r.preferred_condition && r.preferred_condition !== "any" && (
              <Badge variant="outline" className="rounded-full capitalize">
                {r.preferred_condition}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={r.status} onValueChange={(v) => onSetStatus(r, v)}>
            <SelectTrigger
              className="h-11 w-full min-w-[150px] rounded-full capitalize sm:w-[160px] lg:h-9 lg:pointer-coarse:h-11"
              aria-label="Request status"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className={TAP_ICON}
            onClick={() => onDelete(r)}
            aria-label="Delete request"
            title="Delete request"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {r.additional_notes && (
        <p className="mt-3 rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
          {r.additional_notes}
        </p>
      )}
    </li>
  );
}
