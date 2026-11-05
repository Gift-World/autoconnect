import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Globe2,
  PackageSearch,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";
import { RevealText } from "@/components/motion/RevealText";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/parts/")({
  head: () => ({
    meta: [
      { title: "Global Parts Marketplace — AutoConnect" },
      {
        name: "description",
        content:
          "Find parts from approved automotive suppliers with clear condition, origin and fulfilment information.",
      },
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
  image_url: string | null;
  is_sample: boolean;
  parts_shops: Shop | Shop[] | null;
};

function PartsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const partsQuery = useQuery({
    queryKey: ["published-parts"],
    queryFn: async () => {
      const response = await fetch("/api/public/parts");
      const payload = (await response.json()) as { data?: Part[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load parts.");
      return payload.data ?? [];
    },
  });

  const categories = useMemo(
    () => [...new Set((partsQuery.data ?? []).map((part) => part.category))].sort(),
    [partsQuery.data],
  );
  const visibleParts = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (partsQuery.data ?? []).filter((part) => {
      const matchesCategory = category === "all" || part.category === category;
      const matchesSearch =
        !needle ||
        [part.title, part.brand, part.part_number, part.country]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [partsQuery.data, search, category]);

  return (
    <main className="bg-background pb-20 text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          <img
            src="/images/providers/nairobi-garage-workshop.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.95),rgba(11,19,36,.65)_60%,rgba(11,19,36,.5))]" />
          <div className="mx-auto max-w-[1360px] px-5 py-12 sm:px-10 sm:py-20 lg:py-24">
            <p className="brand-kicker text-ac-accent">Global Parts Marketplace</p>
            <h1 className="font-brand mt-5 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
              The right part, <span className="text-ac-accent">without the usual guesswork.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
              Search approved suppliers by part number, category or country. Every live listing
              shows its condition, seller and fulfilment details before you enquire.
            </p>
            <label className="mt-8 flex max-w-2xl items-center gap-3 rounded-[22px] border border-white/15 bg-white px-4 text-ac-ink shadow-lg">
              <Search className="h-5 w-5 shrink-0 text-ac-accent" />
              <span className="sr-only">Search parts</span>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-14 border-0 bg-transparent px-0 text-base text-ac-ink shadow-none placeholder:text-ac-ink/50 focus-visible:ring-0"
                placeholder="Part number, name, brand or country"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
              <Link
                to="/parts/shops"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-white/85 transition hover:border-white/50 hover:text-white"
              >
                <Store className="h-4 w-4" /> Compare suppliers
              </Link>
              <Link
                to="/services"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-white/85 transition hover:border-white/50 hover:text-white"
              >
                <Wrench className="h-4 w-4" /> Find a mechanic or garage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <RevealText
            className="font-brand text-3xl leading-[1.1] sm:text-5xl"
            text="No filler stock. Only approved suppliers publish live parts, and new, refurbished and used are never mixed together."
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-[1360px] gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <TrustPoint
          color="bg-ac-cream"
          icon={<ShieldCheck />}
          title="Approved suppliers"
          text="Only approved shops can publish live stock."
        />
        <TrustPoint
          color="bg-ac-powder"
          icon={<Globe2 />}
          title="Built for cross-border"
          text="See the supplier country and stated shipping regions."
        />
        <TrustPoint
          color="bg-ac-apricot"
          icon={<Wrench />}
          title="Clear condition"
          text="New, refurbished and used are never mixed together."
        />
      </section>

      <section className="mx-auto mt-16 max-w-[1360px] px-4 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="brand-kicker text-muted-foreground">Live parts inventory</p>
            <h2 className="font-brand mt-2 text-3xl sm:text-5xl">Shop the shelves</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No filler stock. Results come from approved suppliers in AutoConnect.
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground">
            {visibleParts.length} result{visibleParts.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Category chips */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by category">
          {["all", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
              className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-semibold capitalize transition ${
                category === item
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/40"
              }`}
            >
              {item === "all" ? "All categories" : item}
            </button>
          ))}
        </div>

        {partsQuery.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div key={item} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            ))}
          </div>
        ) : partsQuery.isError ? (
          <StoryEmpty
            tone="warning"
            icon={<ShieldCheck />}
            kicker="Getting ready"
            title="Parts are being prepared"
            description="The secure parts marketplace database migration has not been applied in this environment yet. Existing vehicle listings are unaffected."
            actionLabel="Find a mechanic instead"
            actionTo="/services"
            secondary={<QuietLink to="/parts/shops">See suppliers</QuietLink>}
          />
        ) : visibleParts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleParts.map((part) => (
              <PartCard key={part.id} part={part} />
            ))}
          </div>
        ) : (
          <StoryEmpty
            icon={<PackageSearch />}
            kicker={search || category !== "all" ? "No match" : "Shelves restocking"}
            title="No live parts match that search"
            description="Try a broader term, a part number, or return when an approved supplier has listed stock."
            actionLabel={search || category !== "all" ? "Clear search" : "Compare suppliers"}
            onAction={
              search || category !== "all"
                ? () => {
                    setSearch("");
                    setCategory("all");
                  }
                : undefined
            }
            actionTo={search || category !== "all" ? undefined : "/parts/shops"}
          />
        )}
      </section>

      <section className="mx-auto mt-20 max-w-[1360px] px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-ac-stone p-6 text-ac-ink sm:flex-row sm:items-center sm:rounded-[36px] sm:p-10">
          <div>
            <p className="brand-kicker text-ac-ink/60">For suppliers</p>
            <h2 className="font-brand mt-2 text-2xl sm:text-4xl">
              Run your parts business from the same account.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ac-ink/70">
              Apply your shop, publish verified stock and manage enquiries without creating another
              AutoConnect identity.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="min-h-11 shrink-0 rounded-full border-ac-ink/25 bg-transparent text-ac-ink hover:bg-ac-ink hover:text-white"
          >
            <Link to="/seller">
              Open the business portal <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function TrustPoint({
  color,
  icon,
  title,
  text,
}: {
  color: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={`flex gap-3 rounded-3xl p-5 text-ac-ink ${color}`}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ac-ink text-ac-accent [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <div>
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-ac-ink/70">{text}</p>
      </div>
    </div>
  );
}

function PartCard({ part }: { part: Part }) {
  const shop = Array.isArray(part.parts_shops) ? part.parts_shops[0] : part.parts_shops;
  return (
    <Link
      to="/parts/$id"
      params={{ id: part.id }}
      className="group flex flex-col rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
        {part.image_url ? (
          <img
            alt={`Illustrative ${part.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={part.image_url}
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-ac-cream text-ac-ink">
            <div className="text-center">
              <ShoppingBag className="mx-auto h-9 w-9 text-ac-accent" />
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[.16em] text-ac-ink/50">
                Illustrative catalogue visual
              </span>
            </div>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold capitalize text-ac-ink">
          {part.condition}
        </span>
        {part.is_sample && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">
            Sample catalogue item
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-1 flex-col px-1">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {part.category}
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-foreground">
          {part.title}
        </h3>
        {part.brand && (
          <p className="mt-1 text-sm text-muted-foreground">
            {part.brand}
            {part.part_number ? ` · ${part.part_number}` : ""}
          </p>
        )}
        <p className="mt-3 text-lg font-extrabold text-foreground">
          {money(part.price, part.currency)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {part.stock_quantity == null
            ? "Ask supplier about availability"
            : `${part.stock_quantity} in stated stock`}{" "}
          · {part.city ? `${part.city}, ` : ""}
          {part.country}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Store className="h-3.5 w-3.5 text-ac-accent" />
          {shop?.name ?? "Approved supplier"}
          {shop?.is_verified && (
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-label="Verified supplier" />
          )}
        </p>
        <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-foreground transition-transform group-hover:translate-x-0.5">
          View compatibility & request quote <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}
