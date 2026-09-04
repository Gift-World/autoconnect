import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Globe2, MapPin, PackageCheck, Store, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/parts/shops")({
  head: () => ({ meta: [{ title: "Parts Shops — AutoConnect" }] }),
  component: PartsShopsPage,
});

type Shop = { id: string; slug: string; name: string; description: string | null; country: string; city: string | null; shipping_regions: string[] | null; return_policy: string | null; is_verified: boolean; is_sample: boolean };

function PartsShopsPage() {
  const shops = useQuery({
    queryKey: ["approved-parts-shops"],
    queryFn: async () => { const response = await fetch("/api/public/parts-shops"); const payload = await response.json() as { data?: Shop[]; error?: string }; if (!response.ok) throw new Error(payload.error ?? "Unable to load suppliers."); return payload.data ?? []; },
  });

  return <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
    <section className="rounded-3xl border bg-gradient-to-br from-white via-teal-50/60 to-slate-50 p-7 shadow-sm sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-700">Supplier directory</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-5"><div><h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Compare where your part comes from.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">See approved suppliers, their stated shipping regions and return terms before you request a quote. Sample suppliers are clearly marked until onboarding opens.</p></div><Button asChild><Link to="/parts">Browse live parts</Link></Button></div>
    </section>
    {shops.isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-2">{[1,2,3,4].map((i) => <Skeleton className="h-64 rounded-2xl" key={i} />)}</div> : shops.isError ? <EmptyState icon={<Store />} title="Supplier directory is unavailable" description="Please refresh and try again." /> : shops.data?.length ? <section className="mt-8 grid gap-4 md:grid-cols-2">{shops.data.map((shop) => <ShopCard shop={shop} key={shop.id} />)}</section> : <EmptyState icon={<Store />} title="No approved shops yet" description="Approved suppliers will appear here once they publish stock." />}
  </main>;
}

function ShopCard({ shop }: { shop: Shop }) {
  return <article className="rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-700"><Store className="h-6 w-6" /></span>{shop.is_verified && <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2.5 py-1 text-[11px] font-bold text-teal-700"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</span>}</div><h2 className="mt-5 text-xl font-bold">{shop.name}</h2><p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{shop.description ?? "Approved supplier catalogue."}</p><dl className="mt-5 grid gap-3 border-y py-4 text-xs"><div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" /><dt className="sr-only">Location</dt><dd>{shop.city ? `${shop.city}, ` : ""}{shop.country}</dd></div><div className="flex items-start gap-2"><Truck className="mt-0.5 h-3.5 w-3.5 text-primary" /><dt className="sr-only">Shipping</dt><dd>Ships to {shop.shipping_regions?.join(", ") || "regions confirmed in quote"}</dd></div></dl>{shop.is_sample && <p className="mt-4 text-xs font-semibold text-amber-700">Preview supplier data — availability is illustrative.</p>}<div className="mt-5 flex gap-2"><Button asChild className="flex-1" size="sm"><Link to="/parts">View stock <PackageCheck className="ml-2 h-4 w-4" /></Link></Button><Button asChild variant="outline" size="sm"><Link to="/support">Ask a question <Globe2 className="ml-2 h-4 w-4" /></Link></Button></div></article>;
}
