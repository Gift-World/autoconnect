import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Phone, Calendar, Wallet, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { countryByCode } from "@/lib/countries";

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

  const { data, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Import requests</h1>
        <p className="text-sm text-muted-foreground">Manage buyer import requests across the platform.</p>
      </header>

      <Input
        placeholder="Search by buyer, make, or model…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {s.replace("_", " ")} ({byStatus(s).length})
            </TabsTrigger>
          ))}
        </TabsList>
        {STATUSES.map((s) => (
          <TabsContent key={s} value={s} className="mt-4">
            {isLoading ? (
              <div className="text-muted-foreground">Loading…</div>
            ) : byStatus(s).length === 0 ? (
              <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No requests.</div>
            ) : (
              <div className="space-y-3">
                {byStatus(s).map((r) => (
                  <Row key={r.id} r={r} onSetStatus={setStatus} onDelete={remove} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
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
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold">
            {r.make_name} {r.model_name ?? ""}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({r.year_from ?? "any"}–{r.year_to ?? "any"})
            </span>
          </h3>
          <div className="mt-1 text-xs text-muted-foreground">
            {r.buyer_name} · <a href={`mailto:${r.buyer_email}`} className="hover:text-primary"><Mail className="inline h-3 w-3" /> {r.buyer_email}</a>
            {r.buyer_phone && <> · <a href={`tel:${r.buyer_phone}`} className="hover:text-primary"><Phone className="inline h-3 w-3" /> {r.buyer_phone}</a></>}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span><Wallet className="inline h-3 w-3" /> {budget}</span>
            <span>{dest ? `${dest.flag} ${dest.name}` : r.buyer_country}</span>
            <span><Calendar className="inline h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}</span>
            {r.preferred_condition && r.preferred_condition !== "any" && <Badge variant="outline">{r.preferred_condition}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={r.status} onValueChange={(v) => onSetStatus(r, v)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="icon" variant="ghost" onClick={() => onDelete(r)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      {r.additional_notes && (
        <p className="mt-3 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">{r.additional_notes}</p>
      )}
    </div>
  );
}
