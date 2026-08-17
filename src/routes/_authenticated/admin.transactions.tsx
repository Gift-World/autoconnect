import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { releaseFunds, refundPayment, confirmManualPayment } from "@/lib/payments.functions";
import { Input } from "@/components/ui/input";
import { Wallet, Banknote, ShieldAlert, Coins } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/transactions")({
  component: AdminTransactions,
});

type Row = {
  id: string;
  status: string;
  display_currency: string;
  display_car_price: number;
  display_service_fee: number;
  display_total: number;
  initiated_at: string;
  paid_at: string | null;
  released_at: string | null;
  buyer_id: string;
  car_id: string;
  payment_method: string | null;
  manual_channel: string | null;
  manual_reference: string | null;
  manual_payer_name: string | null;
  manual_phone: string | null;
  manual_note: string | null;
  handover_ready_at: string | null;
  cars: { title: string; car_images: { image_url: string; is_primary: boolean }[] } | null;
  sellers: { business_name: string | null; country: string; stripe_payouts_enabled: boolean } | null;
  buyer: { full_name: string | null; country: string | null } | null;
};

function fmt(a: number, c: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(a); }
  catch { return `${c} ${a.toLocaleString()}`; }
}

function AdminTransactions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refundOpen, setRefundOpen] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState<Row | null>(null);
  const [confirmRef, setConfirmRef] = useState("");
  const [confirmNote, setConfirmNote] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, status, display_currency, display_car_price, display_service_fee, display_total, initiated_at, paid_at, released_at, buyer_id, car_id, payment_method, manual_channel, manual_reference, manual_payer_name, manual_phone, manual_note, handover_ready_at, cars!inner(title, car_images(image_url, is_primary)), sellers!inner(business_name, country, stripe_payouts_enabled)")
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    // fetch buyer profiles
    const buyerIds = [...new Set((data ?? []).map((r: any) => r.buyer_id))];
    const { data: bp } = await supabase.from("profiles").select("id, full_name, country").in("id", buyerIds);
    const byId = new Map((bp ?? []).map((p) => [p.id, p]));
    const merged = (data ?? []).map((r: any) => ({ ...r, buyer: byId.get(r.buyer_id) ?? null }));
    setRows(merged as unknown as Row[]);
  }

  useEffect(() => { load(); }, []);

  async function onRelease(id: string) {
    if (!confirm("Release funds to the seller after verification?")) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await releaseFunds({ data: { accessToken: sess.session.access_token, transactionId: id } });
      toast.success("Funds released");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onConfirmManual() {
    if (!confirmOpen) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await confirmManualPayment({
        data: {
          accessToken: sess.session.access_token,
          transactionId: confirmOpen.id,
          reference: confirmRef || undefined,
          note: confirmNote || undefined,
        },
      });
      toast.success("Payment confirmed — car marked Under Transaction");
      setConfirmOpen(null); setConfirmRef(""); setConfirmNote("");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onRefund() {
    if (!refundOpen) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await refundPayment({ data: { accessToken: sess.session.access_token, transactionId: refundOpen, reason: refundReason } });
      toast.success("Refund issued");
      setRefundOpen(null); setRefundReason("");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  // Summaries — sum in USD-equivalent display values (mixed currency display caveat)
  const allCompleted = (rows ?? []).filter((r) => ["funds_released", "completed"].includes(r.status));
  const inEscrow = (rows ?? []).filter((r) => ["payment_received", "admin_reviewing"].includes(r.status));
  const disputed = (rows ?? []).filter((r) => r.status === "disputed");
  const awaitingManual = (rows ?? []).filter((r) => r.status === "awaiting_manual_payment");
  const totalFees = allCompleted.reduce((s, r) => s + Number(r.display_service_fee), 0);
  const totalReleased = allCompleted.reduce((s, r) => s + Number(r.display_car_price), 0);
  const totalEscrow = inEscrow.reduce((s, r) => s + Number(r.display_total), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Confirm manual payments, track handover, release funds after verification, and handle disputes.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Coins />} label="Fees collected" value={fmt(totalFees, "USD")} />
        <Stat icon={<Wallet />} label="Held by AutoConnect" value={fmt(totalEscrow, "USD")} />
        <Stat icon={<Banknote />} label="Released" value={fmt(totalReleased, "USD")} />
        <Stat icon={<ShieldAlert />} label={`Disputes · ${awaitingManual.length} manual`} value={String(disputed.length)} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Car</th>
              <th className="px-3 py-3 text-left">Buyer</th>
              <th className="px-3 py-3 text-left">Seller</th>
              <th className="px-3 py-3 text-left">Method</th>
              <th className="px-3 py-3 text-left">Total</th>
              <th className="px-3 py-3 text-left">Fee</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t align-top">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-14 overflow-hidden rounded bg-muted">
                      {r.cars?.car_images[0]?.image_url && <img src={r.cars.car_images[0].image_url} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.cars?.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.initiated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">{r.buyer?.full_name ?? "—"}<div className="text-xs text-muted-foreground">{r.buyer?.country ?? ""}</div></td>
                <td className="px-3 py-3">{r.sellers?.business_name ?? "—"}<div className="text-xs text-muted-foreground">{r.sellers?.country}</div></td>
                <td className="px-3 py-3 text-xs">
                  {r.payment_method === "manual" ? (
                    <>
                      <span className="font-medium">{r.manual_channel === "mpesa" ? "M-Pesa" : "Bank transfer"}</span>
                      <div className="text-muted-foreground">{r.manual_payer_name ?? "—"}</div>
                      {r.manual_reference && <div className="font-mono text-[10px] text-muted-foreground">{r.manual_reference}</div>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">Card (Stripe)</span>
                  )}
                </td>
                <td className="px-3 py-3 font-semibold">{fmt(Number(r.display_total), r.display_currency)}</td>
                <td className="px-3 py-3 text-muted-foreground">{fmt(Number(r.display_service_fee), r.display_currency)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={r.status} />
                  {r.status === "payment_received" && (
                    <div className="mt-1 text-[10px] text-muted-foreground">
                      {r.handover_ready_at ? "Handover ready" : "Seller preparing handover"}
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    {r.status === "awaiting_manual_payment" && (
                      <Button size="sm" onClick={() => setConfirmOpen(r)}>Confirm payment</Button>
                    )}
                    {["payment_received", "admin_reviewing"].includes(r.status) && (
                      <Button size="sm" onClick={() => onRelease(r.id)}>Release</Button>
                    )}
                    {["awaiting_manual_payment", "payment_received", "admin_reviewing", "disputed"].includes(r.status) && (
                      <Button size="sm" variant="outline" onClick={() => setRefundOpen(r.id)}>Refund</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!refundOpen} onOpenChange={(o) => { if (!o) setRefundOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Returns the payment to the buyer and re-opens the listing. Card payments are reversed via Stripe;
              M-Pesa and bank payments must be returned manually.
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={4} value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund (sent to both parties)" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRefundOpen(null)}>Cancel</Button>
            <Button disabled={refundReason.trim().length < 3} onClick={onRefund} className="bg-destructive hover:bg-destructive/90">Issue refund</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmOpen} onOpenChange={(o) => { if (!o) setConfirmOpen(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm manual payment</DialogTitle>
            <DialogDescription>
              Only confirm after the funds are visible in the AutoConnect account. The car becomes Under
              Transaction and the seller is told to prepare handover.
            </DialogDescription>
          </DialogHeader>
          {confirmOpen && (
            <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-xs">
              <p><span className="text-muted-foreground">Channel:</span> {confirmOpen.manual_channel === "mpesa" ? "M-Pesa" : "Bank transfer"}</p>
              <p><span className="text-muted-foreground">Payer:</span> {confirmOpen.manual_payer_name ?? "—"} · {confirmOpen.manual_phone ?? "—"}</p>
              <p><span className="text-muted-foreground">Buyer reference:</span> {confirmOpen.manual_reference ?? "—"}</p>
              <p><span className="text-muted-foreground">Amount:</span> {fmt(Number(confirmOpen.display_total), confirmOpen.display_currency)}</p>
              {confirmOpen.manual_note && <p><span className="text-muted-foreground">Note:</span> {confirmOpen.manual_note}</p>}
            </div>
          )}
          <Input value={confirmRef} onChange={(e) => setConfirmRef(e.target.value)} placeholder="Confirmed reference / receipt number" />
          <Textarea rows={3} value={confirmNote} onChange={(e) => setConfirmNote(e.target.value)} placeholder="Internal note (optional)" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(null)}>Cancel</Button>
            <Button onClick={onConfirmManual}>Confirm payment received</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    awaiting_manual_payment: "bg-warning/15 text-warning border-warning/30",
    payment_received: "bg-warning/15 text-warning border-warning/30",
    admin_reviewing: "bg-primary/15 text-primary border-primary/30",
    funds_released: "bg-success/15 text-success border-success/30",
    completed: "bg-success/15 text-success border-success/30",
    disputed: "bg-destructive/15 text-destructive border-destructive/30",
    refunded: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={map[status] ?? "bg-muted"}>{status.replaceAll("_", " ")}</Badge>;
}
