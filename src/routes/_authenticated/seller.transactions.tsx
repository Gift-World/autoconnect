import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Wallet, Clock } from "lucide-react";
import { createSellerConnectAccount, refreshSellerStripeStatus, markHandoverReady } from "@/lib/payments.functions";
import { STRIPE_CONNECT_COUNTRIES } from "@/lib/stripe-config";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/seller/transactions")({
  component: SellerTransactions,
});

type Row = {
  id: string;
  status: string;
  display_currency: string;
  display_car_price: number;
  display_service_fee: number;
  display_total: number;
  paid_at: string | null;
  released_at: string | null;
  payment_method: string | null;
  manual_channel: string | null;
  handover_ready_at: string | null;
  cars: { title: string; year: number } | null;
};

function fmt(amount: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}

function SellerTransactions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: s } = await supabase.from("sellers").select("id, country, stripe_account_id, stripe_onboarded, stripe_payouts_enabled").eq("profile_id", u.user.id).maybeSingle();
    setSeller(s);
    if (!s) { setRows([]); return; }
    const { data } = await supabase
      .from("transactions")
      .select("id, status, display_currency, display_car_price, display_service_fee, display_total, paid_at, released_at, payment_method, manual_channel, handover_ready_at, cars!inner(title, year)")
      .eq("seller_id", s.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  }

  useEffect(() => { load(); }, []);

  async function onHandoverReady(id: string) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await markHandoverReady({ data: { accessToken: sess.session.access_token, transactionId: id } });
      toast.success("Buyer notified — car marked ready for handover");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function onboard() {
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Sign in");
      const r = await createSellerConnectAccount({ data: { accessToken: sess.session.access_token, origin: window.location.origin } });
      window.location.href = r.url;
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function refreshStatus() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await refreshSellerStripeStatus({ data: { accessToken: sess.session.access_token } });
    load();
    toast.success("Status refreshed");
  }

  const supported = seller && STRIPE_CONNECT_COUNTRIES.has((seller.country ?? "").toUpperCase());
  const earned = (rows ?? []).filter((r) => ["funds_released", "completed"].includes(r.status))
    .reduce((s, r) => s + Number(r.display_car_price), 0);
  const pending = (rows ?? []).filter((r) => ["payment_received", "admin_reviewing"].includes(r.status))
    .reduce((s, r) => s + Number(r.display_car_price), 0);
  const currency = rows?.[0]?.display_currency ?? "USD";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Transactions & payouts</h1>
        <p className="text-sm text-muted-foreground">
          Track your sales, held payments and handover. Funds are released after verification.
        </p>
      </header>

      {/* Stripe Connect onboarding card */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex-1">
            {!seller ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : !supported ? (
              <>
                <p className="text-sm font-semibold">Stripe Connect not available in your country yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Country: {seller.country}. AutoConnect will arrange manual payouts after each sale until coverage expands.
                </p>
              </>
            ) : seller.stripe_onboarded && seller.stripe_payouts_enabled ? (
              <>
                <p className="text-sm font-semibold text-success">✓ Stripe account connected</p>
                <p className="mt-1 text-xs text-muted-foreground">Payouts arrive 2-5 business days after funds are released.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={refreshStatus}>Refresh status</Button>
              </>
            ) : seller.stripe_account_id ? (
              <>
                <p className="text-sm font-semibold">Finish your Stripe onboarding</p>
                <p className="mt-1 text-xs text-muted-foreground">You've started but Stripe still needs additional info to enable payouts.</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={onboard} disabled={busy}>Continue onboarding</Button>
                  <Button size="sm" variant="outline" onClick={refreshStatus}>Refresh status</Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Set up payouts to receive payments</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Connect your bank account via Stripe to receive payments when you sell cars on AutoConnect.
                </p>
                <Button size="sm" className="mt-3" onClick={onboard} disabled={busy}>
                  {busy ? "Opening…" : "Connect with Stripe"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat icon={<Receipt className="h-4 w-4" />} label="Total earned" value={fmt(earned, currency)} />
        <Stat icon={<Clock className="h-4 w-4" />} label="Held by AutoConnect" value={fmt(pending, currency)} />
        <Stat icon={<Receipt className="h-4 w-4" />} label="Total sales" value={String(rows?.length ?? 0)} />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Car</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-left">Sale</th>
              <th className="px-4 py-3 text-left">Fee (5%)</th>
              <th className="px-4 py-3 text-left">You receive</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-right">Handover</th>
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No transactions yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3 font-medium">{r.cars?.title}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.payment_method === "manual"
                    ? r.manual_channel === "mpesa" ? "M-Pesa (admin reviewed)" : "Bank transfer (admin reviewed)"
                    : "Card (Stripe)"}
                </td>
                <td className="px-4 py-3">{fmt(Number(r.display_total), r.display_currency)}</td>
                <td className="px-4 py-3 text-muted-foreground">−{fmt(Number(r.display_service_fee), r.display_currency)}</td>
                <td className="px-4 py-3 font-semibold">{fmt(Number(r.display_car_price), r.display_currency)}</td>
                <td className="px-4 py-3"><Badge variant="outline">{r.status.replaceAll("_", " ")}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right">
                  {r.status === "payment_received" ? (
                    r.handover_ready_at ? (
                      <span className="text-xs text-success">Ready {new Date(r.handover_ready_at).toLocaleDateString()}</span>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onHandoverReady(r.id)}>Mark ready</Button>
                    )
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
