import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Anchor, Calendar, CheckCircle2, CircleDot, FileCheck2, MapPin, Search, Ship } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/import-tracker")({
  head: () => ({ meta: [{ title: "Import order tracker | AutoConnect" }, { name: "description", content: "Track only the import milestones, documents and ETD/ETA attached to your purchase." }] }),
  component: ImportTrackerPage,
});

function ImportTrackerPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ["my-import-orders", user?.id], enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("import_orders").select("id,order_reference,status,origin_port,destination_port,carrier_name,vessel_name,booking_reference,etd,eta,proforma_url,cars(title,car_images(image_url,is_primary,sort_order)),import_order_milestones(id,title,status,occurred_at,location,note,stage_code),import_order_documents(id,title,document_type,status,external_url)").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const visible = useMemo(() => (orders ?? []).filter((o) => `${o.order_reference} ${(Array.isArray(o.cars) ? o.cars[0] : o.cars)?.title || ""}`.toLowerCase().includes(search.toLowerCase())), [orders, search]);
  const selected = visible.find((o) => o.id === selectedId) || visible[0];
  if (!user) return <AccessState />;
  return <main className="min-h-screen bg-gradient-to-b from-teal-50/60 via-background to-background pb-16 dark:from-teal-950/20">
    <section className="border-b border-border bg-white/85 py-10 dark:bg-background/85"><div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-5 px-4 sm:px-6 md:flex-row md:items-end"><div><span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-teal-700 dark:border-teal-500/20 dark:bg-teal-500/10 dark:text-teal-300"><Anchor className="h-3.5 w-3.5"/>Order tracker</span><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Your import, step by step.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Each milestone, document and ETA comes from your order record. If a carrier or clearing update has not been received, we show that plainly.</p></div><div className="relative w-full md:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order reference or vehicle" className="h-11 rounded-xl pl-9"/></div></div></section>
    <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-3"><p className="px-1 text-xs font-bold uppercase tracking-[.13em] text-muted-foreground">Your import orders</p>{isLoading ? Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl"/>) : isError ? <FailureState /> : visible.map((o) => <OrderCard key={o.id} order={o} selected={selected?.id === o.id} onClick={() => setSelectedId(o.id)} />)}{!isLoading && !isError && !visible.length && <EmptyOrders />}</aside>
      <section>{selected ? <OrderDetails order={selected} /> : <EmptyDetail />}</section>
    </div>
  </main>;
}

function OrderCard({ order, selected, onClick }: { order: any; selected: boolean; onClick: () => void }) {
  const car = Array.isArray(order.cars) ? order.cars[0] : order.cars;
  const image = car?.car_images?.find((i: any) => i.is_primary)?.image_url || car?.car_images?.[0]?.image_url;
  return <button type="button" onClick={onClick} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-teal-500 bg-teal-50 shadow-sm dark:bg-teal-500/10" : "border-border bg-card hover:border-teal-400/60"}`}><div className="flex gap-3"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{image && <img src={image} alt="" className="h-full w-full object-cover"/>}</div><div className="min-w-0"><p className="font-mono text-[10px] font-bold text-teal-700 dark:text-teal-300">{order.order_reference}</p><p className="mt-1 line-clamp-1 text-sm font-bold text-foreground">{car?.title || "Import order"}</p><p className="mt-1 text-[11px] capitalize text-muted-foreground">{order.status.replaceAll("_", " ")}</p></div></div></button>;
}

function OrderDetails({ order }: { order: any }) {
  const car = Array.isArray(order.cars) ? order.cars[0] : order.cars;
  const stages = [...(order.import_order_milestones || [])].sort((a: any, b: any) => String(a.occurred_at || "9999").localeCompare(String(b.occurred_at || "9999")));
  const docs = order.import_order_documents || [];
  return <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm"><div className="border-b border-border bg-muted/30 p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">{order.order_reference}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">{car?.title || "Import order"}</h2><p className="mt-2 text-sm text-muted-foreground">{order.origin_port || "Origin not entered"} <span className="px-1.5">→</span> {order.destination_port || "Destination not entered"}</p></div><Fact label="Estimated arrival" value={order.eta ? new Date(`${order.eta}T00:00:00`).toLocaleDateString() : "Awaiting carrier ETA"}/></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Fact label="Carrier" value={order.carrier_name || "Not entered"}/><Fact label="Vessel / booking" value={order.vessel_name || order.booking_reference || "Awaiting carrier record"}/><Fact label="ETD" value={order.etd ? new Date(`${order.etd}T00:00:00`).toLocaleDateString() : "Not entered"}/></div></div><div className="grid gap-8 p-6 sm:grid-cols-[1.2fr_.8fr] sm:p-8"><div><h3 className="font-bold">Milestone history</h3><p className="mt-1 text-sm text-muted-foreground">Updates from the seller, carrier, clearing agent or AutoConnect team.</p><div className="mt-5 space-y-4 border-l-2 border-border pl-5">{stages.length ? stages.map((s: any) => <div className="relative" key={s.id}><span className={`absolute -left-[31px] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2 ${s.status === "completed" ? "border-teal-600 bg-teal-600" : s.status === "active" ? "border-amber-500 bg-background" : "border-border bg-background"}`}>{s.status === "completed" && <CheckCircle2 className="h-3 w-3 text-white"/>}{s.status === "active" && <CircleDot className="h-3 w-3 text-amber-500"/>}</span><div className="rounded-2xl border border-border bg-background p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-foreground">{s.title}</p><span className="text-xs text-muted-foreground">{s.occurred_at ? new Date(s.occurred_at).toLocaleDateString() : s.status === "upcoming" ? "Awaiting update" : ""}</span></div>{s.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3"/>{s.location}</p>}{s.note && <p className="mt-2 border-t border-border pt-2 text-xs leading-5 text-muted-foreground">{s.note}</p>}</div></div>) : <p className="text-sm text-muted-foreground">No milestones have been entered for this order yet.</p>}</div></div><aside className="rounded-2xl bg-muted/40 p-5"><h3 className="flex items-center gap-2 font-bold"><FileCheck2 className="h-4 w-4 text-teal-600"/>Order documents</h3><div className="mt-4 space-y-2">{docs.length ? docs.map((d: any) => <a key={d.id} href={d.external_url || undefined} target={d.external_url ? "_blank" : undefined} rel="noreferrer" className="block rounded-xl border border-border bg-background p-3 text-sm transition hover:border-teal-500"><p className="font-medium text-foreground">{d.title}</p><p className="mt-1 text-[11px] capitalize text-muted-foreground">{d.document_type.replaceAll("_", " ")} · {d.status}</p></a>) : <p className="text-sm leading-6 text-muted-foreground">No documents are available yet. Your team will attach the pro-forma, bill of lading and clearing documents as they are received.</p>}</div>{order.proforma_url && <a className="mt-4 inline-flex text-sm font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300" href={order.proforma_url} target="_blank" rel="noreferrer">Open pro-forma invoice</a>}</aside></div></div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-background p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground"><Calendar className="h-3.5 w-3.5 text-teal-600"/>{value}</p></div>; }
function EmptyOrders() { return <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">No matching import orders.</div>; }
function FailureState() { return <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">Import orders could not load. This is a connection or access issue, not an empty tracker.</div>; }
function EmptyDetail() { return <div className="rounded-3xl border border-dashed border-border bg-card p-8"><Ship className="h-9 w-9 text-teal-600"/><h2 className="mt-4 text-xl font-bold">No import order to track yet.</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Once you reserve a vehicle and an order is issued, its pro-forma, shipping and clearing updates will appear here.</p><Button asChild className="mt-5 rounded-xl"><Link to="/import">Start an import request</Link></Button></div>; }
function AccessState() { return <main className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center"><Ship className="h-10 w-10 text-teal-600"/><h1 className="mt-5 text-3xl font-extrabold">Sign in to track your import</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your order timeline and documents are private to your account.</p><Button asChild className="mt-6 rounded-xl"><Link to="/login">Sign in</Link></Button></main>; }
