import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Wallet, Banknote, ShieldAlert, Coins, ReceiptText, ChevronRight, Car } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  FilterChips,
  KV,
  QueueEmpty,
  QueueSkeleton,
  StatTile,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";
import { DetailSheet } from "@/components/admin/DetailSheet";

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
  sellers: {
    business_name: string | null;
    country: string;
    stripe_payouts_enabled: boolean;
  } | null;
  buyer: { full_name: string | null; country: string | null } | null;
};

function fmt(a: number, c: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: c,
      maximumFractionDigits: 0,
    }).format(a);
  } catch {
    return `${c} ${a.toLocaleString()}`;
  }
}

const HELD = ["payment_received", "admin_reviewing"];
const REFUNDABLE = ["awaiting_manual_payment", "payment_received", "admin_reviewing", "disputed"];
const NEEDS_ACTION = ["awaiting_manual_payment", "payment_received", "admin_reviewing", "disputed"];

type FilterKey = "action" | "manual" | "held" | "disputed" | "done" | "all";

function AdminTransactions() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [refundOpen, setRefundOpen] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState<Row | null>(null);
  const [confirmRef, setConfirmRef] = useState("");
  const [confirmNote, setConfirmNote] = useState("");
  const [filter, setFilter] = useState<FilterKey>("action");
  const [search, setSearch] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("transactions")
      .select(
        "id, status, display_currency, display_car_price, display_service_fee, display_total, initiated_at, paid_at, released_at, buyer_id, car_id, payment_method, manual_channel, manual_reference, manual_payer_name, manual_phone, manual_note, handover_ready_at, cars!inner(title, car_images(image_url, is_primary)), sellers!inner(business_name, country, stripe_payouts_enabled)",
      )
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    // fetch buyer profiles
    const buyerIds = [...new Set((data ?? []).map((r) => (r as { buyer_id: string }).buyer_id))];
    const { data: bp } = await supabase
      .from("profiles")
      .select("id, full_name, country")
      .in("id", buyerIds);
    const byId = new Map((bp ?? []).map((p) => [p.id, p]));
    const merged = (data ?? []).map((r) => ({
      ...(r as Record<string, unknown>),
      buyer: byId.get((r as { buyer_id: string }).buyer_id) ?? null,
    }));
    setRows(merged as unknown as Row[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function onRelease(id: string) {
    if (!confirm("Release funds to the seller after verification?")) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await releaseFunds({ data: { accessToken: sess.session.access_token, transactionId: id } });
      toast.success("Funds released");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
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
      setConfirmOpen(null);
      setConfirmRef("");
      setConfirmNote("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function onRefund() {
    if (!refundOpen) return;
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return;
    try {
      await refundPayment({
        data: {
          accessToken: sess.session.access_token,
          transactionId: refundOpen,
          reason: refundReason,
        },
      });
      toast.success("Refund issued");
      setRefundOpen(null);
      setRefundReason("");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // Summaries — sum in USD-equivalent display values (mixed currency display caveat)
  const allCompleted = (rows ?? []).filter((r) =>
    ["funds_released", "completed"].includes(r.status),
  );
  const inEscrow = (rows ?? []).filter((r) => HELD.includes(r.status));
  const disputed = (rows ?? []).filter((r) => r.status === "disputed");
  const awaitingManual = (rows ?? []).filter((r) => r.status === "awaiting_manual_payment");
  const totalFees = allCompleted.reduce((s, r) => s + Number(r.display_service_fee), 0);
  const totalReleased = allCompleted.reduce((s, r) => s + Number(r.display_car_price), 0);
  const totalEscrow = inEscrow.reduce((s, r) => s + Number(r.display_total), 0);
  const needsAction = (rows ?? []).filter((r) => NEEDS_ACTION.includes(r.status));

  const visible = useMemo(() => {
    const all = rows ?? [];
    const inFilter = all.filter((r) => {
      switch (filter) {
        case "action":
          return NEEDS_ACTION.includes(r.status);
        case "manual":
          return r.status === "awaiting_manual_payment";
        case "held":
          return HELD.includes(r.status);
        case "disputed":
          return r.status === "disputed";
        case "done":
          return ["funds_released", "completed", "refunded", "cancelled"].includes(r.status);
        default:
          return true;
      }
    });
    const term = search.trim().toLowerCase();
    const searched = term
      ? inFilter.filter((r) =>
          [
            r.cars?.title,
            r.buyer?.full_name,
            r.sellers?.business_name,
            r.manual_reference,
            r.manual_payer_name,
            r.id,
          ]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
        )
      : inFilter;
    // Queues that need a human read oldest-first; history reads newest-first.
    return filter === "action" || filter === "manual" || filter === "held" || filter === "disputed"
      ? oldestFirst(searched, (r) => r.initiated_at)
      : searched;
  }, [rows, filter, search]);

  const detail = (rows ?? []).find((r) => r.id === detailId) ?? null;

  const actionsFor = (r: Row, opts: { full?: boolean } = {}) => (
    <>
      <Button size="sm" variant="secondary" asChild className={TAP}>
        <Link to="/transactions/$id/invoice" params={{ id: r.id }}>
          <ReceiptText /> Invoice
        </Link>
      </Button>
      {r.status === "awaiting_manual_payment" && (
        <Button
          size="sm"
          className={TAP}
          onClick={() => {
            setDetailId(null);
            setConfirmOpen(r);
          }}
        >
          Confirm payment
        </Button>
      )}
      {HELD.includes(r.status) && (
        <Button size="sm" className={TAP} onClick={() => onRelease(r.id)}>
          Release{opts.full ? " funds" : ""}
        </Button>
      )}
      {REFUNDABLE.includes(r.status) && (
        <Button
          size="sm"
          variant="outline"
          className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
          onClick={() => {
            setDetailId(null);
            setRefundOpen(r.id);
          }}
        >
          Refund
        </Button>
      )}
    </>
  );

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Finance"
        title="Transactions"
        description="Confirm manual payments, track handover, release funds after verification, and handle disputes."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile
          icon={<Coins />}
          label="Fees collected"
          value={fmt(totalFees, "USD")}
          loading={rows === null}
        />
        <StatTile
          icon={<Wallet />}
          label="Held by AutoConnect"
          value={fmt(totalEscrow, "USD")}
          loading={rows === null}
        />
        <StatTile
          icon={<Banknote />}
          label="Released"
          value={fmt(totalReleased, "USD")}
          loading={rows === null}
        />
        <StatTile
          icon={<ShieldAlert />}
          label="Disputes"
          value={String(disputed.length)}
          sub={`${awaitingManual.length} manual payment${awaitingManual.length === 1 ? "" : "s"} to confirm`}
          tone={disputed.length > 0 ? "danger" : "default"}
          loading={rows === null}
        />
      </div>

      <AdminToolbar
        filters={
          <FilterChips
            label="Transaction filters"
            active={filter}
            onSelect={(k) => setFilter(k as FilterKey)}
            options={[
              { key: "action", label: "Needs action", count: needsAction.length },
              { key: "manual", label: "Manual payment", count: awaitingManual.length },
              { key: "held", label: "Held", count: inEscrow.length },
              { key: "disputed", label: "Disputed", count: disputed.length },
              { key: "done", label: "Closed" },
              { key: "all", label: "All", count: rows?.length ?? 0 },
            ]}
          />
        }
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search car, buyer, seller, reference…"
      />

      <AdminPanel>
        {rows === null ? (
          <QueueSkeleton rows={5} media />
        ) : rows.length === 0 ? (
          <QueueEmpty
            icon={<Wallet />}
            title="No transactions yet"
            description="When a buyer pays for a car, the payment appears here for confirmation, handover and release."
          />
        ) : visible.length === 0 ? (
          <QueueEmpty
            icon={<Wallet />}
            title="Nothing in this view"
            description="No transactions match this filter or search."
            action={
              <Button
                variant="outline"
                className={TAP}
                onClick={() => {
                  setFilter("all");
                  setSearch("");
                }}
              >
                Show all transactions
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop: dense table that scrolls inside its own card */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Car</th>
                    <th className="px-3 py-3">Buyer</th>
                    <th className="px-3 py-3">Seller</th>
                    <th className="px-3 py-3">Method</th>
                    <th className="px-3 py-3 text-right">Total</th>
                    <th className="px-3 py-3 text-right">Fee</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((r) => (
                    <tr key={r.id} className="align-top transition hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setDetailId(r.id)}
                          className="flex max-w-[240px] items-center gap-3 text-left"
                        >
                          <CarThumb r={r} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold hover:underline">
                              {r.cars?.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(r.initiated_at).toLocaleDateString()} ·{" "}
                              {ageOf(r.initiated_at)} ago
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        {r.buyer?.full_name ?? "—"}
                        <div className="text-xs text-muted-foreground">
                          {r.buyer?.country ?? ""}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {r.sellers?.business_name ?? "—"}
                        <div className="text-xs text-muted-foreground">{r.sellers?.country}</div>
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <MethodCell r={r} />
                      </td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">
                        {fmt(Number(r.display_total), r.display_currency)}
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {fmt(Number(r.display_service_fee), r.display_currency)}
                      </td>
                      <td className="px-3 py-3">
                        <TxStatus r={r} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">{actionsFor(r)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: cards */}
            <ul className="divide-y divide-border md:hidden">
              {visible.map((r) => (
                <li key={r.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => setDetailId(r.id)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <CarThumb r={r} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.cars?.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {r.buyer?.full_name ?? "—"} → {r.sellers?.business_name ?? "—"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold tabular-nums">
                          {fmt(Number(r.display_total), r.display_currency)}
                        </span>
                        <TxStatus r={r} />
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                  <div className="mt-3 flex flex-wrap gap-2">{actionsFor(r)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </AdminPanel>

      {/* Detail sheet */}
      <DetailSheet
        open={!!detail}
        onOpenChange={(o) => {
          if (!o) setDetailId(null);
        }}
        kicker="Transaction"
        title={detail?.cars?.title ?? "Transaction"}
        footer={detail ? actionsFor(detail, { full: true }) : undefined}
      >
        {detail && (
          <div className="space-y-5">
            <TxStatus r={detail} />
            <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
              {detail.cars?.car_images[0]?.image_url ? (
                <img
                  src={detail.cars.car_images[0].image_url}
                  className="h-full w-full object-cover"
                  alt={detail.cars?.title ?? "Car"}
                />
              ) : (
                <div className="grid h-full place-items-center text-muted-foreground">
                  <Car className="h-8 w-8" />
                </div>
              )}
            </div>
            <section>
              <p className="brand-kicker mb-1 text-muted-foreground">Money</p>
              <dl>
                <KV
                  label="Total"
                  value={fmt(Number(detail.display_total), detail.display_currency)}
                />
                <KV
                  label="Car price"
                  value={fmt(Number(detail.display_car_price), detail.display_currency)}
                />
                <KV
                  label="Service fee"
                  value={fmt(Number(detail.display_service_fee), detail.display_currency)}
                />
              </dl>
            </section>
            <section>
              <p className="brand-kicker mb-1 text-muted-foreground">People</p>
              <dl>
                <KV
                  label="Buyer"
                  value={[detail.buyer?.full_name, detail.buyer?.country]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <KV
                  label="Seller"
                  value={[detail.sellers?.business_name, detail.sellers?.country]
                    .filter(Boolean)
                    .join(" · ")}
                />
                <KV
                  label="Seller payouts"
                  value={
                    detail.sellers?.stripe_payouts_enabled ? "Stripe payouts on" : "Not set up"
                  }
                />
              </dl>
            </section>
            <section>
              <p className="brand-kicker mb-1 text-muted-foreground">Payment</p>
              <dl>
                <KV
                  label="Method"
                  value={
                    detail.payment_method === "manual"
                      ? detail.manual_channel === "mpesa"
                        ? "M-Pesa"
                        : "Bank transfer"
                      : "Card (Stripe)"
                  }
                />
                {detail.payment_method === "manual" && (
                  <>
                    <KV label="Payer" value={detail.manual_payer_name} />
                    <KV label="Phone" value={detail.manual_phone} />
                    <KV
                      label="Reference"
                      value={
                        detail.manual_reference ? (
                          <span className="font-mono text-xs">{detail.manual_reference}</span>
                        ) : null
                      }
                    />
                    <KV label="Note" value={detail.manual_note} />
                  </>
                )}
              </dl>
            </section>
            <section>
              <p className="brand-kicker mb-1 text-muted-foreground">Timeline</p>
              <dl>
                <KV label="Started" value={new Date(detail.initiated_at).toLocaleString()} />
                <KV
                  label="Paid"
                  value={detail.paid_at ? new Date(detail.paid_at).toLocaleString() : null}
                />
                <KV
                  label="Handover ready"
                  value={
                    detail.handover_ready_at
                      ? new Date(detail.handover_ready_at).toLocaleString()
                      : null
                  }
                />
                <KV
                  label="Released"
                  value={detail.released_at ? new Date(detail.released_at).toLocaleString() : null}
                />
                <KV
                  label="Reference ID"
                  value={<span className="font-mono text-xs">{detail.id}</span>}
                />
              </dl>
            </section>
          </div>
        )}
      </DetailSheet>

      <Dialog
        open={!!refundOpen}
        onOpenChange={(o) => {
          if (!o) setRefundOpen(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue refund</DialogTitle>
            <DialogDescription>
              Returns the payment to the buyer and re-opens the listing. Card payments are reversed
              via Stripe; M-Pesa and bank payments must be returned manually.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
            placeholder="Reason for refund (sent to both parties)"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className={TAP} onClick={() => setRefundOpen(null)}>
              Cancel
            </Button>
            <Button
              disabled={refundReason.trim().length < 3}
              onClick={onRefund}
              className={`${TAP} bg-destructive hover:bg-destructive/90`}
            >
              Issue refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!confirmOpen}
        onOpenChange={(o) => {
          if (!o) setConfirmOpen(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm manual payment</DialogTitle>
            <DialogDescription>
              Only confirm after the funds are visible in the AutoConnect account. The car becomes
              Under Transaction and the seller is told to prepare handover.
            </DialogDescription>
          </DialogHeader>
          {confirmOpen && (
            <div className="space-y-1 rounded-2xl border bg-muted/30 p-3 text-xs">
              <p>
                <span className="text-muted-foreground">Channel:</span>{" "}
                {confirmOpen.manual_channel === "mpesa" ? "M-Pesa" : "Bank transfer"}
              </p>
              <p>
                <span className="text-muted-foreground">Payer:</span>{" "}
                {confirmOpen.manual_payer_name ?? "—"} · {confirmOpen.manual_phone ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Buyer reference:</span>{" "}
                {confirmOpen.manual_reference ?? "—"}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span>{" "}
                {fmt(Number(confirmOpen.display_total), confirmOpen.display_currency)}
              </p>
              {confirmOpen.manual_note && (
                <p>
                  <span className="text-muted-foreground">Note:</span> {confirmOpen.manual_note}
                </p>
              )}
            </div>
          )}
          <Input
            value={confirmRef}
            onChange={(e) => setConfirmRef(e.target.value)}
            placeholder="Confirmed reference / receipt number"
          />
          <Textarea
            rows={3}
            value={confirmNote}
            onChange={(e) => setConfirmNote(e.target.value)}
            placeholder="Internal note (optional)"
          />
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" className={TAP} onClick={() => setConfirmOpen(null)}>
              Cancel
            </Button>
            <Button className={TAP} onClick={onConfirmManual}>
              Confirm payment received
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function CarThumb({ r }: { r: Row }) {
  return (
    <div className="aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
      {r.cars?.car_images[0]?.image_url ? (
        <img
          src={r.cars.car_images[0].image_url}
          className="h-full w-full object-cover"
          alt=""
          loading="lazy"
        />
      ) : (
        <div className="grid h-full place-items-center text-muted-foreground">
          <Car className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function MethodCell({ r }: { r: Row }) {
  if (r.payment_method !== "manual") {
    return <span className="text-muted-foreground">Card (Stripe)</span>;
  }
  return (
    <>
      <span className="font-medium">
        {r.manual_channel === "mpesa" ? "M-Pesa" : "Bank transfer"}
      </span>
      <div className="text-muted-foreground">{r.manual_payer_name ?? "—"}</div>
      {r.manual_reference && (
        <div className="font-mono text-[10px] text-muted-foreground">{r.manual_reference}</div>
      )}
    </>
  );
}

/** Transaction status using the shared StatusPill (aliases keep tones consistent). */
const TX_ALIAS: Record<string, { status: string; label?: string }> = {
  pending: { status: "draft", label: "Pending" },
  admin_reviewing: { status: "under_review", label: "Admin reviewing" },
  funds_released: { status: "released" },
};

function TxStatus({ r }: { r: Row }) {
  const alias = TX_ALIAS[r.status];
  return (
    <div className="inline-flex flex-col items-start gap-1">
      <StatusPill status={alias?.status ?? r.status} label={alias?.label} />
      {r.status === "payment_received" && (
        <span className="text-[11px] text-muted-foreground">
          {r.handover_ready_at ? "Handover ready" : "Seller preparing handover"}
        </span>
      )}
    </div>
  );
}
