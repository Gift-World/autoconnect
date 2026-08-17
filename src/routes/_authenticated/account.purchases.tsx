import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Receipt } from "lucide-react";

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
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("transactions")
        .select("id, status, display_currency, display_total, initiated_at, cars!inner(title, car_images(image_url, is_primary))")
        .eq("buyer_id", u.user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as unknown as Row[]);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">My purchases</h1>
        <p className="text-sm text-muted-foreground">Track payment, escrow, and delivery for cars you've bought.</p>
      </header>

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <Receipt className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You haven't purchased any cars yet.</p>
          <Link to="/cars" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">Browse cars →</Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => {
            const img = r.cars?.car_images.find((i) => i.is_primary)?.image_url ?? r.cars?.car_images[0]?.image_url;
            return (
              <li key={r.id}>
                <Link to="/transactions/$id" params={{ id: r.id }} className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
                  <div className="h-16 w-24 overflow-hidden rounded bg-muted">
                    {img && <img src={img} alt={r.cars?.title} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.cars?.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(r.initiated_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmt(Number(r.display_total), r.display_currency)}</p>
                    <Badge variant="outline" className="mt-1">{r.status.replace("_", " ")}</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
