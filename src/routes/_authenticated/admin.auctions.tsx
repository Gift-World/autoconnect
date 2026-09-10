import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Gavel, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/admin/auctions")({ component: AdminAuctions });

function AdminAuctions() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["admin-auctions"], queryFn: async () => {
    const { data, error } = await supabase.from("vehicle_auctions").select("id,sale_mode,starts_at,ends_at,reserve_price,current_bid,bid_count,status,approval_status,approval_note,cars(title),sellers(business_name)").order("created_at", { ascending: false });
    if (error) throw error; return (data ?? []) as any[];
  }});
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-auctions"] });
  const decide = async (auction: any, approval_status: "approved" | "rejected") => {
    const approval_note = approval_status === "rejected" ? window.prompt("Reason for rejection (shown to the seller):") : "";
    if (approval_status === "rejected" && approval_note === null) return;
    const { error } = await supabase.from("vehicle_auctions").update({ approval_status, approval_note: approval_note || null, reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString() }).eq("id", auction.id);
    if (error) return toast.error(error.message);
    toast.success(approval_status === "approved" ? "Auction approved" : "Auction rejected"); refresh();
  };
  const cancel = async (auction: any) => {
    const reason = window.prompt("Cancellation reason (required):"); if (!reason) return;
    const { error } = await supabase.from("vehicle_auctions").update({ status: "cancelled", cancellation_reason: reason, cancelled_by: (await supabase.auth.getUser()).data.user?.id, cancelled_at: new Date().toISOString() }).eq("id", auction.id);
    if (error) return toast.error(error.message); toast.success("Auction cancelled"); refresh();
  };
  const expireReservations = async () => { const { data, error } = await supabase.rpc("expire_due_auction_reservations"); if (error) return toast.error(error.message); toast.success(`${data || 0} expired reservations processed`); };
  const rows = data ?? [];
  return <div className="space-y-6"><PageHeader eyebrow="Marketplace governance" title="Auction review queue" description="Approve only reviewed auctions. Cancellation and reservation expiry are recorded for support and audit." actions={<Button variant="outline" className="rounded-xl" onClick={expireReservations}>Process expired reservations</Button>}/>{isLoading ? <p className="text-sm text-muted-foreground">Loading auctions…</p> : isError ? <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">Auction queue could not load. This is not an empty result.</div> : <div className="overflow-hidden rounded-2xl border bg-card">{rows.length ? rows.map((a) => <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5 last:border-0" key={a.id}><div><p className="font-semibold">{(Array.isArray(a.cars) ? a.cars[0] : a.cars)?.title || "Vehicle offer"}</p><p className="mt-1 text-xs text-muted-foreground">{(Array.isArray(a.sellers) ? a.sellers[0] : a.sellers)?.business_name || "Seller"} · {a.sale_mode.replaceAll("_", " ")} · ends {new Date(a.ends_at).toLocaleString()}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{a.approval_status} review · {a.status} · {a.bid_count} bids</p>{a.approval_note && <p className="mt-2 text-xs text-destructive">{a.approval_note}</p>}</div><div className="flex flex-wrap gap-2">{a.approval_status === "pending" && <><Button size="sm" onClick={() => decide(a,"approved")}><CheckCircle2 className="mr-1 h-4 w-4"/>Approve</Button><Button size="sm" variant="outline" onClick={() => decide(a,"rejected")}><XCircle className="mr-1 h-4 w-4"/>Reject</Button></>} {a.status !== "cancelled" && <Button size="sm" variant="destructive" onClick={() => cancel(a)}>Cancel</Button>}</div></div>) : <div className="p-8 text-center text-sm text-muted-foreground"><Gavel className="mx-auto mb-3 h-6 w-6"/>No auctions are awaiting review.</div>}</div>}</div>;
}
