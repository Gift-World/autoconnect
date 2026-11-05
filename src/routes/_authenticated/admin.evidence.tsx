import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, ExternalLink, FileCheck2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  FilterChips,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";

type EvidenceRow = {
  id: string;
  title: string;
  evidence_type: string;
  source_url: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  cars: { title: string | null } | { title: string | null }[] | null;
};

export const Route = createFileRoute("/_authenticated/admin/evidence")({
  component: AdminEvidence,
});

function AdminEvidence() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("submitted");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-vehicle-evidence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_evidence")
        .select("id,title,evidence_type,source_url,status,is_public,created_at,cars(title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EvidenceRow[];
    },
  });
  const review = async (row: EvidenceRow, status: "verified" | "rejected") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("vehicle_evidence")
      .update({
        status,
        is_public: status === "verified",
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success(status === "verified" ? "Evidence verified and published" : "Evidence rejected");
    qc.invalidateQueries({ queryKey: ["admin-vehicle-evidence"] });
  };

  const rows = data ?? [];
  const carTitle = (row: EvidenceRow) =>
    (Array.isArray(row.cars) ? row.cars[0] : row.cars)?.title || "Vehicle";
  const countOf = (s: string) => rows.filter((r) => r.status === s).length;
  const inFilter =
    filter === "all"
      ? rows
      : filter === "submitted"
        ? oldestFirst(
            rows.filter((r) => r.status === "submitted"),
            (r) => r.created_at,
          )
        : rows.filter((r) => r.status === filter);
  const term = search.trim().toLowerCase();
  const visible = term
    ? inFilter.filter((r) =>
        `${r.title} ${carTitle(r)} ${r.evidence_type}`.toLowerCase().includes(term),
      )
    : inFilter;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Trust operations"
        title="Vehicle evidence review"
        description="Only source documents you have reviewed can be marked verified or shown publicly."
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Evidence status"
            active={filter}
            onSelect={setFilter}
            options={[
              { key: "submitted", label: "Awaiting review", count: countOf("submitted") },
              { key: "verified", label: "Verified", count: countOf("verified") },
              { key: "rejected", label: "Rejected", count: countOf("rejected") },
              { key: "all", label: "All", count: rows.length },
            ]}
          />
        }
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search evidence or vehicle…"
      />

      {isError ? (
        <QueueError>Evidence queue could not load. This is not an empty result.</QueueError>
      ) : (
        <AdminPanel>
          {isLoading ? (
            <QueueSkeleton rows={4} />
          ) : visible.length ? (
            <ul className="divide-y divide-border">
              {visible.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ac-powder text-ac-ink">
                      <FileCheck2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{row.title}</p>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {carTitle(row)} · {row.evidence_type.replaceAll("_", " ")}
                        {row.status === "submitted" && ` · waiting ${ageOf(row.created_at)}`}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill
                          status={row.status === "submitted" ? "pending" : row.status}
                          label={
                            row.status === "submitted"
                              ? "Submitted"
                              : row.status === "verified"
                                ? "Verified"
                                : undefined
                          }
                        />
                        {row.source_url && (
                          <a
                            href={row.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300"
                          >
                            Open source document <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {row.status === "submitted" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                          onClick={() => review(row, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button size="sm" className={TAP} onClick={() => review(row, "verified")}>
                          <CheckCircle2 className="h-4 w-4" />
                          Verify & publish
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <QueueEmpty
              icon={<FileCheck2 />}
              title={filter === "submitted" ? "No evidence awaiting review." : "Nothing here"}
              description={
                filter === "submitted"
                  ? "Sellers' source documents appear here, oldest first."
                  : "No evidence matches this filter or search."
              }
            />
          )}
        </AdminPanel>
      )}
    </AdminPage>
  );
}
