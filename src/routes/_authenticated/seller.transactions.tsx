import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Wallet, Clock, CheckCircle2, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyPanel, ListSkeleton, Panel, StatTile } from "@/components/seller/SellerUI";
import {
  createSellerConnectAccount,
  refreshSellerStripeStatus,
  markHandoverReady,
} from "@/lib/payments.functions";
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

function SellerTransactions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [seller, setSeller] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: s } = await supabase
      .from("sellers")
      .select("id, country, stripe_account_id, stripe_onboarded, stripe_payouts_enabled")
      .eq("profile_id", u.user.id)
      .maybeSingle();
    setSeller(s);
    if (!s) {
      setRows([]);
      return;
    }
    const { data } = await supabase
      .from("transactions")
      .select(
        "id, status, display_currency, display_car_price, display_service_fee, display_total, paid_at, released_at, payment_method, manual_channel, handover_ready_at, cars!inner(title, year)",
      )
      .eq("seller_id", s.id)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function onHandoverReady(id: string) {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await markHandoverReady({
        data: { accessToken: sess.session.access_token, transactionId: id },
      });
      toast.success("Buyer notified — car marked ready for handover");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onboard() {
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) throw new Error("Sign in");
      const r = await createSellerConnectAccount({
        data: { accessToken: sess.session.access_token, origin: window.location.origin },
      });
      window.location.href = r.url;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshStatus() {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    await refreshSellerStripeStatus({ data: { accessToken: sess.session.access_token } });
    load();
    toast.success("Status refreshed");
  }

  const supported = seller && STRIPE_CONNECT_COUNTRIES.has((seller.country ?? "").toUpperCase());
  const earned = (rows ?? [])
    .filter((r) => ["funds_released", "completed"].includes(r.status))
    .reduce((s, r) => s + Number(r.display_car_price), 0);
  const pending = (rows ?? [])
    .filter((r) => ["payment_received", "admin_reviewing"].includes(r.status))
    .reduce((s, r) => s + Number(r.display_car_price), 0);
  const currency = rows?.[0]?.display_currency ?? "USD";
  const awaitingHandover = (rows ?? []).filter(
    (r) => r.status === "payment_received" && !r.handover_ready_at,
  );
  const loading = rows === null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Money"
        title="Transactions & payouts"
        description="Track your sales, held payments and handover. Funds are released after verification."
      />

      {/* Earnings first */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            featured
            icon={<Receipt />}
            label="Total earned"
            value={fmt(earned, currency)}
            sub="Released to you"
            loading={loading}
          />
        </div>
        <StatTile
          icon={<Clock />}
          tone="warning"
          label="Held by AutoConnect"
          value={fmt(pending, currency)}
          sub="Released after verification"
          loading={loading}
        />
        <StatTile
          icon={<Receipt />}
          label="Total sales"
          value={String(rows?.length ?? 0)}
          sub="All time"
          loading={loading}
        />
      </div>

      {/* Needs your attention: paid, waiting for handover */}
      {awaitingHandover.length > 0 && (
        <Panel
          kicker="Needs your attention"
          title={`${awaitingHandover.length} ${awaitingHandover.length === 1 ? "car is" : "cars are"} paid — get ready for handover`}
          description="Mark a car ready once it's prepared. We'll notify the buyer."
          className="border-ac-accent/40"
        >
          <ul className="space-y-2">
            {awaitingHandover.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 rounded-2xl bg-ac-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.cars?.title}</p>
                  <p className="text-sm text-muted-foreground">
                    You receive {fmt(Number(r.display_car_price), r.display_currency)}
                  </p>
                </div>
                <Button
                  className="h-11 rounded-full bg-ac-ink px-5 text-white hover:bg-ac-ink/90 dark:bg-ac-accent dark:text-ac-ink"
                  onClick={() => onHandoverReady(r.id)}
                >
                  <PackageCheck className="h-4 w-4" /> Mark ready
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Stripe Connect onboarding card */}
      <section className="rounded-3xl border border-border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="brand-kicker mb-1 text-muted-foreground">Payouts</p>
            {!seller ? (
              <div className="space-y-2" aria-busy="true">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
            ) : !supported ? (
              <>
                <p className="font-semibold">Stripe Connect not available in your country yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Country: {seller.country}. AutoConnect will arrange manual payouts after each sale
                  until coverage expands.
                </p>
              </>
            ) : seller.stripe_onboarded && seller.stripe_payouts_enabled ? (
              <>
                <p className="flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="h-4 w-4" /> Stripe account connected
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Payouts arrive 2-5 business days after funds are released.
                </p>
                <Button variant="outline" className="mt-3 h-11 rounded-full" onClick={refreshStatus}>
                  Refresh status
                </Button>
              </>
            ) : seller.stripe_account_id ? (
              <>
                <p className="font-semibold">Finish your Stripe onboarding</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You've started but Stripe still needs additional info to enable payouts.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="h-11 rounded-full" onClick={onboard} disabled={busy}>
                    Continue onboarding
                  </Button>
                  <Button variant="outline" className="h-11 rounded-full" onClick={refreshStatus}>
                    Refresh status
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold">Set up payouts to receive payments</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Connect your bank account via Stripe to receive payments when you sell cars on
                  AutoConnect.
                </p>
                <Button
                  className="mt-3 h-11 rounded-full bg-ac-accent px-5 text-ac-ink hover:bg-ac-accent/90"
                  onClick={onboard}
                  disabled={busy}
                >
                  {busy ? "Opening…" : "Connect with Stripe"}
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* All transactions */}
      <Panel kicker="History" title="All transactions">
        {rows === null ? (
          <ListSkeleton rows={3} />
        ) : rows.length === 0 ? (
          <EmptyPanel
            icon={<Receipt />}
            title="No transactions yet"
            description="When a buyer pays for one of your cars, the sale and your payout appear here."
            action={
              <Button asChild variant="outline" className="h-11 rounded-full">
                <Link to="/seller">Back to your listings</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-border lg:block">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Car</th>
                    <th className="px-4 py-3 text-left font-semibold">Method</th>
                    <th className="px-4 py-3 text-left font-semibold">Sale</th>
                    <th className="px-4 py-3 text-left font-semibold">Fee (5%)</th>
                    <th className="px-4 py-3 text-left font-semibold">You receive</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Paid</th>
                    <th className="px-4 py-3 text-right font-semibold">Invoice</th>
                    <th className="px-4 py-3 text-right font-semibold">Handover</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 font-semibold">{r.cars?.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{methodLabel(r)}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {fmt(Number(r.display_total), r.display_currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        −{fmt(Number(r.display_service_fee), r.display_currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">
                        {fmt(Number(r.display_car_price), r.display_currency)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {r.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to="/transactions/$id/invoice"
                          params={{ id: r.id }}
                          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <HandoverCell row={r} onReady={onHandoverReady} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
              {rows.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 font-semibold leading-snug">{r.cars?.title}</p>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {r.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="font-brand mt-2 text-2xl">
                    {fmt(Number(r.display_car_price), r.display_currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">You receive</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Sale</dt>
                    <dd className="text-right">{fmt(Number(r.display_total), r.display_currency)}</dd>
                    <dt className="text-muted-foreground">Fee (5%)</dt>
                    <dd className="text-right">
                      −{fmt(Number(r.display_service_fee), r.display_currency)}
                    </dd>
                    <dt className="text-muted-foreground">Method</dt>
                    <dd className="text-right">{methodLabel(r)}</dd>
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="text-right">
                      {r.paid_at ? new Date(r.paid_at).toLocaleDateString() : "—"}
                    </dd>
                  </dl>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                    <Link
                      to="/transactions/$id/invoice"
                      params={{ id: r.id }}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
                    >
                      View invoice
                    </Link>
                    <HandoverCell row={r} onReady={onHandoverReady} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}

function methodLabel(r: Row) {
  return r.payment_method === "manual"
    ? r.manual_channel === "mpesa"
      ? "M-Pesa (admin reviewed)"
      : "Bank transfer (admin reviewed)"
    : "Card (Stripe)";
}

function HandoverCell({ row, onReady }: { row: Row; onReady: (id: string) => void }) {
  if (row.status !== "payment_received")
    return <span className="text-xs text-muted-foreground">—</span>;
  if (row.handover_ready_at)
    return (
      <span className="text-xs text-success">
        Ready {new Date(row.handover_ready_at).toLocaleDateString()}
      </span>
    );
  return (
    <Button variant="outline" className="h-11 rounded-full" onClick={() => onReady(row.id)}>
      Mark ready
    </Button>
  );
}
