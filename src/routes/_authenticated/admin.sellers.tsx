import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, ShieldCheck, Ban, Building2, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/admin/AdminUI";

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
  const rows = tab === "approved" ? approved : tab === "suspended" ? suspended : pending;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Moderation"
        title="Sellers"
        description="Review, verify, and manage seller accounts."
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Seller status"
            active={tab}
            onSelect={setTab}
            options={[
              { key: "pending", label: "Pending", count: pending.length },
              { key: "approved", label: "Approved", count: approved.length },
              { key: "suspended", label: "Suspended", count: suspended.length },
            ]}
          />
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search by business, name, or country…"
      />

      {sellersQuery.isError && (
        <QueueError>
          Sellers could not load. This is not an empty result — refresh to retry.
        </QueueError>
      )}

      <AdminPanel>
        {sellersQuery.isLoading ? (
          <QueueSkeleton rows={5} />
        ) : (
          <SellersList
            rows={rows}
            onApprove={approve}
            onVerify={verify}
            onSuspend={suspend}
            onReject={(s) => setRejecting(s)}
          />
        )}
      </AdminPanel>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject seller</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this seller being rejected?"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className={TAP} onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className={TAP} onClick={submitReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
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
    return (
      <QueueEmpty
        icon={<Users />}
        title="No sellers in this group"
        description="New seller applications land in Pending. Try another group or clear the search."
      />
    );
  }
  return (
    <ul className="divide-y divide-border">
      {rows.map((s) => {
        const c = countryByCode(s.country);
        return (
          <li
            key={s.id}
            className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ac-cream text-ac-ink">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-semibold">
                    {s.business_name || s.profiles?.full_name || "Unnamed seller"}
                  </h3>
                  {s.is_suspended ? (
                    <StatusPill status="suspended" />
                  ) : s.is_approved ? (
                    <StatusPill status="approved" label="Approved" />
                  ) : (
                    <StatusPill status="pending" />
                  )}
                  {s.is_verified && <StatusPill status="verified" label="Verified" />}
                  {s.offers_international_shipping && <Badge variant="secondary">Exporter</Badge>}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {s.profiles?.full_name} {s.profiles?.phone && `· ${s.profiles.phone}`} ·{" "}
                  {c ? `${c.flag} ${c.name}` : s.country}
                  {s.city ? `, ${s.city}` : ""}
                </div>
                {s.rejection_reason && (
                  <div className="mt-2 rounded-xl bg-destructive/10 px-2 py-1 text-xs text-destructive">
                    Rejected: {s.rejection_reason}
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {!s.is_approved && (
                <Button size="sm" className={TAP} onClick={() => onApprove(s)}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
              {s.is_approved && !s.is_verified && (
                <Button size="sm" variant="outline" className={TAP} onClick={() => onVerify(s)}>
                  <ShieldCheck className="h-4 w-4" /> Verify
                </Button>
              )}
              {!s.is_suspended ? (
                <Button size="sm" variant="outline" className={TAP} onClick={() => onSuspend(s)}>
                  <Ban className="h-4 w-4" /> Suspend
                </Button>
              ) : (
                <Button size="sm" className={TAP} onClick={() => onApprove(s)}>
                  <CheckCircle2 className="h-4 w-4" /> Reinstate
                </Button>
              )}
              {!s.is_approved && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                  onClick={() => onReject(s)}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
