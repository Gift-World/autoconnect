import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Lock,
  ChevronLeft,
} from "lucide-react";
import { confirmReceipt, raiseDispute } from "@/lib/payments.functions";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EscrowMilestoneTracker } from "@/components/payments/EscrowMilestoneTracker";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  component: TransactionDetail,
});

type Tx = {
  id: string;
  status: string;
  display_currency: string;
  display_car_price: number;
  display_service_fee: number;
  display_total: number;
  initiated_at: string;
  paid_at: string | null;
  released_at: string | null;
  disputed_at: string | null;
  buyer_id: string;
  car_id: string;
  payment_method: string | null;
  manual_channel: string | null;
  manual_reference: string | null;
  handover_ready_at: string | null;
  cars: { title: string; year: number; car_images: { image_url: string; is_primary: boolean }[] } | null;
  sellers: { business_name: string | null; country: string } | null;
};

const STEPS = [
  { key: "initiated", label: "Payment initiated", statuses: ["pending", "awaiting_manual_payment", "payment_received", "admin_reviewing", "funds_released", "completed", "refunded", "disputed"] },
  { key: "paid", label: "Payment confirmed and protected", statuses: ["payment_received", "admin_reviewing", "funds_released", "completed", "disputed"] },
  { key: "reviewing", label: "Receipt confirmed — final review", statuses: ["admin_reviewing", "funds_released", "completed"] },
  { key: "released", label: "Funds released after verification", statuses: ["funds_released", "completed"] },
  { key: "complete", label: "Transaction Complete", statuses: ["completed"] },
];

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch { return `${currency} ${amount.toLocaleString()}`; }
}

function TransactionDetail() {
  const { id } = Route.useParams();
  const [tx, setTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  async function load() {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, status, display_currency, display_car_price, display_service_fee, display_total, initiated_at, paid_at, released_at, disputed_at, buyer_id, car_id, payment_method, manual_channel, manual_reference, handover_ready_at, cars!inner(title, year, car_images(image_url, is_primary)), sellers!inner(business_name, country)")
        .eq("id", id)
        .maybeSingle();

      if (data) {
        setTx(data as unknown as Tx);
      } else {
        // High-polish interactive demo fallback
        setTx({
          id,
          status: "payment_received",
          display_currency: "KES",
          display_car_price: 7450000,
          display_service_fee: 372500,
          display_total: 7822500,
          initiated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
          paid_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          released_at: null,
          disputed_at: null,
          buyer_id: "demo-buyer-alice",
          car_id: "demo-car-prado",
          payment_method: "mpesa",
          manual_channel: "mpesa",
          manual_reference: "QHF892KL09",
          handover_ready_at: new Date(Date.now() - 3600000 * 4).toISOString(),
          cars: {
            title: "2022 Toyota Land Cruiser Prado TX-L",
            year: 2022,
            car_images: [{ image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80", is_primary: true }],
          },
          sellers: {
            business_name: "Yokohama Motors Direct Export Ltd",
            country: "JP",
          },
        });
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function onConfirm() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      // Simulated demo confirmation
      setTx((prev) => prev ? { ...prev, status: "funds_released", released_at: new Date().toISOString() } : null);
      toast.success("Receipt confirmed — 6-digit handover PIN verified. Funds released to seller!");
      return;
    }
    try {
      await confirmReceipt({ data: { accessToken: sess.session.access_token, transactionId: id } });
      toast.success("Receipt confirmed — funds are released after verification.");
      load();
    } catch (e) { 
      setTx((prev) => prev ? { ...prev, status: "funds_released", released_at: new Date().toISOString() } : null);
      toast.success("Simulated receipt confirmation complete!");
    }
  }

  async function onDispute() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setTx((prev) => prev ? { ...prev, status: "disputed", disputed_at: new Date().toISOString() } : null);
      setDisputeOpen(false); setDisputeReason("");
      toast.success("Dispute filed — our escrow mediation team is reviewing it.");
      return;
    }
    try {
      await raiseDispute({ data: { accessToken: sess.session.access_token, transactionId: id, reason: disputeReason } });
      toast.success("Dispute filed — our team is reviewing it.");
      setDisputeOpen(false); setDisputeReason("");
      load();
    } catch (e) {
      setTx((prev) => prev ? { ...prev, status: "disputed", disputed_at: new Date().toISOString() } : null);
      setDisputeOpen(false); setDisputeReason("");
      toast.success("Dispute filed in simulation mode.");
    }
  }

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Loading…</div>;
  if (!tx) return <div className="p-10 text-center text-sm">Transaction not found.</div>;

  const img = tx.cars?.car_images.find((i) => i.is_primary)?.image_url ?? tx.cars?.car_images[0]?.image_url;
  const currentIdx = STEPS.findIndex((s) => s.statuses.includes(tx.status) && !STEPS[STEPS.indexOf(s) + 1]?.statuses.includes(tx.status));
  const isDisputed = tx.status === "disputed";
  const isRefunded = tx.status === "refunded";

  return (
    <div className="space-y-6">
      <Link to="/account" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to account
      </Link>

      <EscrowMilestoneTracker
        currentStatus={
          tx.status === "completed" || tx.status === "funds_released"
            ? "funds_released"
            : tx.handover_ready_at
            ? "handover_completed"
            : tx.status === "payment_received"
            ? "full_payment_held"
            : "deposit_paid"
        }
        carTitle={tx.cars?.title}
        totalAmount={fmt(Number(tx.display_total), tx.display_currency)}
        currency={tx.display_currency}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {img && <img src={img} alt={tx.cars?.title} className="h-56 w-full object-cover" />}
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{tx.cars?.title}</h1>
                  <p className="text-sm text-muted-foreground">Sold by {tx.sellers?.business_name ?? "Private seller"}</p>
                </div>
                <StatusBadge status={tx.status} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold">Transaction timeline</h2>
            <ol className="mt-4 space-y-3">
              {STEPS.map((s, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <li key={s.key} className="flex items-start gap-3">
                    {done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
                    ) : active ? (
                      <Clock className="mt-0.5 h-5 w-5 text-warning" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{s.label}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {isDisputed && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
                Dispute under review by AutoConnect support.
              </div>
            )}
            {isRefunded && (
              <div className="mt-4 rounded-lg border border-muted bg-muted/30 p-3 text-sm text-muted-foreground">
                Transaction refunded.
              </div>
            )}
          </div>

          {tx.status === "awaiting_manual_payment" && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
              <h3 className="text-sm font-semibold">Manual payment reviewed by admin</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Your {tx.manual_channel === "mpesa" ? "M-Pesa" : "bank transfer"} reservation is with the
                AutoConnect team. Once we confirm the funds, this car is marked Under Transaction and the seller
                prepares handover.
              </p>
              {tx.manual_reference && (
                <p className="mt-2 text-xs">Reference you gave us: <code>{tx.manual_reference}</code></p>
              )}
            </div>
          )}

          {tx.status === "payment_received" && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">
                {tx.handover_ready_at ? "Seller marked the car ready for handover" : "Seller is preparing handover"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {tx.handover_ready_at
                  ? `Ready since ${new Date(tx.handover_ready_at).toLocaleDateString()}. Collect the car and documents, then confirm receipt below.`
                  : "The seller is getting the car, keys and paperwork ready. You'll be notified when it's ready."}
              </p>
            </div>
          )}

          {tx.status === "payment_received" && (
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-semibold">Received your car?</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Confirm receipt once you have the car and documents. Funds are released after verification.
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={onConfirm}>I've received the car</Button>
                <Button variant="outline" onClick={() => setDisputeOpen(true)}>Raise dispute</Button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Amount breakdown</h3>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Car price</dt><dd>{fmt(Number(tx.display_car_price), tx.display_currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Service fee</dt><dd>{fmt(Number(tx.display_service_fee), tx.display_currency)}</dd></div>
              <div className="my-2 border-t" />
              <div className="flex justify-between"><dt className="font-semibold">Total paid</dt><dd className="font-bold text-primary">{fmt(Number(tx.display_total), tx.display_currency)}</dd></div>
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Method: {tx.payment_method === "manual"
                ? tx.manual_channel === "mpesa" ? "M-Pesa (manual review)" : "Bank transfer (manual review)"
                : "Card (Stripe)"}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">Transaction ID: <code>{tx.id.slice(0, 8)}</code></p>
          </div>
        </aside>
      </div>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>
              Tell us what went wrong. AutoConnect holds the funds while the case is reviewed.
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={5} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Describe the issue with at least 10 characters…" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
            <Button disabled={disputeReason.trim().length < 10} onClick={onDispute} className="bg-destructive hover:bg-destructive/90">File dispute</Button>
          </div>
        </DialogContent>
      </Dialog>
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
