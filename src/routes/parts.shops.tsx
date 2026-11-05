import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Globe2, MapPin, RotateCcw, Store, Truck } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";

export const Route = createFileRoute("/parts/shops")({
  head: () => ({ meta: [{ title: "Parts Shops — AutoConnect" }] }),
  component: PartsShopsRoute,
});

type Shop = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  country: string;
  city: string | null;
  shipping_regions: string[] | null;
  return_policy: string | null;
  is_verified: boolean;
  is_sample: boolean;
};

const PANEL_COLORS = ["bg-ac-cream", "bg-ac-powder", "bg-ac-apricot", "bg-ac-stone"];

/** `/parts/shops/$slug` is a child of this route, so hand over to it when it matches. */
function PartsShopsRoute() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <PartsShopsPage />;
}

function PartsShopsPage() {
  const shops = useQuery({
    queryKey: ["approved-parts-shops"],
    queryFn: async () => {
      const response = await fetch("/api/public/parts-shops");
      const payload = (await response.json()) as { data?: Shop[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load suppliers.");
      return payload.data ?? [];
    },
  });

  return (
    <main className="bg-background pb-20 text-foreground">
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="rounded-[28px] bg-ac-ink px-5 py-12 text-white sm:rounded-[36px] sm:px-10 sm:py-16">
          <div className="mx-auto flex max-w-[1360px] flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="brand-kicker text-ac-accent">Supplier directory</p>
              <h1 className="font-brand mt-4 max-w-3xl text-4xl sm:text-6xl">
                Compare where your part comes from.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70">
                See approved suppliers, their stated shipping regions and return terms before you
                request a quote. Sample suppliers are clearly marked until onboarding opens.
              </p>
            </div>
            <Link
              to="/parts"
              className="inline-flex min-h-12 shrink-0 items-center gap-2 self-start rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:brightness-110 lg:self-auto"
            >
              Browse live parts <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        {shops.isLoading ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[16/10] w-full rounded-3xl" />
                <Skeleton className="h-5 w-2/3 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        ) : shops.isError ? (
          <StoryEmpty
            className="mt-10"
            tone="warning"
            icon={<Store />}
            kicker="Connection issue"
            title="Supplier directory is unavailable"
            description="Please refresh and try again."
            actionLabel="Browse live parts"
            actionTo="/parts"
          />
        ) : shops.data?.length ? (
          <section className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {shops.data.map((shop, index) => (
              <ShopCard shop={shop} key={shop.id} color={PANEL_COLORS[index % PANEL_COLORS.length]} />
            ))}
          </section>
        ) : (
          <StoryEmpty
            className="mt-10"
            icon={<Store />}
            kicker="Opening soon"
            title="No approved shops yet"
            description="Approved suppliers will appear here once they publish stock."
            actionLabel="Apply as a supplier"
            actionTo="/seller"
            secondary={<QuietLink to="/services">Find a mechanic</QuietLink>}
          />
        )}
      </div>
    </main>
  );
}

function ShopCard({ shop, color }: { shop: Shop; color: string }) {
  const initials = shop.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <article className="group flex flex-col">
      <Link
        to="/parts/shops/$slug"
        params={{ slug: shop.slug }}
        className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div
          className={`relative grid aspect-[16/10] place-items-center overflow-hidden rounded-3xl text-ac-ink ${color}`}
        >
          <span className="font-brand text-7xl opacity-90 transition-transform duration-500 group-hover:scale-110">
            {initials}
          </span>
          {shop.is_verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-ac-ink px-2.5 py-1 text-[11px] font-bold text-white">
              <CheckCircle2 className="h-3.5 w-3.5 text-ac-accent" /> Verified
            </span>
          )}
          {shop.is_sample && (
            <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white">
              Preview
            </span>
          )}
        </div>
        <h2 className="font-brand mt-4 px-1 text-2xl">{shop.name}</h2>
      </Link>
      <div className="flex flex-1 flex-col px-1">
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
          {shop.description ?? "Approved supplier catalogue."}
        </p>
        <dl className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-ac-accent" />
            <dt className="sr-only">Location</dt>
            <dd>
              {shop.city ? `${shop.city}, ` : ""}
              {shop.country}
            </dd>
          </div>
          <div className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
            <dt className="sr-only">Shipping</dt>
            <dd>Ships to {shop.shipping_regions?.join(", ") || "regions confirmed in quote"}</dd>
          </div>
          {shop.return_policy && (
            <div className="flex items-start gap-2">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
              <dt className="sr-only">Returns</dt>
              <dd className="line-clamp-1">{shop.return_policy}</dd>
            </div>
          )}
        </dl>
        {shop.is_sample && (
          <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
            Preview supplier data — availability is illustrative.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/parts/shops/$slug"
            params={{ slug: shop.slug }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:gap-3"
          >
            View stock <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/support"
            className="inline-flex min-h-11 items-center gap-2 px-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Ask a question <Globe2 className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
