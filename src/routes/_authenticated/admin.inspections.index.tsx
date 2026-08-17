import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wrench } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inspections/")({
  component: AdminInspections,
});

type Row = {
  id: string;
  status: string;
  scheduled_date: string | null;
  mechanic_verdict: string | null;
  admin_approved: boolean | null;
  created_at: string;
  cars: { id: string; title: string } | null;
  sellers: { business_name: string | null } | null;
};

function AdminInspections() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("inspections")
      .select("id,status,scheduled_date,mechanic_verdict,admin_approved,created_at,cars(id,title),sellers(business_name)")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Row[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Inspections queue</h1>
        <p className="text-sm text-muted-foreground">Assign mechanics, fill reports, and approve completed inspections.</p>
      </header>
      <Card>
        <CardHeader><CardTitle className="text-base">All inspections</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing here yet.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-3.5 w-3.5 text-muted-foreground" />
                      <Link to="/cars/$id" params={{ id: r.cars?.id ?? "" }} className="truncate font-medium hover:underline">
                        {r.cars?.title ?? "Car"}
                      </Link>
                      <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      {r.admin_approved && <Badge className="bg-success text-success-foreground text-[10px]">Approved</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.sellers?.business_name ?? "—"}
                      {r.scheduled_date && ` · ${r.scheduled_date}`}
                      {r.mechanic_verdict && ` · Verdict: ${r.mechanic_verdict}`}
                    </div>
                  </div>
                  <Button size="sm" asChild>
                    <Link to="/admin/inspections/$id" params={{ id: r.id }}>Open</Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
