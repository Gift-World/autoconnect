import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Anchor,
  ArrowRight,
  Calendar,
  CheckCircle2,
  CircleDot,
  FileCheck2,
  FileText,
  MapPin,
  Search,
  Ship,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryEmpty } from "@/components/yard/StoryEmpty";
import { VehicleImage } from "@/components/VehicleImage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/import-tracker")({
  head: () => ({
    meta: [
      { title: "Import order tracker | AutoConnect" },
      {
        name: "description",
        content: "Track only the import milestones, documents and ETD/ETA attached to your purchase.",
      },
    ],
  }),
  component: ImportTrackerPage,
});

function ImportTrackerPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data: orders,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-import-orders", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_orders")
        .select(
          "id,order_reference,status,origin_port,destination_port,carrier_name,vessel_name,booking_reference,etd,eta,proforma_url,cars(title,car_images(image_url,is_primary,sort_order)),import_order_milestones(id,title,status,occurred_at,location,note,stage_code),import_order_documents(id,title,document_type,status,external_url)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const visible = useMemo(
    () =>
      (orders ?? []).filter((o) =>
        `${o.order_reference} ${(Array.isArray(o.cars) ? o.cars[0] : o.cars)?.title || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [orders, search],
  );
  const selected = visible.find((o) => o.id === selectedId) || visible[0];
  if (!user) return <AccessState />;
  return (
    <main className="min-h-screen bg-background pb-16 text-foreground">
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="rounded-[28px] bg-ac-ink px-5 py-8 text-white sm:rounded-[36px] sm:px-10 sm:py-12">
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="brand-kicker inline-flex items-center gap-2 text-ac-accent">
                <Anchor className="h-4 w-4" /> Order tracker
              </p>
              <h1 className="font-brand mt-4 text-3xl sm:text-5xl">Your import, step by step.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Each milestone, document and ETA comes from your order record. If a carrier or
                clearing update has not been received, we show that plainly.
              </p>
            </div>
            <label className="relative w-full md:w-80">
              <span className="sr-only">Search orders</span>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Order reference or vehicle"
                className="h-12 rounded-full border-white/15 bg-white/10 pl-10 text-white placeholder:text-white/50"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1360px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <p className="brand-kicker px-1 text-muted-foreground">Your import orders</p>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          ) : isError ? (
            <FailureState />
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {visible.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  selected={selected?.id === o.id}
                  onClick={() => setSelectedId(o.id)}
                />
              ))}
            </div>
          )}
          {!isLoading && !isError && !visible.length && <EmptyOrders hasSearch={!!search} />}
        </aside>
        <section className="min-w-0">
          {isLoading ? (
            <Skeleton className="h-[480px] rounded-[28px]" />
          ) : selected ? (
            <OrderDetails order={selected} />
          ) : (
            <EmptyDetail />
          )}
        </section>
      </div>
    </main>
  );
}

function OrderCard({
  order,
  selected,
  onClick,
}: {
  order: any;
  selected: boolean;
  onClick: () => void;
}) {
  const car = Array.isArray(order.cars) ? order.cars[0] : order.cars;
  const image =
    car?.car_images?.find((i: any) => i.is_primary)?.image_url || car?.car_images?.[0]?.image_url;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "w-[260px] shrink-0 rounded-2xl border p-3 text-left transition lg:w-full",
        selected
          ? "border-ac-accent bg-ac-accent/10 shadow-sm"
          : "border-border bg-card hover:border-ac-accent/50",
      )}
    >
      <div className="flex gap-3">
        <div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
          <VehicleImage src={image} alt={car?.title || "Import vehicle"} />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-bold text-ac-accent">{order.order_reference}</p>
          <p className="mt-1 line-clamp-1 text-sm font-bold text-foreground">
            {car?.title || "Import order"}
          </p>
          <p className="mt-1 text-[11px] capitalize text-muted-foreground">
            {order.status.replaceAll("_", " ")}
          </p>
        </div>
      </div>
    </button>
  );
}

function OrderDetails({ order }: { order: any }) {
  const car = Array.isArray(order.cars) ? order.cars[0] : order.cars;
  const stages = [...(order.import_order_milestones || [])].sort((a: any, b: any) =>
    String(a.occurred_at || "9999").localeCompare(String(b.occurred_at || "9999")),
  );
  const docs = order.import_order_documents || [];
  const done = stages.filter((s: any) => s.status === "completed").length;
  const active =
    stages.find((s: any) => s.status === "active") ||
    [...stages].reverse().find((s: any) => s.status === "completed");
  const eta = order.eta
    ? new Date(`${order.eta}T00:00:00`).toLocaleDateString()
    : "Awaiting carrier ETA";

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-card shadow-sm sm:rounded-[36px]">
      {/* Live status — Uber-style */}
      <div className="bg-ac-cream p-5 text-ac-ink sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold text-ac-ink/60">{order.order_reference}</p>
            <h2 className="font-brand mt-2 text-2xl sm:text-4xl">{car?.title || "Import order"}</h2>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-ac-ink px-3 py-1.5 text-xs font-bold text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-ac-accent opacity-75 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-ac-accent" />
              </span>
              {active?.title || order.status.replaceAll("_", " ")}
            </p>
          </div>
          <div className="shrink-0 sm:text-right">
            <p className="brand-kicker text-ac-ink/60">Estimated arrival</p>
            <p className="font-brand mt-1 text-2xl sm:text-3xl">{eta}</p>
          </div>
        </div>

        {/* Route line */}
        <div className="mt-7 flex items-center gap-3 text-sm font-semibold">
          <span className="min-w-0 truncate">{order.origin_port || "Origin not entered"}</span>
          <span className="relative h-1 flex-1 rounded-full bg-ac-ink/15">
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-ac-accent"
              style={{ width: `${stages.length ? Math.max(6, (done / stages.length) * 100) : 6}%` }}
            />
            <Ship
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ac-cream text-ac-ink"
              style={{
                left: `${stages.length ? Math.max(6, (done / stages.length) * 100) : 6}%`,
              }}
            />
          </span>
          <span className="min-w-0 truncate text-right">
            {order.destination_port || "Destination not entered"}
          </span>
        </div>
        <p className="mt-2 text-xs text-ac-ink/60">
          {stages.length
            ? `${done} of ${stages.length} milestones complete`
            : "No milestones have been entered for this order yet."}
        </p>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          <Fact label="Carrier" value={order.carrier_name || "Not entered"} />
          <Fact
            label="Vessel / booking"
            value={order.vessel_name || order.booking_reference || "Awaiting carrier record"}
          />
          <Fact
            label="ETD"
            value={
              order.etd ? new Date(`${order.etd}T00:00:00`).toLocaleDateString() : "Not entered"
            }
          />
        </dl>
      </div>

      <Tabs defaultValue="milestones" className="p-5 sm:p-8">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-full p-1 sm:w-auto">
          <TabsTrigger value="milestones" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
            Milestones ({stages.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
            Documents ({docs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="mt-6">
          <p className="text-sm text-muted-foreground">
            Updates from the seller, carrier, clearing agent or AutoConnect team.
          </p>
          {stages.length ? (
            <ol className="mt-6">
              {stages.map((s: any, index: number) => {
                const isDone = s.status === "completed";
                const isActive = s.status === "active";
                const last = index === stages.length - 1;
                return (
                  <li key={s.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {!last && (
                      <span
                        aria-hidden
                        className={cn(
                          "absolute left-[15px] top-8 bottom-0 w-0.5",
                          isDone ? "bg-ac-accent" : "bg-border",
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2",
                        isDone
                          ? "border-ac-accent bg-ac-accent text-ac-ink"
                          : isActive
                            ? "border-ac-accent bg-background text-ac-accent ring-4 ring-ac-accent/20"
                            : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <CircleDot className="h-4 w-4" />
                      ) : (
                        <span className="text-[10px] font-bold">{index + 1}</span>
                      )}
                    </span>
                    <div
                      className={cn(
                        "min-w-0 flex-1 rounded-2xl border p-4",
                        isActive ? "border-ac-accent/50 bg-ac-accent/5" : "border-border bg-background",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{s.title}</p>
                        <span className="text-xs text-muted-foreground">
                          {s.occurred_at
                            ? new Date(s.occurred_at).toLocaleDateString()
                            : s.status === "upcoming"
                              ? "Awaiting update"
                              : ""}
                        </span>
                      </div>
                      {s.location && (
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {s.location}
                        </p>
                      )}
                      {s.note && (
                        <p className="mt-2 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">
                          {s.note}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              No milestones have been entered for this order yet.
            </p>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <h3 className="flex items-center gap-2 font-bold">
            <FileCheck2 className="h-4 w-4 text-ac-accent" />
            Order documents
          </h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {docs.length ? (
              docs.map((d: any) => (
                <a
                  key={d.id}
                  href={d.external_url || undefined}
                  target={d.external_url ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex min-h-11 items-start gap-3 rounded-2xl border border-border bg-background p-4 text-sm transition hover:border-ac-accent"
                >
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block font-medium text-foreground">{d.title}</span>
                    <span className="mt-1 block text-[11px] capitalize text-muted-foreground">
                      {d.document_type.replaceAll("_", " ")} · {d.status}
                    </span>
                  </span>
                </a>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground sm:col-span-2">
                No documents are available yet. Your team will attach the pro-forma, bill of lading
                and clearing documents as they are received.
              </p>
            )}
          </div>
          {order.proforma_url && (
            <a
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-foreground underline underline-offset-4"
              href={order.proforma_url}
              target="_blank"
              rel="noreferrer"
            >
              Open pro-forma invoice <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/60 p-3 dark:bg-white/70">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ac-ink/60">{label}</dt>
      <dd className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ac-ink">
        <Calendar className="h-3.5 w-3.5 shrink-0 text-ac-accent" />
        <span className="min-w-0 truncate">{value}</span>
      </dd>
    </div>
  );
}
function EmptyOrders({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
      {hasSearch ? "No matching import orders." : "No import orders yet."}
    </div>
  );
}
function FailureState() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      Import orders could not load. This is a connection or access issue, not an empty tracker.
    </div>
  );
}
function EmptyDetail() {
  return (
    <StoryEmpty
      icon={<Ship />}
      kicker="Nothing on the water yet"
      title="No import order to track yet."
      description="Once you reserve a vehicle and an order is issued, its pro-forma, shipping and clearing updates will appear here."
      actionLabel="Start an import request"
      actionTo="/import"
    />
  );
}
function AccessState() {
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ac-accent/15 text-ac-accent">
        <Ship className="h-8 w-8" />
      </span>
      <h1 className="font-brand mt-5 text-3xl sm:text-5xl">Sign in to track your import</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Your order timeline and documents are private to your account.
      </p>
      <Link
        to="/login"
        className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink"
      >
        Sign in <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
