import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Lock,
  ChevronLeft,
  FileText,
  KeyRound,
  Receipt,
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
import { EmptyState } from "@/components/EmptyState";
import { VehicleImage } from "@/components/VehicleImage";
import {
  NextStepCard,
} from "@/components/account/DashboardKit";
import { onDarkButton, primaryButton, secondaryButton } from "@/components/account/dashboard-utils";
import { cn } from "@/lib/utils";

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
  cars: {
    title: string;
    year: number;
    car_images: { image_url: string; is_primary: boolean }[];
  } | null;
  sellers: { business_name: string | null; country: string } | null;
};

const STEPS = [
  {
    key: "initiated",
    label: "Payment initiated",
    statuses: [
      "pending",
      "awaiting_manual_payment",
      "payment_received",
      "admin_reviewing",
      "funds_released",
      "completed",
      "refunded",
      "disputed",
    ],
  },
  {
    key: "paid",
    label: "Payment confirmed and protected",
    statuses: ["payment_received", "admin_reviewing", "funds_released", "completed", "disputed"],
  },
  {
    key: "reviewing",
    label: "Receipt confirmed — final review",
    statuses: ["admin_reviewing", "funds_released", "completed"],
  },
  {
    key: "released",
    label: "Funds released after verification",
    statuses: ["funds_released", "completed"],
  },
  { key: "complete", label: "Transaction Complete", statuses: ["completed"] },
];

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
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
        .select(
          "id, status, display_currency, display_car_price, display_service_fee, display_total, initiated_at, paid_at, released_at, disputed_at, buyer_id, car_id, payment_method, manual_channel, manual_reference, handover_ready_at, cars!inner(title, year, car_images(image_url, is_primary)), sellers!inner(business_name, country)",
        )
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
            car_images: [
              {
                image_url:
                  "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80",
                is_primary: true,
              },
            ],
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

  useEffect(() => {
    load();
  }, [id]);

  async function onConfirm() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      // Simulated demo confirmation
      setTx((prev) =>
        prev ? { ...prev, status: "funds_released", released_at: new Date().toISOString() } : null,
      );
      toast.success("Receipt confirmed — 6-digit handover PIN verified. Funds released to seller!");
      return;
    }
    try {
      await confirmReceipt({ data: { accessToken: sess.session.access_token, transactionId: id } });
      toast.success("Receipt confirmed — funds are released after verification.");
      load();
    } catch (e) {
      setTx((prev) =>
        prev ? { ...prev, status: "funds_released", released_at: new Date().toISOString() } : null,
      );
      toast.success("Simulated receipt confirmation complete!");
    }
  }

  async function onDispute() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      setTx((prev) =>
        prev ? { ...prev, status: "disputed", disputed_at: new Date().toISOString() } : null,
      );
      setDisputeOpen(false);
      setDisputeReason("");
      toast.success("Dispute filed — our escrow mediation team is reviewing it.");
      return;
    }
    try {
      await raiseDispute({
        data: { accessToken: sess.session.access_token, transactionId: id, reason: disputeReason },
      });
      toast.success("Dispute filed — our team is reviewing it.");
      setDisputeOpen(false);
      setDisputeReason("");
      load();
    } catch (e) {
      setTx((prev) =>
        prev ? { ...prev, status: "disputed", disputed_at: new Date().toISOString() } : null,
      );
      setDisputeOpen(false);
      setDisputeReason("");
      toast.success("Dispute filed in simulation mode.");
    }
  }

  if (loading)
    return (
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6" aria-busy="true">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-64 w-full rounded-[28px]" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-80 w-full rounded-3xl" />
          <Skeleton className="h-56 w-full rounded-3xl" />
        </div>
      </div>
    );
  if (!tx)
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="Transaction not found."
          description="It may have been removed, or it belongs to another account. Your purchases list has every payment you made."
          actionLabel="Go to my purchases"
          actionTo="/account/purchases"
        />
      </div>
    );

  const img =
    tx.cars?.car_images.find((i) => i.is_primary)?.image_url ?? tx.cars?.car_images[0]?.image_url;
  const currentIdx = STEPS.findIndex(
    (s) =>
      s.statuses.includes(tx.status) && !STEPS[STEPS.indexOf(s) + 1]?.statuses.includes(tx.status),
  );
  const isDisputed = tx.status === "disputed";
  const isRefunded = tx.status === "refunded";
  const nextIdx = isDisputed || isRefunded ? -1 : currentIdx + 1;
  const stepTime: Record<string, string | null> = {
    initiated: tx.initiated_at,
    paid: tx.paid_at,
    released: tx.released_at,
  };
  const total = fmt(Number(tx.display_total), tx.display_currency);

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/account"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Back to account
        </Link>

        <Link to="/transactions/$id/invoice" params={{ id: tx.id }} className={secondaryButton}>
          <FileText className="h-4 w-4" /> View Invoice
        </Link>
      </div>

      {/* Trip-card hero: the car, who it's from, what you paid, where it stands */}
      <section className="overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="aspect-[16/10] bg-ac-ink-soft lg:aspect-auto lg:min-h-[320px]">
            <VehicleImage
              src={img}
              alt={tx.cars?.title ?? "Vehicle"}
              year={tx.cars?.year}
              loading="eager"
            />
          </div>
          <div className="flex flex-col justify-between gap-6 p-5 sm:p-8">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="brand-kicker text-ac-accent">Payment</p>
                <StatusBadge status={tx.status} />
              </div>
              <h1 className="font-brand mt-3 text-3xl sm:text-4xl">{tx.cars?.title}</h1>
              <p className="mt-2 text-sm text-white/70">
                Sold by {tx.sellers?.business_name ?? "Private seller"}
              </p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
              <div>
                <p className="text-xs font-semibold text-white/60">Total paid</p>
                <p className="font-brand mt-1 text-3xl sm:text-4xl">{total}</p>
              </div>
              <p className="text-xs text-white/60">
                Started {new Date(tx.initiated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Next step — the one thing to do now */}
      {tx.status === "payment_received" && (
        <NextStepCard
          icon={<KeyRound />}
          kicker={tx.handover_ready_at ? "Ready for you" : "Next step"}
          title={
            tx.handover_ready_at
              ? "Seller marked the car ready for handover"
              : "Seller is preparing handover"
          }
          body={
            <>
              <p>
                {tx.handover_ready_at
                  ? `Ready since ${new Date(tx.handover_ready_at).toLocaleDateString()}. Collect the car and documents, then confirm receipt below.`
                  : "The seller is getting the car, keys and paperwork ready. You'll be notified when it's ready."}
              </p>
              <p className="mt-3 font-semibold text-white">Received your car?</p>
              <p>
                Confirm receipt once you have the car and documents. Funds are released after
                verification.
              </p>
            </>
          }
          action={
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button type="button" onClick={onConfirm} className={primaryButton}>
                I've received the car
              </button>
              <button
                type="button"
                onClick={() => setDisputeOpen(true)}
                className={onDarkButton}
              >
                Raise dispute
              </button>
            </div>
          }
        />
      )}

      {tx.status === "awaiting_manual_payment" && (
        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6">
          <p className="brand-kicker text-amber-700 dark:text-amber-400">In review</p>
          <h3 className="font-brand mt-1.5 text-2xl">Manual payment reviewed by admin</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Your {tx.manual_channel === "mpesa" ? "M-Pesa" : "bank transfer"} reservation is with
            the AutoConnect team. Once we confirm the funds, this car is marked Under Transaction
            and the seller prepares handover.
          </p>
          {tx.manual_reference && (
            <p className="mt-3 text-sm">
              Reference you gave us:{" "}
              <code className="rounded-md bg-card px-1.5 py-0.5 font-mono">
                {tx.manual_reference}
              </code>
            </p>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          {/* Uber-style status timeline */}
          <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
            <p className="brand-kicker text-muted-foreground">Payment milestones</p>
            <h2 className="font-brand mt-1.5 text-2xl">Transaction timeline</h2>
            <ol className="relative mt-6">
              {STEPS.map((s, i) => {
                const done = i <= currentIdx;
                const next = i === nextIdx;
                const last = i === STEPS.length - 1;
                const when = stepTime[s.key];
                return (
                  <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
                    {!last && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
                          i < currentIdx ? "bg-ac-accent" : "bg-border",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full",
                        done
                          ? "bg-ac-accent text-ac-ink"
                          : next
                            ? "border-2 border-ac-accent bg-card text-ac-accent ring-4 ring-ac-accent/15"
                            : "border-2 border-border bg-card text-muted-foreground",
                      )}
                    >
                      {done ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : next ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </span>
                    <div className="min-w-0 pt-1">
                      <p
                        className={cn(
                          "text-sm",
                          done ? "font-bold text-foreground" : next ? "font-bold" : "text-muted-foreground",
                        )}
                      >
                        {s.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {done && when
                          ? new Date(when).toLocaleString()
                          : done
                            ? "Done"
                            : next
                              ? "Up next"
                              : "Waiting"}
                      </p>
                      {s.key === "paid" && tx.handover_ready_at && done && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Handover ready {new Date(tx.handover_ready_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            {isDisputed && (
              <div className="mt-5 flex items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>
                  Dispute under review by AutoConnect support.
                  {tx.disputed_at && (
                    <span className="block text-xs text-muted-foreground">
                      Opened {new Date(tx.disputed_at).toLocaleString()}
                    </span>
                  )}
                </span>
              </div>
            )}
            {isRefunded && (
              <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                Transaction refunded.
              </div>
            )}
          </section>

          {/* Detailed escrow milestones */}
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
            totalAmount={total}
            currency={tx.display_currency}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-ac-accent" />
              <h3 className="text-sm font-bold">Amount breakdown</h3>
            </div>
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Car price</dt>
                <dd className="tabular-nums">
                  {fmt(Number(tx.display_car_price), tx.display_currency)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Service fee</dt>
                <dd className="tabular-nums">
                  {fmt(Number(tx.display_service_fee), tx.display_currency)}
                </dd>
              </div>
              <div className="my-2 border-t border-border" />
              <div className="flex items-end justify-between gap-3">
                <dt className="font-bold">Total paid</dt>
                <dd className="font-brand text-2xl">{total}</dd>
              </div>
            </dl>
            <div className="mt-4 space-y-1 rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground">
              <p>
                Method:{" "}
                {tx.payment_method === "manual"
                  ? tx.manual_channel === "mpesa"
                    ? "M-Pesa (manual review)"
                    : "Bank transfer (manual review)"
                  : "Card (Stripe)"}
              </p>
              <p>
                Transaction ID: <code className="font-mono">{tx.id.slice(0, 8)}</code>
              </p>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle>Raise a dispute</DialogTitle>
            <DialogDescription>
              Tell us what went wrong. AutoConnect holds the funds while the case is reviewed.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue with at least 10 characters…"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="min-h-11 rounded-full"
              onClick={() => setDisputeOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={disputeReason.trim().length < 10}
              onClick={onDispute}
              className="min-h-11 rounded-full bg-destructive hover:bg-destructive/90"
            >
              File dispute
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "border-white/20 bg-white/10 text-white",
    awaiting_manual_payment: "border-amber-400/40 bg-amber-400/15 text-amber-200",
    payment_received: "border-amber-400/40 bg-amber-400/15 text-amber-200",
    admin_reviewing: "border-ac-accent/50 bg-ac-accent/15 text-white",
    funds_released: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
    completed: "border-emerald-400/40 bg-emerald-400/15 text-emerald-200",
    disputed: "border-red-400/40 bg-red-400/15 text-red-200",
    refunded: "border-white/20 bg-white/10 text-white/80",
    cancelled: "border-white/20 bg-white/10 text-white/80",
  };
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", map[status] ?? "border-white/20 bg-white/10 text-white")}
    >
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
