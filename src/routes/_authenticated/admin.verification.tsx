import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  User,
  ChevronRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  FilterChips,
  KV,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP,
} from "@/components/admin/AdminUI";
import { DetailSheet } from "@/components/admin/DetailSheet";

export const Route = createFileRoute("/_authenticated/admin/verification")({
  head: () => ({ meta: [{ title: "Verification queue — Admin" }] }),
  component: AdminVerificationPage,
});

function AdminVerificationPage() {
  return (
    <AdminPage>
      <PageHeader
        eyebrow="TRUST OPERATIONS"
        title="Identity review queue"
        description="Review buyer and seller submissions carefully. Only approved evidence changes public trust status."
      />
      <Tabs defaultValue="sellers" className="min-w-0 rounded-3xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="brand-kicker text-muted-foreground">Review workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Open a record to examine the submitted details and leave an accountable decision.
            </p>
          </div>
          <TabsList className="h-11 self-start rounded-full p-1">
            <TabsTrigger value="sellers" className="h-9 rounded-full px-4">
              Sellers
            </TabsTrigger>
            <TabsTrigger value="buyers" className="h-9 rounded-full px-4">
              Buyers
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="sellers" className="mt-0">
          <SellersQueue />
        </TabsContent>
        <TabsContent value="buyers" className="mt-0">
          <BuyersQueue />
        </TabsContent>
      </Tabs>
    </AdminPage>
  );
}

/* ---------------- Sellers ---------------- */

type SVRow = {
  id: string;
  seller_id: string;
  is_dealer: boolean;
  national_id_number: string | null;
  national_id_front_url: string | null;
  national_id_back_url: string | null;
  selfie_with_id_url: string | null;
  address_county: string | null;
  address_town: string | null;
  address_street: string | null;
  business_name: string | null;
  business_reg_number: string | null;
  incorporation_cert_url: string | null;
  kra_pin_url: string | null;
  business_permit_url: string | null;
  premises_photo_url: string | null;
  status: string;
  admin_notes: string | null;
  sellers: {
    id: string;
    business_name: string | null;
    phone: string | null;
    email: string | null;
    profiles: { full_name: string | null; phone: string | null } | null;
  } | null;
};

const SELLER_FILTERS = [
  { key: "pending", label: "Pending" },
  { key: "under_review", label: "Under review" },
  { key: "verified", label: "Verified" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function SellersQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("pending");
  const [selected, setSelected] = useState<SVRow | null>(null);
  const [notes, setNotes] = useState("");

  const q = useQuery({
    queryKey: ["admin-seller-verifications", filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_verifications")
        .select("*, sellers(id, business_name, phone, email, profiles(full_name, phone))")
        .in(
          "status",
          filter === "all"
            ? ["pending", "under_review", "verified", "rejected", "more_info_needed"]
            : [filter],
        )
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SVRow[];
    },
  });

  async function approve(r: SVRow) {
    const now = new Date().toISOString();
    const { data: u } = await supabase.auth.getUser();
    const { error: e1 } = await supabase
      .from("seller_verifications")
      .update({
        status: "verified",
        identity_verified: true,
        identity_verified_at: now,
        identity_verified_by: u.user?.id,
        admin_notes: notes || null,
      })
      .eq("id", r.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase
      .from("sellers")
      .update({
        identity_verified: true,
        is_verified: true,
        verification_badge: true,
        is_approved: true,
      })
      .eq("id", r.seller_id);
    if (e2) return toast.error(e2.message);
    toast.success("Seller verified");
    setSelected(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-seller-verifications"] });
  }

  async function reject(r: SVRow) {
    if (!notes.trim()) return toast.error("Add a rejection reason");
    const { error } = await supabase
      .from("seller_verifications")
      .update({ status: "rejected", identity_rejection_reason: notes, admin_notes: notes })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setSelected(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-seller-verifications"] });
  }

  const rows = q.data ?? [];

  return (
    <>
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <FilterChips
          label="Seller verification status"
          options={SELLER_FILTERS}
          active={filter}
          onSelect={setFilter}
        />
      </div>
      {q.isError ? (
        <div className="p-4 sm:p-6">
          <QueueError>The seller queue could not load. This is not an empty result.</QueueError>
        </div>
      ) : q.isLoading ? (
        <QueueSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <QueueEmpty
          icon={<ShieldCheck />}
          title="Nothing here"
          description="No seller identity submissions in this status."
        />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(r);
                  setNotes(r.admin_notes ?? "");
                }}
                className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-cream text-ac-ink">
                    {r.is_dealer ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">
                      {r.is_dealer
                        ? r.business_name || r.sellers?.business_name || "Dealer"
                        : r.sellers?.profiles?.full_name || "Private seller"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.sellers?.phone ?? r.sellers?.profiles?.phone ?? "—"} ·{" "}
                      {r.address_town ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <VStatus status={r.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <DetailSheet
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setNotes("");
          }
        }}
        kicker={selected?.is_dealer ? "Dealer verification" : "Private seller verification"}
        title={
          selected
            ? selected.is_dealer
              ? selected.business_name || selected.sellers?.business_name || "Dealer"
              : selected.sellers?.profiles?.full_name || "Private seller"
            : ""
        }
        footer={
          selected && (
            <>
              <Button
                variant="outline"
                className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                onClick={() => reject(selected)}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button className={TAP} onClick={() => approve(selected)}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {selected.is_dealer ? "Dealer" : "Private seller"} ·{" "}
              <VStatus status={selected.status} />
            </div>
            <dl>
              <KV label="Full name" value={selected.sellers?.profiles?.full_name} />
              <KV
                label="Phone"
                value={selected.sellers?.phone ?? selected.sellers?.profiles?.phone}
              />
              <KV label="Email" value={selected.sellers?.email} />
              {selected.is_dealer && (
                <>
                  <KV label="Business name" value={selected.business_name} />
                  <KV label="Registration / KRA PIN" value={selected.business_reg_number} />
                </>
              )}
              <KV label="ID number" value={selected.national_id_number} />
              <KV
                label="Address"
                value={[selected.address_street, selected.address_town, selected.address_county]
                  .filter(Boolean)
                  .join(", ")}
              />
            </dl>
            <section>
              <p className="brand-kicker mb-2 text-muted-foreground">Documents</p>
              <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                <DocLink label="ID front" path={selected.national_id_front_url} />
                <DocLink label="ID back" path={selected.national_id_back_url} />
                <DocLink label="Selfie w/ ID" path={selected.selfie_with_id_url} />
                {selected.is_dealer && (
                  <>
                    <DocLink label="Incorporation" path={selected.incorporation_cert_url} />
                    <DocLink label="KRA PIN" path={selected.kra_pin_url} />
                    <DocLink label="Business permit" path={selected.business_permit_url} />
                    <DocLink label="Premises" path={selected.premises_photo_url} />
                  </>
                )}
              </div>
            </section>
            <div className="space-y-2">
              <Label htmlFor="sv-notes">Admin notes / rejection reason</Label>
              <Textarea
                id="sv-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional for approve, required for reject"
              />
            </div>
          </div>
        )}
      </DetailSheet>
    </>
  );
}

/* ---------------- Buyers ---------------- */

type BuyerRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
  payment_contact: string | null;
  kyc_status: string;
  kyc_notes: string | null;
  kyc_submitted_at: string | null;
};

const BUYER_FILTERS = [
  { key: "submitted", label: "Submitted" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

function BuyersQueue() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("submitted");
  const [selected, setSelected] = useState<BuyerRow | null>(null);
  const [notes, setNotes] = useState("");

  const q = useQuery({
    queryKey: ["admin-buyer-kyc", filter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          "id, full_name, phone, id_type, id_number, payment_contact, kyc_status, kyc_notes, kyc_submitted_at",
        )
        .order("kyc_submitted_at", { ascending: false });
      if (filter !== "all") query = query.eq("kyc_status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as BuyerRow[];
    },
  });

  async function approve(r: BuyerRow) {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_status: "approved",
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: u.user?.id,
        kyc_notes: notes || null,
      })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Buyer approved");
    setSelected(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-buyer-kyc"] });
  }

  async function reject(r: BuyerRow) {
    if (!notes.trim()) return toast.error("Add a rejection reason");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({
        kyc_status: "rejected",
        kyc_reviewed_at: new Date().toISOString(),
        kyc_reviewed_by: u.user?.id,
        kyc_notes: notes,
      })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setSelected(null);
    setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-buyer-kyc"] });
  }

  const rows = q.data ?? [];
  return (
    <>
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <FilterChips
          label="Buyer verification status"
          options={BUYER_FILTERS}
          active={filter}
          onSelect={setFilter}
        />
      </div>
      {q.isError ? (
        <div className="p-4 sm:p-6">
          <QueueError>The buyer queue could not load. This is not an empty result.</QueueError>
        </div>
      ) : q.isLoading ? (
        <QueueSkeleton rows={4} />
      ) : rows.length === 0 ? (
        <QueueEmpty
          icon={<UserCheck />}
          title="Nothing here"
          description="No buyer identity submissions in this status."
        />
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(r);
                  setNotes(r.kyc_notes ?? "");
                }}
                className="flex min-h-[64px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-muted/40 sm:px-6"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-powder text-ac-ink">
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{r.full_name ?? "Unnamed"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.phone ?? "—"} · {r.id_type ?? "id"} {r.id_number ?? ""}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <VStatus status={r.kyc_status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <DetailSheet
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setNotes("");
          }
        }}
        kicker="Buyer KYC"
        title={selected?.full_name ?? "Unnamed"}
        footer={
          selected && (
            <>
              <Button
                variant="outline"
                className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                onClick={() => reject(selected)}
              >
                <XCircle className="h-4 w-4" /> Reject
              </Button>
              <Button className={TAP} onClick={() => approve(selected)}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Buyer KYC · <VStatus status={selected.kyc_status} />
            </div>
            <dl>
              <KV label="Full name" value={selected.full_name} />
              <KV label="Phone" value={selected.phone} />
              <KV label="ID type" value={selected.id_type} />
              <KV label="ID number" value={selected.id_number} />
              <KV label="Payment contact" value={selected.payment_contact} />
              <KV
                label="Submitted"
                value={
                  selected.kyc_submitted_at
                    ? new Date(selected.kyc_submitted_at).toLocaleString()
                    : null
                }
              />
            </dl>
            <div className="space-y-2">
              <Label htmlFor="kyc-notes">Admin notes / rejection reason</Label>
              <Textarea
                id="kyc-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}
      </DetailSheet>
    </>
  );
}

/* ---------------- Shared ---------------- */

/** Verification status via the shared StatusPill (submitted reads as waiting). */
function VStatus({ status }: { status: string }) {
  if (status === "submitted") return <StatusPill status="pending" label="Submitted" />;
  if (status === "approved") return <StatusPill status="approved" label="Approved" />;
  if (status === "verified") return <StatusPill status="verified" label="Verified" />;
  return <StatusPill status={status} />;
}

function DocLink({ label, path }: { label: string; path: string | null }) {
  const [busy, setBusy] = useState(false);
  async function open() {
    if (!path) return;
    setBusy(true);
    const { data, error } = await supabase.storage
      .from("seller-identity-docs")
      .createSignedUrl(path, 300);
    setBusy(false);
    if (error || !data?.signedUrl) return toast.error(error?.message ?? "Cannot open");
    window.open(data.signedUrl, "_blank", "noopener");
  }
  return (
    <button
      type="button"
      onClick={open}
      disabled={!path || busy}
      className="flex min-h-11 items-center gap-2 rounded-2xl border border-border p-3 text-left text-xs transition hover:bg-muted/40 disabled:opacity-40"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <div className="font-semibold">{label}</div>
        <div className="truncate text-muted-foreground">{path ? "View" : "Not provided"}</div>
      </div>
    </button>
  );
}
