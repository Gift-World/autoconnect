import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Gavel, XCircle, Ban, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

type One<T> = T | T[] | null;
type AuctionRow = {
  id: string;
  sale_mode: string;
  starts_at: string | null;
  ends_at: string;
  reserve_price: number | null;
  current_bid: number | null;
  bid_count: number;
  status: string;
  approval_status: string;
  approval_note: string | null;
  cars: One<{ title: string | null }>;
  sellers: One<{ business_name: string | null }>;
};

export const Route = createFileRoute("/_authenticated/admin/auctions")({
  component: AdminAuctions,
});

function AdminAuctions() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-auctions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_auctions")
        .select(
          "id,sale_mode,starts_at,ends_at,reserve_price,current_bid,bid_count,status,approval_status,approval_note,cars(title),sellers(business_name)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AuctionRow[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-auctions"] });
  const decide = async (auction: AuctionRow, approval_status: "approved" | "rejected") => {
    const approval_note =
      approval_status === "rejected"
        ? window.prompt("Reason for rejection (shown to the seller):")
        : "";
    if (approval_status === "rejected" && approval_note === null) return;
    const { error } = await supabase
      .from("vehicle_auctions")
      .update({
        approval_status,
        approval_note: approval_note || null,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", auction.id);
    if (error) return toast.error(error.message);
    toast.success(approval_status === "approved" ? "Auction approved" : "Auction rejected");
    refresh();
  };
  const cancel = async (auction: AuctionRow) => {
    const reason = window.prompt("Cancellation reason (required):");
    if (!reason) return;
    const { error } = await supabase
      .from("vehicle_auctions")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_by: (await supabase.auth.getUser()).data.user?.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", auction.id);
    if (error) return toast.error(error.message);
    toast.success("Auction cancelled");
    refresh();
  };
  const expireReservations = async () => {
    const { data, error } = await supabase.rpc("expire_due_auction_reservations");
    if (error) return toast.error(error.message);
    toast.success(`${data || 0} expired reservations processed`);
  };

  const rows = data ?? [];
  const carTitle = (a: AuctionRow) =>
    (Array.isArray(a.cars) ? a.cars[0] : a.cars)?.title || "Vehicle offer";
  const sellerName = (a: AuctionRow) =>
    (Array.isArray(a.sellers) ? a.sellers[0] : a.sellers)?.business_name || "Seller";
  const pendingRows = rows.filter((a) => a.approval_status === "pending");
  const term = search.trim().toLowerCase();
  const inFilter =
    filter === "pending"
      ? [...pendingRows].reverse() // oldest submission first
      : filter === "live"
        ? rows.filter((a) => a.approval_status === "approved" && a.status !== "cancelled")
        : filter === "cancelled"
          ? rows.filter((a) => a.status === "cancelled")
          : rows;
  const visible = term
    ? inFilter.filter((a) => `${carTitle(a)} ${sellerName(a)}`.toLowerCase().includes(term))
    : inFilter;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Marketplace governance"
        title="Auction review queue"
        description="Approve only reviewed auctions. Cancellation and reservation expiry are recorded for support and audit."
        actions={
          <Button variant="outline" className={TAP} onClick={expireReservations}>
            <TimerReset className="h-4 w-4" /> Process expired reservations
          </Button>
        }
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Auction filters"
            active={filter}
            onSelect={setFilter}
            options={[
              { key: "pending", label: "Awaiting review", count: pendingRows.length },
              {
                key: "live",
                label: "Approved",
                count: rows.filter(
                  (a) => a.approval_status === "approved" && a.status !== "cancelled",
                ).length,
              },
              {
                key: "cancelled",
                label: "Cancelled",
                count: rows.filter((a) => a.status === "cancelled").length,
              },
              { key: "all", label: "All", count: rows.length },
            ]}
          />
        }
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search vehicle or seller…"
      />

      {isError ? (
        <QueueError>Auction queue could not load. This is not an empty result.</QueueError>
      ) : (
        <AdminPanel>
          {isLoading ? (
            <QueueSkeleton rows={4} />
          ) : visible.length ? (
            <ul className="divide-y divide-border">
              {visible.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:px-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ac-apricot text-ac-ink">
                      <Gavel className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{carTitle(a)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sellerName(a)} · {a.sale_mode.replaceAll("_", " ")} · ends{" "}
                        {new Date(a.ends_at).toLocaleString()}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <StatusPill
                          status={a.approval_status}
                          label={`${String(a.approval_status).replaceAll("_", " ")} review`}
                          className="capitalize"
                        />
                        <StatusPill
                          status={a.status === "cancelled" ? "cancelled" : "draft"}
                          label={String(a.status).replaceAll("_", " ")}
                          className="capitalize"
                        />
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {a.bid_count} bids
                        </span>
                      </div>
                      {a.approval_note && (
                        <p className="mt-2 text-xs text-destructive">{a.approval_note}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {a.approval_status === "pending" && (
                      <>
                        <Button size="sm" className={TAP} onClick={() => decide(a, "approved")}>
                          <CheckCircle2 className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className={TAP}
                          onClick={() => decide(a, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {a.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                        onClick={() => cancel(a)}
                      >
                        <Ban className="h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <QueueEmpty
              icon={<Gavel />}
              title={filter === "pending" ? "No auctions are awaiting review." : "Nothing here"}
              description={
                filter === "pending"
                  ? "Seller auction requests appear here, oldest first."
                  : "No auctions match this filter or search."
              }
            />
          )}
        </AdminPanel>
      )}
    </AdminPage>
  );
}
