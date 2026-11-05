import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, FileText, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { aiDocGuidance } from "@/lib/ai.functions";
import { QueueToolbar } from "@/components/admin/QueueToolbar";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  AiSuggestion,
  QueueEmpty,
  QueueSkeleton,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";
import { REQUIRED_DOC_KINDS, DOC_LABELS, missingDocKinds } from "@/lib/listing-checklist";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/documents")({
  component: AdminDocuments,
});

interface Row {
  id: string;
  car_id: string;
  seller_id: string;
  kind: string;
  label: string | null;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  review_notes: string | null;
  car: { title: string } | null;
  seller: { display_name: string | null; email: string | null } | null;
}

type Guidance = { focus: string[]; questions_for_seller: string[]; summary: string };

function AdminDocuments() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"pending" | "verified" | "rejected">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [guidance, setGuidance] = useState<Record<string, Guidance | "loading">>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("car_documents")
      .select(
        "id,car_id,seller_id,kind,label,file_path,mime_type,size_bytes,status,created_at,review_notes,car:cars(title)",
      )
      .eq("status", tab)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) toast.error(error.message);
    const baseRows = (data as unknown as Omit<Row, "seller">[]) ?? [];
    const sellerIds = Array.from(new Set(baseRows.map((r) => r.seller_id)));
    let sellerMap: Record<string, { display_name: string | null; email: string | null }> = {};
    if (sellerIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id,full_name")
        .in("id", sellerIds);
      sellerMap = Object.fromEntries(
        (profs ?? []).map((p: { id: string; full_name: string | null }) => [
          p.id,
          { display_name: p.full_name, email: null },
        ]),
      );
    }
    if (baseRows.length > 0) {
      setRows(baseRows.map((r) => ({ ...r, seller: sellerMap[r.seller_id] ?? null })));
    } else {
      // High-quality demo documents queue for testing
      setRows([
        {
          id: "doc-demo-1",
          car_id: "demo-car-1",
          seller_id: "demo-seller-kenji",
          kind: "logbook",
          label: "Export Certificate & Original Logbook",
          file_path:
            "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80",
          mime_type: "application/pdf",
          size_bytes: 2450000,
          status: tab,
          created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
          review_notes: "Clean chassis title stamp. Verified with Ministry of Transport registry.",
          car: { title: "2021 Toyota Land Cruiser Prado TX-L 2.8D" },
          seller: { display_name: "Kenji Auto Export Ltd", email: "kenji@yokohamaexport.jp" },
        },
        {
          id: "doc-demo-2",
          car_id: "demo-car-2",
          seller_id: "demo-seller-kenji",
          kind: "inspection_report",
          label: "150-Point Roadworthiness Certificate",
          file_path:
            "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
          mime_type: "application/pdf",
          size_bytes: 1890000,
          status: tab,
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          review_notes: "Diagnostic scan verified: Grade 4.5/5.0 with zero structural accidents.",
          car: { title: "2020 Mercedes-Benz C200 AMG Line" },
          seller: { display_name: "Kenji Auto Export Ltd", email: "kenji@yokohamaexport.jp" },
        },
      ]);
    }
    setLoading(false);

    setCounts({ pending: 2, verified: 14, rejected: 1 });
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function runGuidance(r: Row) {
    setGuidance((g) => ({ ...g, [r.id]: "loading" }));
    try {
      const [{ data: docs }, { data: car }] = await Promise.all([
        supabase.from("car_documents").select("kind").eq("car_id", r.car_id),
        supabase.from("cars").select("country").eq("id", r.car_id).maybeSingle(),
      ]);
      const kinds = ((docs ?? []) as { kind: string }[]).map((d) => d.kind);
      const result = await aiDocGuidance({
        data: {
          car_title: r.car?.title ?? "Listing",
          country: (car as { country?: string } | null)?.country ?? "KE",
          submitted_documents: kinds.map((k) => DOC_LABELS[k] ?? k),
          missing_documents: missingDocKinds(kinds).map((k) => DOC_LABELS[k] ?? k),
          seller_verified: false,
        },
      });
      setGuidance((g) => ({ ...g, [r.id]: result as Guidance }));
    } catch (e) {
      setGuidance((g) => {
        const { [r.id]: _drop, ...rest } = g;
        return rest;
      });
      toast.error(e instanceof Error ? e.message : "Guidance failed");
    }
  }

  async function decide(row: Row, status: "verified" | "rejected") {
    if (!user) return;
    if (status === "rejected" && !(notes[row.id] ?? "").trim()) {
      toast.error("Please add a note explaining the rejection.");
      return;
    }
    setWorking(row.id);
    const { error } = await supabase
      .from("car_documents")
      .update({
        status,
        reviewer_id: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: notes[row.id]?.trim() || null,
      })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      setWorking(null);
      return;
    }
    await supabase.from("notifications").insert({
      user_id: row.seller_id,
      type: status === "verified" ? "document_verified" : "document_rejected",
      title:
        status === "verified"
          ? `Document verified — ${row.car?.title ?? "your listing"}`
          : `Document rejected — ${row.car?.title ?? "your listing"}`,
      body:
        status === "verified"
          ? "Your document has been reviewed and verified."
          : notes[row.id]?.trim() || "Please review and re-upload.",
      link: "/seller/documents",
    });
    setRows((cur) => cur.filter((r) => r.id !== row.id));
    setWorking(null);
    toast.success(status === "verified" ? "Verified." : "Rejected.");
  }

  async function openDoc(r: Row) {
    const { data, error } = await supabase.storage
      .from("car-documents")
      .createSignedUrl(r.file_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Could not open file.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const visible = oldestFirstIfPending(
    rows.filter((r) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.car?.title ?? "").toLowerCase().includes(q) ||
        r.kind.toLowerCase().includes(q) ||
        (r.seller?.display_name ?? "").toLowerCase().includes(q)
      );
    }),
    tab,
  );

  return (
    <AdminPage>
      <QueueToolbar
        eyebrow="Trust operations"
        title="Document verification"
        description="Review seller-uploaded documents. Verified docs surface as trust badges on listings."
        counts={[
          { key: "pending", label: "Pending", count: counts.pending ?? 0 },
          { key: "verified", label: "Verified", count: counts.verified ?? 0 },
          { key: "rejected", label: "Rejected", count: counts.rejected ?? 0 },
        ]}
        active={tab}
        onSelect={(k) => setTab(k as "pending" | "verified" | "rejected")}
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search listing, seller or type…"
      />

      <AdminPanel>
        {loading ? (
          <QueueSkeleton rows={3} />
        ) : visible.length === 0 ? (
          <QueueEmpty
            icon={<CheckCircle2 />}
            title="Nothing in this queue"
            description="All caught up — sellers will receive a notification as soon as you act."
          />
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((r) => {
              const g = guidance[r.id];
              return (
                <li key={r.id} className="p-4 sm:p-6">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ac-cream text-ac-ink">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="brand-kicker truncate text-muted-foreground">
                          {r.car?.title ?? "Listing"}
                        </p>
                        <p className="mt-1 text-base font-semibold capitalize">
                          {r.kind.replace("_", " ")}
                          <span className="normal-case">{r.label ? ` — ${r.label}` : ""}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          by {r.seller?.display_name ?? r.seller?.email ?? "Seller"} ·{" "}
                          {new Date(r.created_at).toLocaleString()}
                          {tab === "pending" && ` · waiting ${ageOf(r.created_at)}`}
                        </p>
                        <div className="mt-2">
                          <StatusPill
                            status={r.status}
                            label={
                              r.status === "verified"
                                ? "Verified"
                                : r.status === "pending"
                                  ? "Waiting for review"
                                  : undefined
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className={TAP}
                        onClick={() => void runGuidance(r)}
                        disabled={g === "loading"}
                      >
                        {g === "loading" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        AI review guidance
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={TAP}
                        onClick={() => void openDoc(r)}
                      >
                        <FileText className="h-4 w-4" /> Open
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {g && g !== "loading" && (
                    <AiSuggestion
                      className="mt-4"
                      title={(g as Guidance).summary}
                      footnote={`AI guidance only — ${REQUIRED_DOC_KINDS.length} document types are required per listing. Check the file yourself before you decide.`}
                    >
                      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">
                        {(g as Guidance).focus.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                        {(g as Guidance).questions_for_seller.map((f) => (
                          <li key={f}>Ask seller: {f}</li>
                        ))}
                      </ul>
                    </AiSuggestion>
                  )}

                  {tab === "pending" ? (
                    <div className="mt-4 space-y-3 rounded-2xl bg-muted/40 p-3 sm:p-4">
                      <Textarea
                        aria-label="Review note"
                        placeholder="Optional note (required if rejecting)…"
                        value={notes[r.id] ?? ""}
                        onChange={(e) => setNotes((cur) => ({ ...cur, [r.id]: e.target.value }))}
                        rows={2}
                        className="bg-card"
                      />
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void decide(r, "rejected")}
                          disabled={working === r.id}
                          className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                        >
                          <XCircle className="h-4 w-4" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => void decide(r, "verified")}
                          disabled={working === r.id}
                          className={`${TAP} bg-emerald-600 text-white hover:bg-emerald-700`}
                        >
                          <CheckCircle2 className="h-4 w-4" /> Verify
                        </Button>
                      </div>
                    </div>
                  ) : (
                    r.review_notes && (
                      <p className="mt-4 rounded-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                        {r.review_notes}
                      </p>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>
    </AdminPage>
  );
}

function oldestFirstIfPending<T extends { created_at: string }>(rows: T[], tab: string) {
  return tab === "pending" ? oldestFirst(rows, (r) => r.created_at) : rows;
}
