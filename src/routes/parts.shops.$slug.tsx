import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, PackageSearch, ShieldCheck, Store, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/parts/shops/$slug")({ component: ShopStorefront });

type Shop = { name: string; slug: string; is_verified: boolean; country: string; city: string | null; shipping_regions: string[] | null; return_policy: string | null };
type Part = { id: string; title: string; brand: string | null; part_number: string | null; price: number; currency: string; stock_quantity: number; warranty_text: string | null; return_policy: string | null; parts_shops: Shop | Shop[] | null };

function ShopStorefront() {
  const { slug } = Route.useParams();
  const inventory = useQuery({
    queryKey: ["shop-inventory", slug],
    queryFn: async () => {
      const response = await fetch(`/api/public/parts?shop=${encodeURIComponent(slug)}`);
      const payload = (await response.json()) as { data?: Part[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load this storefront.");
      return payload.data ?? [];
    },
  });
  const shop = inventory.data?.[0]?.parts_shops;
  const supplier = Array.isArray(shop) ? shop[0] : shop;
  return <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
    <Link to="/parts/shops" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> All suppliers</Link>
    <section className="mt-5 rounded-3xl border bg-gradient-to-br from-slate-950 to-teal-950 p-7 text-white shadow-xl sm:p-10">
      <div className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><Store className="h-6 w-6" /></span><div><h1 className="text-3xl font-extrabold">{supplier?.name ?? "Supplier storefront"}</h1><p className="mt-2 text-sm text-slate-300">{supplier?.city ? `${supplier.city}, ` : ""}{supplier?.country ?? ""} · Stated inventory, delivery and terms from this supplier.</p></div></div>
      {supplier && <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><p className="rounded-xl bg-white/10 p-3"><Truck className="mr-2 inline h-4 w-4" /> Ships to {supplier.shipping_regions?.join(", ") || "regions confirmed in quote"}</p><p className="rounded-xl bg-white/10 p-3">Returns: {supplier.return_policy || "Confirm terms in quote"}</p></div>}
    </section>
    {inventory.isLoading ? <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(x => <Skeleton key={x} className="h-64 rounded-2xl" />)}</div> : inventory.isError ? <EmptyState icon={<Store />} title="This storefront is unavailable" description="Please refresh and try again." /> : inventory.data?.length ? <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{inventory.data.map((part) => <article key={part.id} className="flex flex-col rounded-2xl border bg-card p-5 shadow-sm"><p className="text-xs font-bold uppercase text-primary">{part.brand || "Parts"}</p><h2 className="mt-2 text-lg font-bold">{part.title}</h2><p className="mt-1 text-sm text-muted-foreground">{part.part_number ? `Part no. ${part.part_number}` : "Part number confirmed in quote"}</p><p className="mt-5 text-xl font-extrabold">{money(part.price, part.currency)}</p><p className="mt-1 text-xs text-muted-foreground">{part.stock_quantity} stated in stock · Warranty: {part.warranty_text || "confirm in quote"}</p><p className="mt-2 text-xs text-muted-foreground">Returns: {part.return_policy || supplier?.return_policy || "confirm in quote"}</p><Button asChild className="mt-5 w-full" size="sm"><Link to="/parts/$id" params={{ id: part.id }}>Check fitment & request quote</Link></Button></article>)}</section> : <EmptyState icon={<PackageSearch />} title="No published stock in this storefront" description="This supplier has not published live items yet." />}
  </main>;
}
function money(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value); } catch { return `${currency} ${value}`; } }
