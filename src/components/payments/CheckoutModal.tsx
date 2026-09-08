import { useEffect, useState } from "react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  CreditCard,
  Smartphone,
  Landmark,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  Car,
  MapPin,
  Calendar,
  Check,
  ArrowRight,
} from "lucide-react";
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
import { checkMpesaPaymentStatus, createManualReservation, createPaymentIntent, initiateDarajaStkPush } from "@/lib/payments.functions";
import { STRIPE_PUBLISHABLE_KEY, calculateBreakdown, fromUsdCents } from "@/lib/stripe-config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/contexts/CurrencyContext";

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

type Step = 1 | 2 | 3 | 4;
type Method = "mpesa" | "card" | "bank";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  carId: string;
  carTitle: string;
  carPrice: number;
  currency: string;
  carImage?: string;
  paymentPlan?: "full" | "deposit" | "installments";
  planLabel?: string;
  location?: string;
  year?: number;
}

export function CheckoutModal({
  open,
  onOpenChange,
  carId,
  carTitle,
  carPrice,
  currency,
  carImage,
  paymentPlan = "full",
  planLabel = "Full payment",
  location = "Nairobi, Kenya",
  year,
}: CheckoutModalProps) {
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  // Do not default to a mobile-money flow. Provider confirmation must be
  // available before a customer can start one.
  const [method, setMethod] = useState<Method>("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<"pending" | "awaiting_review" | "confirmed">("pending");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  // Form Fields for Step 3
  const [payerName, setPayerName] = useState("");
  const [phone, setPhone] = useState("+254 ");
  const [reference, setReference] = useState("");

  const breakdown = calculateBreakdown(carPrice, currency);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setMethod("card");
      setClientSecret(null);
      setTransactionId(null);
      setError(null);
      setPaymentState("pending");
      setCheckoutRequestId(null);
      setPayerName("");
      setPhone("+254 ");
      setReference("");
    }
  }, [open]);

  // Handle Stripe intent initialization
  async function initStripePayment() {
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
    } catch (e) {
      console.warn("Stripe intent error:", e);
      setError(e instanceof Error ? e.message : "Card checkout is unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // A reservation is not payment evidence. M-Pesa and card are confirmed only
  // after their verified provider status has been recorded by the backend.
  async function handleFinalizePayment() {
    setLoading(true);
    setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Please sign in before starting a payment.");
      if (method === "card") throw new Error("Use the secure card form to submit your payment.");
      if (!payerName.trim()) throw new Error("Enter the payer's full name.");
      if (method === "mpesa") {
        if (phone.replace(/\D/g, "").length < 9) throw new Error("Enter a valid Safaricom phone number.");
        const r = await initiateDarajaStkPush({ data: { accessToken: sess.session.access_token, carId, paymentPlan, phone } });
        setTransactionId(r.transactionId);
        setCheckoutRequestId(r.checkoutRequestId);
        setPaymentState("pending");
        setStep(4);
        toast.info("M-Pesa request sent", { description: r.customerMessage });
        return;
      }
      const r = await createManualReservation({ data: { accessToken: sess.session.access_token, carId, paymentPlan, channel: "bank", payerName: payerName.trim(), phone: phone.trim() || "Not supplied", reference: reference.trim() || undefined, note: "Bank transfer reservation" } });
      setTransactionId(r.transactionId);
      setPaymentState("awaiting_review");
      setStep(4);
      toast.info("Transfer reservation submitted", { description: "It is awaiting verified receipt and review." });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment processing failed");
    } finally {
      setLoading(false);
    }
  }

  async function refreshMpesaStatus() {
    if (!transactionId || !checkoutRequestId) return;
    setLoading(true); setError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Your session has expired. Sign in again to check payment status.");
      const result = await checkMpesaPaymentStatus({ data: { accessToken: sess.session.access_token, transactionId, checkoutRequestId } });
      if (result.status === "success") { setPaymentState("confirmed"); toast.success("Payment confirmed", { description: "Verified M-Pesa evidence was received." }); }
      else if (result.status === "pending") toast.info("Still waiting for M-Pesa confirmation.");
      else setError(result.resultDesc || "M-Pesa payment was not completed.");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to verify M-Pesa status."); }
    finally { setLoading(false); }
  }

  const handlePrintReceipt = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0 border-border rounded-3xl shadow-2xl">
        {/* Top Progress Bar Header */}
        <div className="border-b border-border bg-slate-950 p-5 text-white">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Lock className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  One-Tap Secure Checkout
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-teal-500/10 text-teal-300 border-teal-500/30 font-mono"
                  >
                    ESCROW PROTECTED
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Step {step} of 4 ·{" "}
                  {step === 1
                    ? "Confirm Vehicle"
                    : step === 2
                      ? "Payment Method"
                      : step === 3
                        ? "Payment Details"
                        : "Receipt & Next Steps"}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* 4-Step Visual Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-4 text-[10px] font-medium text-slate-400 text-center">
              <span className={step >= 1 ? "text-teal-300 font-bold" : ""}>1. Details</span>
              <span className={step >= 2 ? "text-teal-300 font-bold" : ""}>2. Method</span>
              <span className={step >= 3 ? "text-teal-300 font-bold" : ""}>3. Payment</span>
              <span className={step >= 4 ? "text-teal-300 font-bold" : ""}>4. Receipt</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* STEP 1: CONFIRM VEHICLE DETAILS */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Vehicle Preview Card */}
              <div className="flex gap-4 p-3.5 rounded-2xl border border-border bg-card shadow-xs">
                {carImage ? (
                  <img
                    src={carImage}
                    alt={carTitle}
                    className="h-20 w-28 rounded-xl object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-20 w-28 rounded-xl bg-slate-900 grid place-items-center shrink-0 text-teal-400">
                    <Car className="h-8 w-8 opacity-60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-semibold bg-teal-500/10 text-teal-400 border-teal-500/20"
                    >
                      {planLabel}
                    </Badge>
                    {year && (
                      <span className="text-xs text-muted-foreground font-medium">· {year}</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground truncate mt-1">{carTitle}</h4>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary" /> {location}
                  </p>
                </div>
              </div>

              {/* Itemized Price Breakdown */}
              <div className="space-y-2.5 rounded-2xl border border-border/80 bg-muted/30 p-4 text-sm">
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span>{planLabel} Amount</span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(breakdown.carPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    AutoConnect Escrow Fee ({breakdown.feePercent}%)
                    <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatPrice(breakdown.serviceFee)}
                  </span>
                </div>
                <div className="border-t border-border/80 pt-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-foreground">Total Payable Now</span>
                    <p className="text-[10px] text-muted-foreground">
                      Held securely in neutral escrow
                    </p>
                  </div>
                  <span className="text-xl font-extrabold text-teal-500 font-mono">
                    {formatPrice(breakdown.total)}
                  </span>
                </div>
              </div>

              {/* Escrow Trust Bullet Points */}
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-teal-400 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> 100% Buyer Protection Guarantee
                </p>
                <p className="text-[11px] leading-relaxed">
                  Funds are held in AutoConnect neutral escrow. The seller is only paid after the
                  physical vehicle inspection is passed and title handover is confirmed.
                </p>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="w-full h-12 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2"
              >
                <span>Select Payment Method</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* STEP 2: CHOOSE PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <h3 className="text-sm font-bold text-foreground">Select how you wish to pay:</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All methods are protected by AutoConnect Escrow.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="w-full flex items-start gap-3.5 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-left">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-500">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">PesaPal checkout</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-500/30">Being connected</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">PesaPal will support cards and local payment methods after its verified notification connection is active.</p>
                  </div>
                </div>
                {/* M-Pesa Option */}
                {false && <button
                  type="button"
                  onClick={() => setMethod("mpesa")}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                    method === "mpesa"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm"
                      : "border-border hover:border-emerald-500/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/20 text-emerald-500 font-black text-xs">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        M-Pesa Express / STK
                      </span>
                      <Badge className="bg-emerald-500 text-slate-950 text-[10px] font-bold">
                        Fastest in East Africa
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Instant mobile PIN prompt sent to your Safaricom phone number.
                    </p>
                  </div>
                </button>}

                {/* Card / Stripe Option */}
                <button
                  type="button"
                  onClick={() => {
                    setMethod("card");
                    void initStripePayment();
                  }}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                    method === "card"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        Credit or Debit Card
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-primary border-primary/30"
                      >
                        Visa / Mastercard / Amex
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Instant online checkout with 3D Secure bank authorization.
                    </p>
                  </div>
                </button>

                {/* Bank Wire Option */}
                <button
                  type="button"
                  onClick={() => setMethod("bank")}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all ${
                    method === "bank"
                      ? "border-amber-500 bg-amber-500/10 shadow-sm"
                      : "border-border hover:border-amber-500/50 hover:bg-muted/40"
                  }`}
                >
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-500">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">
                        Direct Bank Wire / RTGS
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] text-amber-600 border-amber-500/30"
                      >
                        Escrow Account
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Transfer directly to AutoConnect verified Equity Bank escrow account.
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="h-11 px-4 rounded-xl text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 gap-2"
                >
                  <span>
                    Continue with{" "}
                    {method === "mpesa" ? "M-Pesa" : method === "card" ? "Card" : "Bank Transfer"}
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: ENTER PAYMENT DETAILS */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* M-PESA PAYMENT DETAILS */}
              {method === "mpesa" && (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-400">
                        M-Pesa Express Authorization
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Total: {formatPrice(breakdown.total)}
                      </p>
                    </div>
                    <Smartphone className="h-5 w-5 text-emerald-400" />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="payerName" className="text-xs">
                      Your Full Name
                    </Label>
                    <Input
                      id="payerName"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="e.g. Alice Mwangi"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mpesaPhone" className="text-xs">
                      Safaricom Phone Number
                    </Label>
                    <Input
                      id="mpesaPhone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      className="h-11 rounded-xl font-mono"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      An STK PIN prompt for {formatPrice(breakdown.total)} will be sent to this
                      number.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="mpesaRef" className="text-xs text-muted-foreground">
                      Manual Reference Code (Optional if paid via Paybill 4123456)
                    </Label>
                    <Input
                      id="mpesaRef"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. QKH8927189"
                      className="h-11 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {/* CARD / STRIPE DETAILS */}
              {method === "card" && (
                <div className="space-y-3">
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">
                        Stripe 256-Bit Encrypted Payment
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Total: {formatPrice(breakdown.total)}
                      </p>
                    </div>
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>

                  {clientSecret ? (
                    <Elements stripe={getStripe()} options={{ clientSecret }}>
                      <StripePaymentForm
                        transactionId={transactionId}
                        onSubmitted={() => { setPaymentState("pending"); setStep(4); toast.info("Card payment submitted", { description: "We are waiting for Stripe's verified confirmation." }); }}
                        onError={setError}
                      />
                    </Elements>
                  ) : (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700">{loading ? "Preparing the secure card form…" : "Card checkout could not be prepared. Return to payment methods and try again."}</p>
                  )}
                </div>
              )}

              {/* BANK DETAILS */}
              {method === "bank" && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1 text-xs">
                    <p className="font-bold text-amber-700">Bank transfer review</p>
                    <p className="text-[11px] text-muted-foreground">No bank account details are embedded in the app. Only use payment instructions supplied through your verified AutoConnect account or an approved invoice.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Sender Account / Full Name</Label>
                    <Input
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Account holder name"
                      className="h-11 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Bank Transfer Reference</Label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. FT2608301928"
                      className="h-11 rounded-xl font-mono uppercase"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {method !== "card" && <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="h-11 px-4 rounded-xl text-xs"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalizePayment}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Authorizing Escrow...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Authorize Payment ({formatPrice(breakdown.total)})</span>
                    </>
                  )}
                </Button>
              </div>}
            </div>
          )}

          {/* STEP 4: CONFIRMATION & RECEIPT */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-1.5 py-2">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/40 animate-bounce">
                  <Check className="h-7 w-7 stroke-[3]" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">{paymentState === "confirmed" ? "Payment confirmed" : paymentState === "awaiting_review" ? "Transfer awaiting review" : "Payment verification in progress"}</h3>
                <p className="text-xs text-muted-foreground">{paymentState === "confirmed" ? "Verified payment evidence was received and recorded." : paymentState === "awaiting_review" ? "Your reservation is not payment confirmation. AutoConnect must verify the transfer." : "Do not treat this as confirmation until the payment provider verifies it."}</p>
              </div>

              {/* Digital Receipt Card */}
              <div className="rounded-2xl border border-border/80 bg-slate-900/60 p-4 text-xs space-y-2.5 font-mono text-slate-300">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-muted-foreground">Escrow Ref:</span>
                  <span className="font-bold text-teal-400">
                    {transactionId || "Not created"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="text-white font-sans font-medium text-right truncate max-w-[200px]">
                    {carTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <span className="text-white">{planLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="text-white uppercase">{method}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
                  <span className="text-white">Amount:</span>
                  <span className="text-teal-400">{formatPrice(breakdown.total)}</span>
                </div>
              </div>
              {method === "mpesa" && paymentState !== "confirmed" && <Button type="button" variant="outline" onClick={refreshMpesaStatus} disabled={loading} className="w-full">{loading ? "Checking payment…" : "Check M-Pesa payment status"}</Button>}

              {/* Next Steps Flow */}
              <div className="rounded-2xl border border-border bg-card p-3.5 space-y-2 text-xs">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-teal-400" /> What Happens Next:
                </p>
                <div className="space-y-2 text-muted-foreground text-[11px]">
                  <div className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                      1
                    </span>
                    <span>
                      <strong>NTSA Title & Inspection Verification:</strong> Yard managers verify
                      chassis VIN & logbook.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                      2
                    </span>
                    <span>
                      <strong>Viewing & Handover:</strong> Collect your car at Nairobi Hub or
                      receive door-to-door delivery.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                      3
                    </span>
                    <span>
                      <strong>Buyer Release Sign-off:</strong> Escrow is only released to seller
                      after you confirm satisfaction.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrintReceipt}
                  className="w-full sm:w-auto h-11 rounded-xl text-xs gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print Receipt
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    void navigate({ to: "/dashboard" as never });
                  }}
                  className="flex-1 w-full h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md"
                >
                  View in Escrow Tracker & Dashboard →
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StripePaymentForm({ transactionId, onSubmitted, onError }: { transactionId: string | null; onSubmitted: () => void; onError: (message: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const submit = async () => {
    if (!stripe || !elements || !transactionId) return;
    setSubmitting(true); onError("");
    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setSubmitting(false);
    if (error) { onError(error.message || "Your card payment could not be submitted."); return; }
    onSubmitted();
  };
  return <div className="space-y-3"><PaymentElement options={{ layout: "tabs" }} /><Button type="button" disabled={!stripe || submitting} onClick={submit} className="w-full h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400">{submitting ? "Submitting securely…" : "Submit card payment"}</Button><p className="text-[11px] text-muted-foreground">A submitted card payment is not shown as confirmed until Stripe sends verified server-side evidence.</p></div>;
}
