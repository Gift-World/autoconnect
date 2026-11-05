import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wrench, Loader2, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { EmptyPanel, ListSkeleton, Panel, StatTile } from "@/components/seller/SellerUI";

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
    const { data: s } = await supabase
      .from("sellers")
      .select("id")
      .eq("profile_id", u.user.id)
      .maybeSingle();
    if (!s) {
      setLoading(false);
      return;
    }
    setSellerId(s.id);
    const [{ data: insp }, { data: c }] = await Promise.all([
      supabase
        .from("inspections")
        .select(
          "id,status,scheduled_date,mechanic_verdict,admin_approved,created_at,cars(id,title)",
        )
        .eq("seller_id", s.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("cars")
        .select("id,title,status")
        .eq("seller_id", s.id)
        .in("status", ["pending", "approved"]),
    ]);
    setRows((insp ?? []) as unknown as Row[]);
    setCars(c ?? []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

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
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Inspection requested — admin will assign a mechanic");
    load();
  }

  const requestable = cars.filter(
    (c) => !rows.some((r) => r.cars?.id === c.id && !["cancelled", "no_show"].includes(r.status)),
  );
  const approvedCount = rows.filter((r) => r.admin_approved).length;
  const inFlight = rows.filter((r) => !r.admin_approved && r.status !== "completed").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Trust"
        title="Inspections"
        description="Independent mechanical inspection increases buyer trust."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          featured
          icon={<Wrench />}
          label="Ready to request"
          value={requestable.length}
          sub="Listings without an inspection"
          loading={loading}
        />
        <StatTile
          icon={<Clock />}
          tone="warning"
          label="In progress"
          value={inFlight}
          sub="Requested or scheduled"
          loading={loading}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            icon={<CheckCircle2 />}
            tone="success"
            label="Approved"
            value={approvedCount}
            sub="Shown to buyers"
            loading={loading}
          />
        </div>
      </div>

      {requestable.length > 0 && (
        <Panel
          kicker="Needs your attention"
          title="Request an inspection"
          description="An admin assigns a mechanic once you request."
          className="border-ac-accent/40"
        >
          <ul className="space-y-2">
            {requestable.map((c) => (
              <li
                key={c.id}
                className="flex flex-col gap-3 rounded-2xl bg-ac-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.title}</p>
                  <div className="mt-1">
                    <StatusPill status={c.status} />
                  </div>
                </div>
                <Button
                  className="h-11 shrink-0 rounded-full bg-ac-ink px-5 text-white hover:bg-ac-ink/90 dark:bg-ac-accent dark:text-ac-ink"
                  disabled={requesting === c.id}
                  onClick={() => requestInspection(c.id)}
                >
                  {requesting === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wrench className="h-4 w-4" />
                  )}
                  Request inspection
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel kicker="History" title="Your inspections">
        {loading ? (
          <ListSkeleton rows={3} />
        ) : rows.length === 0 ? (
          <EmptyPanel
            icon={<Wrench />}
            title="No inspections yet"
            description={
              requestable.length > 0
                ? "Request one above — inspected cars earn more buyer trust."
                : "Once you have a pending or live listing, you can request an inspection here."
            }
            action={
              requestable.length === 0 ? (
                <Button asChild className="h-11 rounded-full">
                  <Link to="/seller/listings/new" search={{ edit: undefined }}>
                    Create a listing
                  </Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    to="/cars/$id"
                    params={{ id: r.cars?.id ?? "" }}
                    className="font-semibold hover:underline"
                  >
                    {r.cars?.title ?? "Car"}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {r.scheduled_date ? `Scheduled ${r.scheduled_date}` : "Awaiting scheduling"}
                    {r.mechanic_verdict && ` · Verdict: ${r.mechanic_verdict}`}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={r.status} approved={r.admin_approved} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function StatusBadge({ status, approved }: { status: string; approved: boolean | null }) {
  if (approved)
    return (
      <Badge className="bg-success text-success-foreground">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Approved
      </Badge>
    );
  if (status === "completed") return <Badge variant="secondary">Awaiting admin review</Badge>;
  if (status === "scheduled" || status === "in_progress")
    return (
      <Badge variant="outline">
        <Clock className="mr-1 h-3 w-3" /> {status}
      </Badge>
    );
  return <Badge variant="outline">{status}</Badge>;
}
