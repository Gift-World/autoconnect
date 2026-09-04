import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Receipt, Printer, ShieldCheck, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DigitalReceiptModal, type TransactionReceiptData } from "@/components/payments/DigitalReceiptModal";

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

function fmt(a: number, c: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: c, maximumFractionDigits: 0 }).format(a); }
  catch { return `${c} ${a.toLocaleString()}`; }
}

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
            .select("id, status, display_currency, display_total, initiated_at, cars!inner(title, car_images(image_url, is_primary))")
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
              car_images: [{ image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80", is_primary: true }],
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
      buyerName: profile?.full_name || user?.email?.split("@")[0] || "Alice Mwangi",
      buyerPhone: profile?.phone || "+254 712 345 678",
      sellerName: "AutoConnect Verified Yard (Nairobi Hub)",
      sellerLocation: "Karen, Nairobi, Kenya",
      amount: Number(r.display_total),
      currency: r.display_currency || "KES",
      paymentMethod: "M-Pesa / Bank Escrow",
      paymentPlan: "Full Escrow Deposit",
      timestamp: new Date(r.initiated_at).toLocaleString(),
      escrowStatus: "Funds Held in Neutral Escrow",
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Purchases & Transactions</h1>
        <p className="text-sm text-muted-foreground">Track payment, escrow milestones, and official proof of purchase receipts.</p>
      </header>

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border bg-card p-10 text-center space-y-2">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold">You haven't made any escrow purchases yet.</p>
          <Link to="/cars" className="inline-block text-xs font-bold text-teal-400 hover:underline">Browse Verified Cars →</Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => {
            const img = r.cars?.car_images.find((i) => i.is_primary)?.image_url ?? r.cars?.car_images[0]?.image_url;
            return (
              <li key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-16 w-24 overflow-hidden rounded-xl bg-muted shrink-0 border border-border">
                    {img && <img src={img} alt={r.cars?.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-foreground text-sm">{r.cars?.title}</p>
                    <p className="text-xs text-muted-foreground font-mono">Ref: {r.id} · {new Date(r.initiated_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/80">
                  <div className="text-left sm:text-right">
                    <p className="font-mono font-bold text-teal-400">{fmt(Number(r.display_total), r.display_currency)}</p>
                    <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-300 border-teal-500/20">{r.status.replace("_", " ")}</Badge>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenReceipt(r)}
                    className="h-9 rounded-xl text-xs gap-1.5 border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>Digital Receipt</span>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
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
