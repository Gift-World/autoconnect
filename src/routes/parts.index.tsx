import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Globe2, PackageSearch, Search, ShieldCheck, ShoppingBag, Store, Wrench } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/parts/")({
  head: () => ({
    meta: [
      { title: "Global Parts Marketplace — AutoConnect" },
      { name: "description", content: "Find parts from approved automotive suppliers with clear condition, origin and fulfilment information." },
    ],
  }),
  component: PartsPage,
});

type Shop = { name: string; slug: string; is_verified: boolean; country: string };
type Part = {
  id: string;
  title: string;
  brand: string | null;
  part_number: string | null;
  category: string;
  condition: "new" | "refurbished" | "used";
  price: number;
  currency: string;
  country: string;
  city: string | null;
  stock_quantity: number | null;
  shipping_regions: string[] | null;
  warranty_text: string | null;
  parts_shops: Shop | Shop[] | null;
};

function PartsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const partsQuery = useQuery({
    queryKey: ["published-parts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parts")
        .select("id,title,brand,part_number,category,condition,price,currency,country,city,stock_quantity,shipping_regions,warranty_text,parts_shops(name,slug,is_verified,country)")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(48);
      if (error) throw error;
      return (data ?? []) as unknown as Part[];
    },
  });

  const categories = useMemo(() => [...new Set((partsQuery.data ?? []).map((part) => part.category))].sort(), [partsQuery.data]);
  const visibleParts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (partsQuery.data ?? []).filter((part) => {
      const matchesCategory = category === "all" || part.category === category;
      const matchesSearch = !needle || [part.title, part.brand, part.part_number, part.country].filter(Boolean).join(" ").toLowerCase().includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [partsQuery.data, search, category]);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <section className="overflow-hidden rounded-3xl border border-teal-500/15 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-6 py-9 text-white shadow-xl sm:px-9 sm:py-12">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Global Parts Marketplace</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">The right part, without the usual guesswork.</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">Search approved suppliers by part number, category or country. Every live listing shows its condition, seller and fulfilment details before you enquire.</p>
        </div>
        <div className="mt-7 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:grid-cols-[1fr_190px]">
          <label className="flex items-center gap-3 rounded-xl bg-white px-4 text-slate-900 shadow-sm">
            <Search className="h-4 w-4 text-teal-600" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-12 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Part number, name, brand or country" />
          </label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-xl border border-white/15 bg-slate-900 px-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-teal-400">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        <TrustPoint icon={<ShieldCheck />} title="Approved suppliers" text="Only approved shops can publish live stock." />
        <TrustPoint icon={<Globe2 />} title="Built for cross-border" text="See the supplier country and stated shipping regions." />
        <TrustPoint icon={<Wrench />} title="Clear condition" text="New, refurbished and used are never mixed together." />
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><h2 className="text-2xl font-bold">Live parts inventory</h2><p className="mt-1 text-sm text-muted-foreground">No filler stock. Results come from approved suppliers in AutoConnect.</p></div>
          <span className="rounded-full border bg-muted/40 px-3 py-1 text-xs font-bold text-muted-foreground">{visibleParts.length} result{visibleParts.length === 1 ? "" : "s"}</span>
        </div>
        {partsQuery.isLoading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-64 rounded-2xl" />)}</div> : partsQuery.isError ? <EmptyState icon={<ShieldCheck />} title="Parts are being prepared" description="The secure parts marketplace database migration has not been applied in this environment yet. Existing vehicle listings are unaffected." /> : visibleParts.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleParts.map((part) => <PartCard key={part.id} part={part} />)}</div> : <EmptyState icon={<PackageSearch />} title="No live parts match that search" description="Try a broader term, a part number, or return when an approved supplier has listed stock." />}
      </section>

      <section className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">For suppliers</p><h2 className="mt-2 text-xl font-bold">Run your parts business from the same account.</h2><p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Apply your shop, publish verified stock and manage enquiries without creating another AutoConnect identity.</p></div>
        <Button asChild className="shrink-0"><Link to="/seller">Open the business portal <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
      </section>
    </div>
  );
}

function TrustPoint({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return <div className="flex gap-3 rounded-2xl border bg-card p-4 shadow-sm"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</span><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p></div></div>;
}

function PartCard({ part }: { part: Part }) {
  const shop = Array.isArray(part.parts_shops) ? part.parts_shops[0] : part.parts_shops;
  return <article className="flex min-h-64 flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-500/10 text-teal-600"><ShoppingBag className="h-5 w-5" /></span><span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold capitalize text-muted-foreground">{part.condition}</span></div><p className="mt-5 text-xs font-bold uppercase tracking-wide text-primary">{part.category}</p><h3 className="mt-1 text-lg font-bold leading-snug">{part.title}</h3>{part.brand && <p className="mt-1 text-sm text-muted-foreground">{part.brand}{part.part_number ? ` · ${part.part_number}` : ""}</p>}<div className="mt-5 border-t pt-4"><p className="text-lg font-extrabold">{money(part.price, part.currency)}</p><p className="mt-1 text-xs text-muted-foreground">{part.stock_quantity == null ? "Ask supplier about availability" : `${part.stock_quantity} in stated stock`} · {part.city ? `${part.city}, ` : ""}{part.country}</p></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Store className="h-3.5 w-3.5 text-primary" />{shop?.name ?? "Approved supplier"}{shop?.is_verified && <ShieldCheck className="h-3.5 w-3.5 text-teal-500" />}</div>{part.warranty_text && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{part.warranty_text}</p>}</article>;
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}
