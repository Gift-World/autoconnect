import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Car, CheckCircle2, Clock, Receipt, Search, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DigitalReceiptModal,
  type TransactionReceiptData,
} from "@/components/payments/DigitalReceiptModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { VehicleImage } from "@/components/VehicleImage";
import {
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton, formatMoney } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/account/purchases")({
  component: Purchases,
});

type Row = {
  id: string;
  status: string;
  display_currency: string;
  display_total: number;
  initiated_at: string;
  cars: { title: string; car_images: { image_url: string; is_primary: boolean }[] } | null;
};

const fmt = formatMoney;
const DONE = ["completed", "escrow_released", "funds_released", "released"];

function Purchases() {
  const { user, profile } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionReceiptData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        const userId = u.user?.id || user?.id;
        if (userId) {
          const { data } = await supabase
            .from("transactions")
            .select(
              "id, status, display_currency, display_total, initiated_at, cars!inner(title, car_images(image_url, is_primary))",
            )
            .eq("buyer_id", userId)
            .order("created_at", { ascending: false });
          if (data && data.length > 0) {
            setRows(data as unknown as Row[]);
            return;
          }
        }
      } catch {
        // fallback
      }

      // Demo fallback when exploring Buyer persona
      if (user?.id?.startsWith("demo-")) {
        setRows([
          {
            id: "AC-ESC-892014",
            status: "escrow_secured",
            display_currency: "KES",
            display_total: 7822500,
            initiated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
            cars: {
              title: "2022 Toyota Land Cruiser Prado TX-L",
              car_images: [
                {
                  image_url:
                    "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80",
                  is_primary: true,
                },
              ],
            },
          },
        ]);
        return;
      }

      setRows([]);
    })();
  }, [user?.id]);

  const handleOpenReceipt = (r: Row) => {
    setSelectedReceipt({
      transactionId: r.id,
      carTitle: r.cars?.title || "Vehicle Purchase",
      buyerName: profile?.full_name || user?.email?.split("@")[0] || "Buyer",
      buyerPhone: profile?.phone || "Not recorded",
      sellerName: "AutoConnect marketplace seller",
      sellerLocation: "See transaction record",
      amount: Number(r.display_total),
      currency: r.display_currency || "KES",
      paymentMethod: "Recorded after payment confirmation",
      paymentPlan: "Transaction record",
      timestamp: new Date(r.initiated_at).toLocaleString(),
      escrowStatus: r.status,
    });
  };

  const list = rows ?? [];
  const inProgress = list.filter((r) => !DONE.includes(r.status));
  const done = list.filter((r) => DONE.includes(r.status));

  const renderRow = (r: Row) => {
    const img =
      r.cars?.car_images.find((i) => i.is_primary)?.image_url ?? r.cars?.car_images[0]?.image_url;
    return (
      <li
        key={r.id}
        className="overflow-hidden rounded-3xl border border-border bg-card transition hover:border-ac-accent/40"
      >
        <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="aspect-[16/10] bg-muted md:aspect-auto md:h-full">
            <VehicleImage src={img} alt={r.cars?.title ?? "Purchased vehicle"} />
          </div>
          <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-foreground">{r.cars?.title}</p>
                <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">
                  Ref: {r.id} · {new Date(r.initiated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-brand text-2xl">
                  {fmt(Number(r.display_total), r.display_currency)}
                </p>
                <StatusPill
                  status={r.status}
                  label={r.status.replace("_", " ")}
                  className="mt-1 capitalize"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="font-semibold text-foreground">Transaction progress</span>
                <span className="text-muted-foreground">Vehicle handover</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-ac-accent"
                  style={{ width: r.status === "escrow_secured" ? "30%" : "100%" }}
                ></div>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="mr-1 inline h-3 w-3 text-ac-accent" />
                Status is shown from the transaction record. Payment protection terms are confirmed
                only where evidence is available.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Link
                to="/transactions/$id"
                params={{ id: r.id }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-ac-ink px-4 text-sm font-bold text-white transition hover:bg-ac-ink-soft sm:flex-none dark:bg-white dark:text-ac-ink"
              >
                Track payment
              </Link>
              <button
                type="button"
                onClick={() => handleOpenReceipt(r)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted sm:flex-none"
              >
                <Receipt className="h-4 w-4" />
                <span>Digital Receipt</span>
              </button>
              {["completed", "escrow_released", "escrow_secured"].includes(r.status) && (
                <Link
                  to="/garage"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted sm:flex-none"
                >
                  <Car className="h-4 w-4" />
                  <span>View in Garage</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ownership records"
        title="Purchases & receipts"
        description="Track confirmed transaction records and keep your ownership paperwork in one place."
        actions={
          <Link to="/cars" className={primaryButton}>
            <Search className="h-4 w-4" /> Browse Verified Cars
          </Link>
        }
      />

      <StatRow className="lg:grid-cols-3">
        <StatTile label="In progress" value={inProgress.length} icon={<Clock />} tone="ink" loading={rows === null} />
        <StatTile label="Completed" value={done.length} icon={<CheckCircle2 />} loading={rows === null} />
        <StatTile label="Receipts on file" value={list.length} icon={<Receipt />} loading={rows === null} />
      </StatRow>

      {rows === null ? (
        <ListSkeleton rows={2} className="h-56" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Receipt className="h-5 w-5" />}
          title="You don't have any confirmed purchases yet."
          description="When you pay for a car through AutoConnect, the payment timeline and receipt live here."
          actionLabel="Browse Verified Cars"
          actionTo="/cars"
        />
      ) : (
        <>
          {inProgress.length > 0 && (
            <section>
              <SectionHeading kicker="Happening now" title="In progress" />
              <ul className="grid gap-3">{inProgress.map(renderRow)}</ul>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <SectionHeading kicker="History" title="Completed purchases" />
              <ul className="grid gap-3">{done.map(renderRow)}</ul>
            </section>
          )}
        </>
      )}

      {selectedReceipt && (
        <DigitalReceiptModal
          open={!!selectedReceipt}
          onOpenChange={(open) => !open && setSelectedReceipt(null)}
          receipt={selectedReceipt}
        />
      )}
    </div>
  );
}
