import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Car,
  Inbox,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  FileText,
  FileCheck2,
  Gavel,
  Wrench,
  Store,
  Banknote,
  ShieldAlert,
  Wallet,
  PartyPopper,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { countryByCode } from "@/lib/countries";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminPage,
  AdminPanel,
  QueueEmpty,
  QueueError,
  QueueTile,
  StatTile,
  ageOf,
} from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — AutoConnect" }] }),
  component: AdminOverview,
});

/* ------------------------------------------------------------------ */
/* Queues that need a human. Each one counts open items and finds the  */
/* oldest waiting item so the home page can sort oldest-first.         */
/* ------------------------------------------------------------------ */

type QueueResult = { count: number | null; oldest: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Builder = any;

async function countQueue(
  build: (select: string, opts?: { count: "exact"; head: boolean }) => Builder,
  dateCol: string,
): Promise<QueueResult> {
  let count: number | null = null;
  let oldest: string | null = null;
  try {
    const res = await build("id", { count: "exact", head: true });
    if (!res.error) count = res.count ?? 0;
  } catch {
    // leave as null — shown as unavailable
  }
  if (count && count > 0) {
    try {
      const res = await build(dateCol).order(dateCol, { ascending: true }).limit(1);
      const first = (res.data ?? [])[0] as Record<string, string | null> | undefined;
      oldest = first?.[dateCol] ?? null;
    } catch {
      // oldest is optional
    }
  }
  return { count, oldest };
}

type QueueDef = {
  key: string;
  label: string;
  to: string;
  icon: React.ReactNode;
  run: () => Promise<QueueResult>;
};

const QUEUES: QueueDef[] = [
  {
    key: "listings",
    label: "Listings to review",
    to: "/admin/listings",
    icon: <Car />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("cars").select(s, o).eq("status", "pending"),
        "created_at",
      ),
  },
  {
    key: "sellers",
    label: "Seller applications",
    to: "/admin/sellers",
    icon: <Users />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase.from("sellers").select(s, o).eq("is_approved", false).eq("is_suspended", false),
        "created_at",
      ),
  },
  {
    key: "seller-id",
    label: "Seller identity checks",
    to: "/admin/verification",
    icon: <ShieldCheck />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase
            .from("seller_verifications")
            .select(s, o)
            .in("status", ["pending", "under_review"]),
        "updated_at",
      ),
  },
  {
    key: "buyer-kyc",
    label: "Buyer identity checks",
    to: "/admin/verification",
    icon: <UserCheck />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("profiles").select(s, o).eq("kyc_status", "submitted"),
        "kyc_submitted_at",
      ),
  },
  {
    key: "documents",
    label: "Documents to verify",
    to: "/admin/documents",
    icon: <FileText />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("car_documents").select(s, o).eq("status", "pending"),
        "created_at",
      ),
  },
  {
    key: "evidence",
    label: "Vehicle evidence",
    to: "/admin/evidence",
    icon: <FileCheck2 />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("vehicle_evidence").select(s, o).eq("status", "submitted"),
        "created_at",
      ),
  },
  {
    key: "manual-payments",
    label: "Manual payments to confirm",
    to: "/admin/transactions",
    icon: <Banknote />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase.from("transactions").select(s, o).eq("status", "awaiting_manual_payment"),
        "initiated_at",
      ),
  },
  {
    key: "release",
    label: "Funds waiting for release",
    to: "/admin/transactions",
    icon: <Wallet />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase
            .from("transactions")
            .select(s, o)
            .in("status", ["payment_received", "admin_reviewing"]),
        "initiated_at",
      ),
  },
  {
    key: "disputes",
    label: "Open disputes",
    to: "/admin/transactions",
    icon: <ShieldAlert />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("transactions").select(s, o).eq("status", "disputed"),
        "initiated_at",
      ),
  },
  {
    key: "auctions",
    label: "Auctions to approve",
    to: "/admin/auctions",
    icon: <Gavel />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("vehicle_auctions").select(s, o).eq("approval_status", "pending"),
        "created_at",
      ),
  },
  {
    key: "inspections",
    label: "Inspections to approve",
    to: "/admin/inspections",
    icon: <Wrench />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase
            .from("inspections")
            .select(s, o)
            .or("admin_approved.is.null,admin_approved.eq.false"),
        "created_at",
      ),
  },
  {
    key: "yards",
    label: "Car yards to review",
    to: "/admin/yards",
    icon: <Store />,
    run: () =>
      countQueue(
        (s, o) =>
          supabase
            .from("car_yards")
            .select(s, o)
            .eq("is_approved", false)
            .eq("is_suspended", false),
        "created_at",
      ),
  },
  {
    key: "provider-claims",
    label: "Provider claims",
    to: "/admin/provider-claims",
    icon: <Wrench />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("service_provider_claims").select(s, o).eq("status", "requested"),
        "created_at",
      ),
  },
  {
    key: "imports",
    label: "Open import requests",
    to: "/admin/import-requests",
    icon: <Inbox />,
    run: () =>
      countQueue(
        (s, o) => supabase.from("import_requests").select(s, o).eq("status", "open"),
        "created_at",
      ),
  },
];

function AdminOverview() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        sellersTotal,
        sellersPending,
        carsTotal,
        carsPending,
        carsApproved,
        importsOpen,
        viewsAgg,
      ] = await Promise.all([
        supabase.from("sellers").select("id", { count: "exact", head: true }),
        supabase
          .from("sellers")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", false),
        supabase.from("cars").select("id", { count: "exact", head: true }),
        supabase.from("cars").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("cars").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase
          .from("import_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
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

  const queues = useQuery({
    queryKey: ["admin-queues"],
    queryFn: async () => {
      const results = await Promise.all(QUEUES.map((q) => q.run()));
      return QUEUES.map((q, i) => ({ ...q, ...results[i] }));
    },
  });

  const breakdown = useQuery({
    queryKey: ["admin-country-breakdown"],
    queryFn: async () => {
      const { data } = await supabase.from("cars").select("country").eq("status", "approved");
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

  // Oldest-first: queues with waiting items, sorted by the age of their oldest item.
  const queueRows = queues.data ?? [];
  const waiting = queueRows
    .filter((q) => (q.count ?? 0) > 0)
    .sort((a, b) => {
      const ta = a.oldest ? new Date(a.oldest).getTime() : Number.MAX_SAFE_INTEGER;
      const tb = b.oldest ? new Date(b.oldest).getTime() : Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  const clear = queueRows.filter((q) => !q.count);
  const totalWaiting = waiting.reduce((n, q) => n + (q.count ?? 0), 0);

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Operations control room"
        title="Marketplace review queue"
        description="Live operational counts only. Review listings, sellers and imports from one accountable workspace."
      />

      {stats.isError && (
        <QueueError>
          Live operations data is temporarily unavailable. Nothing has been deleted; refresh to
          retry.
        </QueueError>
      )}

      {/* 1 — Needs a human now */}
      <AdminPanel
        kicker="Needs a human now"
        title={
          queues.isLoading
            ? "Checking the queues…"
            : totalWaiting > 0
              ? `${totalWaiting} item${totalWaiting === 1 ? "" : "s"} waiting`
              : "All queues are clear"
        }
        description="Oldest waiting work first. Open a queue to review it."
        bodyClassName="p-4 sm:p-6"
      >
        {queues.isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[132px] rounded-3xl" />
            ))}
          </div>
        ) : waiting.length === 0 ? (
          <QueueEmpty
            icon={<PartyPopper />}
            title="Nothing is waiting"
            description="No listings, identity checks, payments or claims need a decision right now. New submissions appear here automatically."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {waiting.map((q) => (
              <QueueTile
                key={q.key}
                to={q.to}
                label={q.label}
                count={q.count}
                icon={q.icon}
                hint={q.oldest ? `Oldest waiting ${ageOf(q.oldest)}` : undefined}
              />
            ))}
          </div>
        )}

        {!queues.isLoading && clear.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">Clear right now</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {clear.map((q) => (
                <Link
                  key={q.key}
                  to={q.to as never}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground lg:min-h-9 [&_svg]:h-3.5 [&_svg]:w-3.5"
                >
                  {q.icon}
                  {q.label}
                  <span className="tabular-nums text-foreground">{q.count === null ? "—" : 0}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </AdminPanel>

      {/* 2 — Platform stats */}
      <section>
        <p className="brand-kicker mb-3 text-muted-foreground">Platform</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <StatTile
            icon={<Users />}
            label="Sellers"
            value={s?.sellersTotal ?? 0}
            sub={`${s?.sellersPending ?? 0} pending`}
            loading={stats.isLoading}
          />
          <StatTile
            icon={<Car />}
            label="Listings"
            value={s?.carsTotal ?? 0}
            sub={`${s?.carsApproved ?? 0} approved`}
            loading={stats.isLoading}
          />
          <StatTile
            icon={<Clock />}
            label="Pending review"
            value={s?.carsPending ?? 0}
            tone={(s?.carsPending ?? 0) > 0 ? "warning" : "default"}
            loading={stats.isLoading}
          />
          <StatTile
            icon={<Eye />}
            label="Total views"
            value={(s?.totalViews ?? 0).toLocaleString()}
            loading={stats.isLoading}
          />
          <StatTile
            icon={<Inbox />}
            label="Open imports"
            value={s?.importsOpen ?? 0}
            loading={stats.isLoading}
          />
          <StatTile
            icon={<CheckCircle2 />}
            label="Approved cars"
            value={s?.carsApproved ?? 0}
            tone="success"
            loading={stats.isLoading}
          />
        </div>
      </section>

      {/* 3 — Reporting */}
      <AdminPanel
        kicker="Reporting"
        title="Approved listings by country"
        description="Top markets, live data."
        bodyClassName="p-4 sm:p-6"
      >
        <div className="h-80">
          {breakdown.isLoading ? (
            <div className="flex h-full items-end gap-3" aria-busy="true" aria-label="Loading">
              {[60, 85, 45, 70, 30, 55, 40, 25].map((h, i) => (
                <Skeleton
                  key={i}
                  className="flex-1 rounded-b-none rounded-t-xl"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          ) : breakdown.isError ? (
            <div className="grid h-full place-items-center text-sm text-destructive">
              Live reporting is temporarily unavailable. Refresh to retry.
            </div>
          ) : (breakdown.data?.length ?? 0) === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No approved listings yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={breakdown.data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  interval={0}
                  angle={-25}
                  height={70}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                    color: "var(--foreground)",
                  }}
                />
                <Bar dataKey="count" fill="var(--color-ac-accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </AdminPanel>
    </AdminPage>
  );
}
