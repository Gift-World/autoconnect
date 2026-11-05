import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";

export const Route = createFileRoute("/parts/shops/$slug")({ component: ShopStorefront });

type Shop = {
  name: string;
  slug: string;
  is_verified: boolean;
  country: string;
  city: string | null;
  shipping_regions: string[] | null;
  return_policy: string | null;
};
type Part = {
  id: string;
  title: string;
  brand: string | null;
  part_number: string | null;
  price: number;
  currency: string;
  stock_quantity: number;
  warranty_text: string | null;
  return_policy: string | null;
  image_url?: string | null;
  parts_shops: Shop | Shop[] | null;
};

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
  const displayName = supplier?.name ?? "Supplier storefront";
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const count = inventory.data?.length ?? 0;

  return (
    <main className="mx-auto max-w-[1360px] px-4 pb-20 pt-4 text-foreground sm:px-6 sm:pt-6">
      <Link
        to="/parts/shops"
        className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All suppliers
      </Link>

      {/* Cover */}
      <div className="relative mt-3 grid aspect-[16/10] place-items-center overflow-hidden rounded-[28px] bg-ac-powder text-ac-ink sm:aspect-[21/7] sm:rounded-[36px]">
        <span className="font-brand text-[22vw] leading-none opacity-20 sm:text-[12rem]" aria-hidden>
          {initials}
        </span>
        <Store className="absolute bottom-5 right-5 h-8 w-8 opacity-60" aria-hidden />
      </div>

      {/* Identity */}
      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="font-brand grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-ac-ink text-2xl text-ac-accent">
            {initials}
          </span>
          <div className="min-w-0">
            {supplier?.is_verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-white">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified supplier
              </span>
            )}
            {inventory.isLoading ? (
              <Skeleton className="mt-2 h-10 w-64 rounded-full" />
            ) : (
              <h1 className="font-brand mt-2 text-3xl sm:text-5xl">{displayName}</h1>
            )}
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              {(supplier?.city || supplier?.country) && <MapPin className="h-4 w-4 text-ac-accent" />}
              {supplier?.city ? `${supplier.city}, ` : ""}
              {supplier?.country ? `${supplier.country} · ` : ""}
              Stated inventory, delivery and terms from this supplier.
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 sm:w-auto sm:grid-cols-3">
          <Signal label="Live items" value={inventory.isLoading ? "…" : String(count)} />
          <Signal
            label="Ships to"
            value={supplier?.shipping_regions?.length ? `${supplier.shipping_regions.length} regions` : "In quote"}
          />
          <Signal label="Returns" value={supplier?.return_policy ? "Stated" : "In quote"} />
        </dl>
      </div>

      <Tabs defaultValue="stock" className="mt-10">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-full p-1 sm:w-auto">
          <TabsTrigger value="stock" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
            Stock ({count})
          </TabsTrigger>
          <TabsTrigger value="terms" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
            Shipping &amp; returns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock" className="mt-6">
          {inventory.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((x) => (
                <Skeleton key={x} className="h-64 rounded-3xl" />
              ))}
            </div>
          ) : inventory.isError ? (
            <StoryEmpty
              tone="warning"
              icon={<Store />}
              kicker="Connection issue"
              title="This storefront is unavailable"
              description="Please refresh and try again."
              actionLabel="All suppliers"
              actionTo="/parts/shops"
            />
          ) : count ? (
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {inventory.data!.map((part) => (
                <Link
                  key={part.id}
                  to="/parts/$id"
                  params={{ id: part.id }}
                  className="group flex flex-col rounded-3xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {part.image_url && (
                    <div className="mb-4 aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                      <img
                        src={part.image_url}
                        alt={`Illustrative ${part.title}`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      {part.brand || "Parts"}
                    </p>
                    <ShoppingBag className="h-5 w-5 text-ac-accent" />
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-foreground">{part.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {part.part_number
                      ? `Part no. ${part.part_number}`
                      : "Part number confirmed in quote"}
                  </p>
                  <p className="font-brand mt-5 text-2xl">{money(part.price, part.currency)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {part.stock_quantity} stated in stock · Warranty:{" "}
                    {part.warranty_text || "confirm in quote"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Returns: {part.return_policy || supplier?.return_policy || "confirm in quote"}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-foreground transition-transform group-hover:translate-x-0.5">
                    Check fitment & request quote <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </section>
          ) : (
            <StoryEmpty
              icon={<PackageSearch />}
              kicker="Shelves empty"
              title="No published stock in this storefront"
              description="This supplier has not published live items yet."
              actionLabel="Browse all live parts"
              actionTo="/parts"
              secondary={<QuietLink to="/parts/shops">Other suppliers</QuietLink>}
            />
          )}
        </TabsContent>

        <TabsContent value="terms" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-ac-cream p-6 text-ac-ink">
              <Truck className="h-6 w-6 text-ac-accent" />
              <p className="font-brand mt-3 text-xl">Ships to</p>
              <p className="mt-2 text-sm leading-6 text-ac-ink/75">
                {supplier?.shipping_regions?.join(", ") || "regions confirmed in quote"}
              </p>
            </div>
            <div className="rounded-3xl bg-ac-stone p-6 text-ac-ink">
              <RotateCcw className="h-6 w-6 text-ac-accent" />
              <p className="font-brand mt-3 text-xl">Returns</p>
              <p className="mt-2 text-sm leading-6 text-ac-ink/75">
                {supplier?.return_policy || "Confirm terms in quote"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-bold text-foreground">{value}</dd>
    </div>
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
    return `${currency} ${value}`;
  }
}
