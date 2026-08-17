import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, FileText, Building2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/verification")({
  head: () => ({ meta: [{ title: "Verification queue — Admin" }] }),
  component: AdminVerificationPage,
});

function AdminVerificationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Verification queue</h1>
        <p className="text-sm text-muted-foreground">Review seller and buyer identity submissions.</p>
      </header>
      <Tabs defaultValue="sellers">
        <TabsList>
          <TabsTrigger value="sellers">Sellers</TabsTrigger>
          <TabsTrigger value="buyers">Buyers</TabsTrigger>
        </TabsList>
        <TabsContent value="sellers" className="mt-4"><SellersQueue /></TabsContent>
        <TabsContent value="buyers" className="mt-4"><BuyersQueue /></TabsContent>
      </Tabs>
    </div>
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
        .in("status", filter === "all" ? ["pending", "under_review", "verified", "rejected", "more_info_needed"] : [filter])
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
      .update({ status: "verified", identity_verified: true, identity_verified_at: now, identity_verified_by: u.user?.id, admin_notes: notes || null })
      .eq("id", r.id);
    if (e1) return toast.error(e1.message);
    const { error: e2 } = await supabase
      .from("sellers")
      .update({ identity_verified: true, is_verified: true, verification_badge: true, is_approved: true })
      .eq("id", r.seller_id);
    if (e2) return toast.error(e2.message);
    toast.success("Seller verified");
    setSelected(null); setNotes("");
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
    setSelected(null); setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-seller-verifications"] });
  }

  const rows = q.data ?? [];

  return (
    <>
      <div className="mb-3 flex gap-2">
        {["pending", "under_review", "verified", "rejected", "all"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
            {f}
          </Button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">Nothing here.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelected(r); setNotes(r.admin_notes ?? ""); }}
              className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left shadow-sm hover:bg-muted/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                {r.is_dealer ? <Building2 className="h-5 w-5 text-muted-foreground" /> : <User className="h-5 w-5 text-muted-foreground" />}
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.is_dealer ? r.business_name || r.sellers?.business_name || "Dealer" : r.sellers?.profiles?.full_name || "Private seller"}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {r.sellers?.phone ?? r.sellers?.profiles?.phone ?? "—"} · {r.address_town ?? "—"}
                  </div>
                </div>
              </div>
              <StatusBadge status={r.status} />
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNotes(""); } }}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.is_dealer ? "Dealer" : "Private seller"} · <StatusBadge status={selected.status} />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <KV label="Full name" value={selected.sellers?.profiles?.full_name} />
                <KV label="Phone" value={selected.sellers?.phone ?? selected.sellers?.profiles?.phone} />
                <KV label="Email" value={selected.sellers?.email} />
                {selected.is_dealer && (
                  <>
                    <KV label="Business name" value={selected.business_name} />
                    <KV label="Registration / KRA PIN" value={selected.business_reg_number} />
                  </>
                )}
                <KV label="ID number" value={selected.national_id_number} />
                <KV label="Address" value={[selected.address_street, selected.address_town, selected.address_county].filter(Boolean).join(", ")} />
                <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <Label>Admin notes / rejection reason</Label>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional for approve, required for reject" />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="destructive" onClick={() => reject(selected)}>
                  <XCircle className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button onClick={() => approve(selected)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
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
        .select("id, full_name, phone, id_type, id_number, payment_contact, kyc_status, kyc_notes, kyc_submitted_at")
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
      .update({ kyc_status: "approved", kyc_reviewed_at: new Date().toISOString(), kyc_reviewed_by: u.user?.id, kyc_notes: notes || null })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Buyer approved");
    setSelected(null); setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-buyer-kyc"] });
  }

  async function reject(r: BuyerRow) {
    if (!notes.trim()) return toast.error("Add a rejection reason");
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: "rejected", kyc_reviewed_at: new Date().toISOString(), kyc_reviewed_by: u.user?.id, kyc_notes: notes })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Rejected");
    setSelected(null); setNotes("");
    qc.invalidateQueries({ queryKey: ["admin-buyer-kyc"] });
  }

  const rows = q.data ?? [];
  return (
    <>
      <div className="mb-3 flex gap-2">
        {["submitted", "approved", "rejected", "all"].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">Nothing here.</div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <button key={r.id} onClick={() => { setSelected(r); setNotes(r.kyc_notes ?? ""); }} className="flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left shadow-sm hover:bg-muted/40">
              <div className="min-w-0">
                <div className="font-medium truncate">{r.full_name ?? "Unnamed"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.phone ?? "—"} · {r.id_type ?? "id"} {r.id_number ?? ""}</div>
              </div>
              <StatusBadge status={r.kyc_status} />
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNotes(""); } }}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Buyer KYC · <StatusBadge status={selected.kyc_status} /></DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <KV label="Full name" value={selected.full_name} />
                <KV label="Phone" value={selected.phone} />
                <KV label="ID type" value={selected.id_type} />
                <KV label="ID number" value={selected.id_number} />
                <KV label="Payment contact" value={selected.payment_contact} />
                <div>
                  <Label>Admin notes / rejection reason</Label>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="destructive" onClick={() => reject(selected)}><XCircle className="mr-1 h-4 w-4" /> Reject</Button>
                <Button onClick={() => approve(selected)}><CheckCircle2 className="mr-1 h-4 w-4" /> Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ---------------- Shared ---------------- */

function KV({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: "bg-success text-success-foreground",
    approved: "bg-success text-success-foreground",
    pending: "bg-muted",
    submitted: "bg-muted",
    under_review: "bg-muted",
    rejected: "bg-destructive text-destructive-foreground",
    more_info_needed: "bg-warning text-warning-foreground",
  };
  return <Badge className={map[status] ?? ""}>{status}</Badge>;
}

function DocLink({ label, path }: { label: string; path: string | null }) {
  const [busy, setBusy] = useState(false);
  async function open() {
    if (!path) return;
    setBusy(true);
    const { data, error } = await supabase.storage.from("seller-identity-docs").createSignedUrl(path, 300);
    setBusy(false);
    if (error || !data?.signedUrl) return toast.error(error?.message ?? "Cannot open");
    window.open(data.signedUrl, "_blank", "noopener");
  }
  return (
    <button
      onClick={open}
      disabled={!path || busy}
      className="flex items-center gap-2 rounded-md border p-2 text-left text-xs hover:bg-muted/40 disabled:opacity-40"
    >
      <FileText className="h-4 w-4" />
      <div className="min-w-0">
        <div className="font-medium">{label}</div>
        <div className="truncate text-muted-foreground">{path ? "View" : "Not provided"}</div>
      </div>
    </button>
  );
}
