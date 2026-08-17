import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wrench, Loader2, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller/inspections")({
  component: SellerInspections,
});

type Row = {
  id: string;
  status: string;
  scheduled_date: string | null;
  mechanic_verdict: string | null;
  admin_approved: boolean | null;
  created_at: string;
  cars: { id: string; title: string } | null;
};

function SellerInspections() {
  const [rows, setRows] = useState<Row[]>([]);
  const [cars, setCars] = useState<{ id: string; title: string; status: string }[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: s } = await supabase.from("sellers").select("id").eq("profile_id", u.user.id).maybeSingle();
    if (!s) { setLoading(false); return; }
    setSellerId(s.id);
    const [{ data: insp }, { data: c }] = await Promise.all([
      supabase.from("inspections").select("id,status,scheduled_date,mechanic_verdict,admin_approved,created_at,cars(id,title)").eq("seller_id", s.id).order("created_at", { ascending: false }),
      supabase.from("cars").select("id,title,status").eq("seller_id", s.id).in("status", ["pending", "approved"]),
    ]);
    setRows((insp ?? []) as unknown as Row[]);
    setCars(c ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function requestInspection(carId: string) {
    if (!sellerId) return;
    setRequesting(carId);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("inspections").insert({
      car_id: carId,
      seller_id: sellerId,
      status: "pending",
      requested_by: u.user?.id ?? null,
    });
    setRequesting(null);
    if (error) { toast.error(error.message); return; }
    toast.success("Inspection requested — admin will assign a mechanic");
    load();
  }

  const requestable = cars.filter((c) => !rows.some((r) => r.cars?.id === c.id && !["cancelled", "no_show"].includes(r.status)));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>
        <p className="text-sm text-muted-foreground">Independent mechanical inspection increases buyer trust.</p>
      </header>

      {requestable.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Request an inspection</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {requestable.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{c.title}</span>
                <Button size="sm" variant="secondary" disabled={requesting === c.id} onClick={() => requestInspection(c.id)}>
                  {requesting === c.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Wrench className="mr-1.5 h-3.5 w-3.5" />}
                  Request inspection
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Your inspections</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-6 text-center text-sm text-muted-foreground"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No inspections yet.</p>
          ) : (
            <ul className="divide-y">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <Link to="/cars/$id" params={{ id: r.cars?.id ?? "" }} className="font-medium hover:underline">
                      {r.cars?.title ?? "Car"}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.scheduled_date ? `Scheduled ${r.scheduled_date}` : "Awaiting scheduling"}
                      {r.mechanic_verdict && ` · Verdict: ${r.mechanic_verdict}`}
                    </div>
                  </div>
                  <StatusBadge status={r.status} approved={r.admin_approved} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status, approved }: { status: string; approved: boolean | null }) {
  if (approved) return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="mr-1 h-3 w-3" /> Approved</Badge>;
  if (status === "completed") return <Badge variant="secondary">Awaiting admin review</Badge>;
  if (status === "scheduled" || status === "in_progress") return <Badge variant="outline"><Clock className="mr-1 h-3 w-3" /> {status}</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}
