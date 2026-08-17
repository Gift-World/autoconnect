import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, Ban, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/admin/sellers")({
  head: () => ({ meta: [{ title: "Sellers — Admin — AutoConnect" }] }),
  component: AdminSellersPage,
});

type SellerRow = {
  id: string;
  profile_id: string;
  business_name: string | null;
  country: string;
  city: string | null;
  is_approved: boolean;
  is_verified: boolean;
  is_suspended: boolean;
  offers_international_shipping: boolean;
  rejection_reason: string | null;
  profiles: { full_name: string | null; phone: string | null } | null;
};

function AdminSellersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<SellerRow | null>(null);
  const [reason, setReason] = useState("");

  const sellersQuery = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("*, profiles(full_name, phone)")
        .order("id", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SellerRow[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-sellers"] });

  async function approve(s: SellerRow) {
    const { error } = await supabase
      .from("sellers")
      .update({ is_approved: true, is_suspended: false, rejection_reason: null })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Seller approved");
    refresh();
  }
  async function verify(s: SellerRow) {
    const { error } = await supabase
      .from("sellers")
      .update({ is_verified: true, verification_badge: true })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Seller verified");
    refresh();
  }
  async function suspend(s: SellerRow) {
    const { error } = await supabase
      .from("sellers")
      .update({ is_suspended: true, is_approved: false })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("Seller suspended");
    refresh();
  }
  async function submitReject() {
    if (!rejecting) return;
    const { error } = await supabase
      .from("sellers")
      .update({ is_approved: false, rejection_reason: reason || "Not specified" })
      .eq("id", rejecting.id);
    if (error) return toast.error(error.message);
    toast.success("Seller rejected");
    setRejecting(null);
    setReason("");
    refresh();
  }

  const all = sellersQuery.data ?? [];
  const term = q.trim().toLowerCase();
  const filter = (rows: SellerRow[]) =>
    term
      ? rows.filter(
          (r) =>
            r.business_name?.toLowerCase().includes(term) ||
            r.profiles?.full_name?.toLowerCase().includes(term) ||
            r.country.toLowerCase().includes(term),
        )
      : rows;

  const pending = filter(all.filter((s) => !s.is_approved && !s.is_suspended));
  const approved = filter(all.filter((s) => s.is_approved && !s.is_suspended));
  const suspended = filter(all.filter((s) => s.is_suspended));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sellers</h1>
        <p className="text-sm text-muted-foreground">Review, verify, and manage seller accounts.</p>
      </header>

      <Input
        placeholder="Search by business, name, or country…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended ({suspended.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <SellersList rows={pending} onApprove={approve} onVerify={verify} onSuspend={suspend} onReject={(s) => setRejecting(s)} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <SellersList rows={approved} onApprove={approve} onVerify={verify} onSuspend={suspend} onReject={(s) => setRejecting(s)} />
        </TabsContent>
        <TabsContent value="suspended" className="mt-4">
          <SellersList rows={suspended} onApprove={approve} onVerify={verify} onSuspend={suspend} onReject={(s) => setRejecting(s)} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject seller</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this seller being rejected?" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SellersList({
  rows,
  onApprove,
  onVerify,
  onSuspend,
  onReject,
}: {
  rows: SellerRow[];
  onApprove: (s: SellerRow) => void;
  onVerify: (s: SellerRow) => void;
  onSuspend: (s: SellerRow) => void;
  onReject: (s: SellerRow) => void;
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No sellers in this group.</div>;
  }
  return (
    <div className="space-y-3">
      {rows.map((s) => {
        const c = countryByCode(s.country);
        return (
          <div key={s.id} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">{s.business_name || s.profiles?.full_name || "Unnamed seller"}</h3>
                  {s.is_verified && <Badge className="bg-success text-success-foreground">Verified</Badge>}
                  {s.offers_international_shipping && <Badge variant="secondary">Exporter</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.profiles?.full_name} {s.profiles?.phone && `· ${s.profiles.phone}`} ·{" "}
                  {c ? `${c.flag} ${c.name}` : s.country}
                  {s.city ? `, ${s.city}` : ""}
                </div>
                {s.rejection_reason && (
                  <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    Rejected: {s.rejection_reason}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {!s.is_approved && (
                  <Button size="sm" onClick={() => onApprove(s)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                )}
                {s.is_approved && !s.is_verified && (
                  <Button size="sm" variant="outline" onClick={() => onVerify(s)}>
                    <ShieldCheck className="mr-1 h-4 w-4" /> Verify
                  </Button>
                )}
                {!s.is_suspended ? (
                  <Button size="sm" variant="outline" onClick={() => onSuspend(s)}>
                    <Ban className="mr-1 h-4 w-4" /> Suspend
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => onApprove(s)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Reinstate
                  </Button>
                )}
                {!s.is_approved && (
                  <Button size="sm" variant="destructive" onClick={() => onReject(s)}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
