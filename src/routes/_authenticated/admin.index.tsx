import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Car, Inbox, Eye, CheckCircle2, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AutoConnect" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [sellersTotal, sellersPending, carsTotal, carsPending, carsApproved, importsOpen, viewsAgg] =
        await Promise.all([
          supabase.from("sellers").select("id", { count: "exact", head: true }),
          supabase.from("sellers").select("id", { count: "exact", head: true }).eq("is_approved", false),
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("cars").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("cars").select("id", { count: "exact", head: true }).eq("status", "approved"),
          supabase.from("import_requests").select("id", { count: "exact", head: true }).eq("status", "open"),
          supabase.from("cars").select("views"),
        ]);
      const totalViews = (viewsAgg.data ?? []).reduce((s, r) => s + (r.views ?? 0), 0);
      return {
        sellersTotal: sellersTotal.count ?? 0,
        sellersPending: sellersPending.count ?? 0,
        carsTotal: carsTotal.count ?? 0,
        carsPending: carsPending.count ?? 0,
        carsApproved: carsApproved.count ?? 0,
        importsOpen: importsOpen.count ?? 0,
        totalViews,
      };
    },
  });

  const breakdown = useQuery({
    queryKey: ["admin-country-breakdown"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cars")
        .select("country")
        .eq("status", "approved");
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => {
        const c = r.country;
        if (!c) return;
        counts.set(c, (counts.get(c) ?? 0) + 1);
      });
      return Array.from(counts.entries())
        .map(([code, count]) => {
          const meta = countryByCode(code);
          return { code, name: meta ? `${meta.flag} ${meta.name}` : code, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
    },
  });

  const s = stats.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of the marketplace.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Users className="h-5 w-5" />} label="Sellers" value={s?.sellersTotal ?? 0} sub={`${s?.sellersPending ?? 0} pending`} />
        <Stat icon={<Car className="h-5 w-5" />} label="Listings" value={s?.carsTotal ?? 0} sub={`${s?.carsApproved ?? 0} approved`} />
        <Stat icon={<Clock className="h-5 w-5" />} label="Pending review" value={s?.carsPending ?? 0} accent="warning" />
        <Stat icon={<Eye className="h-5 w-5" />} label="Total views" value={(s?.totalViews ?? 0).toLocaleString()} />
        <Stat icon={<Inbox className="h-5 w-5" />} label="Open imports" value={s?.importsOpen ?? 0} accent="accent" />
        <Stat icon={<CheckCircle2 className="h-5 w-5" />} label="Approved cars" value={s?.carsApproved ?? 0} accent="success" />
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Approved listings by country</h2>
        <p className="mt-1 text-sm text-muted-foreground">Top markets, live data.</p>
        <div className="mt-6 h-80">
          {breakdown.isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (breakdown.data?.length ?? 0) === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No approved listings yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown.data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} height={70} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: "success" | "warning" | "accent";
}) {
  const tone =
    accent === "success"
      ? "bg-success/10 text-success"
      : accent === "warning"
        ? "bg-warning/10 text-warning"
        : accent === "accent"
          ? "bg-accent/10 text-accent"
          : "bg-primary/10 text-primary";
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${tone}`}>
          {icon}
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
