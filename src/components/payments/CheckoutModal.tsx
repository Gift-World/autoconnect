import { useEffect, useState } from "react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Lock, ShieldCheck, CheckCircle2, Loader2, AlertTriangle, CreditCard, Smartphone, Landmark, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { createPaymentIntent, createManualReservation } from "@/lib/payments.functions";
import { STRIPE_PUBLISHABLE_KEY, calculateBreakdown, fromUsdCents } from "@/lib/stripe-config";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

function fmt(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

type Step = "review" | "pay" | "manual" | "manual_success" | "success" | "error";
type Method = "card" | "mpesa" | "bank";

const MPESA_PAYBILL = "AutoConnect Paybill 4123456";
const BANK_DETAILS = "AutoConnect Escrow — Equity Bank, Acc 0170 2612 3456";

export function CheckoutModal({
  open,
  onOpenChange,
  carId,
  carTitle,
  carPrice,
  currency,
  paymentPlan = "full",
  planLabel = "Full payment",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  carId: string;
  carTitle: string;
  carPrice: number;
  currency: string;
  paymentPlan?: "full" | "deposit" | "installments";
  planLabel?: string;
}) {
  const [step, setStep] = useState<Step>("review");
  const [method, setMethod] = useState<Method>("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const breakdown = calculateBreakdown(carPrice, currency);

  async function initPayment() {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Please sign in to continue");
      const r = await createPaymentIntent({
        data: {
          accessToken: sess.session.access_token,
          carId,
          paymentPlan,
          amount: carPrice,
        },
      });
      setClientSecret(r.clientSecret);
      setTransactionId(r.transactionId);
      setStep("pay");
    } catch (e) {
      setError((e as Error).message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) {
      setStep("review");
      setMethod("card");
      setClientSecret(null);
      setTransactionId(null);
      setError(null);
      setPayerName(""); setPhone(""); setReference(""); setNote("");
    }
  }, [open]);

  async function submitManual() {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Please sign in to continue");
      const r = await createManualReservation({
        data: {
          accessToken: sess.session.access_token,
          carId,
          paymentPlan,
          channel: method === "mpesa" ? "mpesa" : "bank",
          payerName,
          phone,
          reference: reference || undefined,
          note: note || undefined,
        },
      });
      setTransactionId(r.transactionId);
      setStep("manual_success");
    } catch (e) {
      setError((e as Error).message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Secure Checkout
          </DialogTitle>
          <DialogDescription>{carTitle} · {planLabel}</DialogDescription>
        </DialogHeader>

        {step === "review" && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <Row label="Car price" value={fmt(breakdown.carPrice, currency)} />
              <Row label={`Service fee (${breakdown.feePercent}%)`} value={fmt(breakdown.serviceFee, currency)} />
              <div className="my-2 border-t" />
              <Row label="Total payable" value={fmt(breakdown.total, currency)} bold />
              {method === "card" && (
                <p className="pt-1 text-xs text-muted-foreground">
                  Charged in USD: ${fromUsdCents(breakdown.totalUsdCents).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment method</p>
              <div className="grid gap-1.5">
                <MethodOption
                  active={method === "card"}
                  onClick={() => setMethod("card")}
                  icon={<CreditCard className="h-4 w-4" />}
                  title="Card (Stripe)"
                  sub="Paid online, confirmed automatically"
                />
                <MethodOption
                  active={method === "mpesa"}
                  onClick={() => setMethod("mpesa")}
                  icon={<Smartphone className="h-4 w-4" />}
                  title="M-Pesa"
                  sub="Manual payment reviewed by admin"
                />
                <MethodOption
                  active={method === "bank"}
                  onClick={() => setMethod("bank")}
                  icon={<Landmark className="h-4 w-4" />}
                  title="Bank transfer"
                  sub="Manual payment reviewed by admin"
                />
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Payment protected — held by AutoConnect, not sent straight to the seller</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Funds released after verification and your confirmation of receipt</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Documents reviewed by AutoConnect before handover</li>
            </ul>
            <Button
              onClick={() => (method === "card" ? initPayment() : setStep("manual"))}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
              {method === "card" ? "Continue to payment" : "Continue to reservation"}
            </Button>
          </div>
        )}

        {step === "pay" && clientSecret && (
          <Elements stripe={getStripe()} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <PayForm
              amountLabel={fmt(breakdown.total, currency)}
              onSuccess={() => setStep("success")}
              onError={(m) => {
                setError(m);
                setStep("error");
              }}
            />
          </Elements>
        )}

        {step === "success" && (
          <SuccessView transactionId={transactionId!} onClose={() => onOpenChange(false)} />
        )}

        {step === "manual" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setStep("review")}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </button>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p className="font-semibold">
                {method === "mpesa" ? "Pay via M-Pesa" : "Pay via bank transfer"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Send {fmt(breakdown.total, currency)} to:
              </p>
              <p className="mt-1 font-mono text-xs">{method === "mpesa" ? MPESA_PAYBILL : BANK_DETAILS}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Then submit the details below. Manual payment reviewed by admin — the car is reserved once we
                confirm the funds.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="mp-name">Name used to pay</Label>
                <Input id="mp-name" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Jane Wanjiku" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mp-phone">Phone number</Label>
                <Input id="mp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254 7xx xxx xxx" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mp-ref">{method === "mpesa" ? "M-Pesa code (if already paid)" : "Transfer reference (optional)"}</Label>
                <Input id="mp-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={method === "mpesa" ? "e.g. SFH4X9K2LM" : "e.g. TRF-88213"} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="mp-note">Note to AutoConnect (optional)</Label>
                <Textarea id="mp-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything we should know about this payment" />
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={loading || payerName.trim().length < 2 || phone.trim().length < 6}
              onClick={submitManual}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Submit for admin review
            </Button>
          </div>
        )}

        {step === "manual_success" && (
          <ManualSuccessView transactionId={transactionId!} onClose={() => onOpenChange(false)} />
        )}

        {step === "error" && (
          <div className="space-y-3 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
            <p className="text-sm">{error ?? "Payment failed"}</p>
            <Button onClick={() => setStep("review")} variant="outline">Try again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "text-base font-bold text-primary" : ""}>{value}</span>
    </div>
  );
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        active ? "border-primary bg-primary/5" : "hover:bg-muted"
      }`}
    >
      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
    </button>
  );
}

function ManualSuccessView({ transactionId, onClose }: { transactionId: string; onClose: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    toast.success("Reservation submitted for review");
  }, []);
  return (
    <div className="space-y-4 py-2 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShieldCheck className="h-9 w-9 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Reservation submitted</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Manual payment reviewed by admin. Once AutoConnect confirms the funds, the car moves to Under
          Transaction and the seller prepares handover.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Reference: <code className="text-foreground">{transactionId.slice(0, 8)}</code></p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            onClose();
            navigate({ to: "/transactions/$id", params: { id: transactionId } });
          }}
        >
          View transaction
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>Keep browsing</Button>
      </div>
    </div>
  );
}

function PayForm({
  amountLabel,
  onSuccess,
  onError,
}: {
  amountLabel: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setSubmitting(false);
    if (error) {
      onError(error.message ?? "Payment failed");
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onSuccess();
    } else {
      onError(`Unexpected status: ${paymentIntent?.status}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || submitting} size="lg" className="w-full">
        {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
        Pay {amountLabel} Securely
      </Button>
      <p className="text-center text-[11px] text-muted-foreground">Powered by Stripe · 256-bit SSL</p>
    </form>
  );
}

function SuccessView({ transactionId, onClose }: { transactionId: string; onClose: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    toast.success("Payment received!");
  }, []);
  return (
    <div className="space-y-4 py-2 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-9 w-9 text-success" />
      </div>
      <div>
        <h3 className="text-xl font-bold">Payment Received!</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your payment is protected and held by AutoConnect. The seller has been notified to prepare handover.
          Funds are released after verification and your confirmation of receipt.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">Transaction ID: <code className="text-foreground">{transactionId.slice(0, 8)}</code></p>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          onClick={() => {
            onClose();
            navigate({ to: "/transactions/$id", params: { id: transactionId } });
          }}
        >
          View transaction
        </Button>
        <Button variant="outline" className="flex-1" onClick={onClose}>
          Keep browsing
        </Button>
      </div>
    </div>
  );
}
