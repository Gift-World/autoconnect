import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BadgeCheck,
  Clock3,
  Eye,
  FileBadge,
  FileSpreadsheet,
  Gavel,
  Inbox,
  Pencil,
  Plus,
  Store,
  Trash2,
  Wallet,
  Wrench,
  Zap,
  Car as CarIcon,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { SellerReadiness } from "@/components/seller/SellerReadiness";
import { StatusPill } from "@/components/StatusPill";
import { DEMO_MODE } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnalyticsChart } from "@/components/seller/AnalyticsChart";
import { EmptyPanel, ListSkeleton, Notice, Panel, StatTile } from "@/components/seller/SellerUI";

export const Route = createFileRoute("/_authenticated/seller/")({
  component: SellerDashboard,
});

interface ListingRow {
  id: string;
  title: string;
  status: string;
  price: number;
  currency: string;
  country: string;
  year: number;
  views: number;
  featured: boolean;
  available_for_export: boolean;
  created_at: string;
  primary_image?: string | null;
}

const DEMO_SELLER_ROWS: ListingRow[] = [
  {
    id: "demo-car-1",
    title: "2021 Toyota Land Cruiser Prado TX-L 2.8D",
    status: "approved",
    price: 6850000,
    currency: "KES",
    country: "KE",
    year: 2021,
    views: 312,
    featured: true,
    available_for_export: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    primary_image:
      "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "demo-car-2",
    title: "2020 Mercedes-Benz C200 AMG Line",
    status: "approved",
    price: 4800000,
    currency: "KES",
    country: "KE",
    year: 2020,
    views: 184,
    featured: false,
    available_for_export: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    primary_image:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "demo-car-3",
    title: "2021 Toyota Harrier Hybrid G-Edition",
    status: "approved",
    price: 4450000,
    currency: "KES",
    country: "KE",
    year: 2021,
    views: 420,
    featured: true,
    available_for_export: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    primary_image:
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60",
  },
  {
    id: "demo-car-4",
    title: "2021 BMW 530i M Sport",
    status: "pending",
    price: 5400000,
    currency: "KES",
    country: "KE",
    year: 2021,
    views: 95,
    featured: false,
    available_for_export: true,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    primary_image:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=60",
  },
];

function SellerDashboard() {
  const [rows, setRows] = useState<ListingRow[] | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [seller, setSeller] = useState<{
    is_approved: boolean;
    is_suspended: boolean;
    rejection_reason: string | null;
  } | null>(null);
  const [openInquiries, setOpenInquiries] = useState(0);

  async function load() {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user && DEMO_MODE) {
        setSellerId("demo-seller-kenji");
        setSeller({ is_approved: true, is_suspended: false, rejection_reason: null });
        setOpenInquiries(3);
        setRows(DEMO_SELLER_ROWS);
        return;
      }
      if (!u?.user) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const { data: sellerRow } = await supabase
        .from("sellers")
        .select("id, is_approved, is_suspended, rejection_reason")
        .eq("profile_id", u.user.id)
        .maybeSingle();

      if (!sellerRow && DEMO_MODE) {
        setSellerId("demo-seller-kenji");
        setSeller({ is_approved: true, is_suspended: false, rejection_reason: null });
        setOpenInquiries(3);
        setRows(DEMO_SELLER_ROWS);
        return;
      }
      if (!sellerRow) {
        setSellerId(null);
        setSeller(null);
        setOpenInquiries(0);
        setRows([]);
        return;
      }

      setSellerId(sellerRow.id);
      setSeller({
        is_approved: sellerRow.is_approved,
        is_suspended: sellerRow.is_suspended,
        rejection_reason: sellerRow.rejection_reason,
      });

      const { count: openCount } = await supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("seller_id", sellerRow.id)
        .eq("is_read", false);
      setOpenInquiries(openCount ?? 0);

      const { data: cars, error } = await supabase
        .from("cars")
        .select(
          "id, title, status, price, currency, country, year, views, featured, available_for_export, created_at, car_images(image_url, is_primary, sort_order)",
        )
        .eq("seller_id", sellerRow.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (cars ?? []).map((c: any) => {
        const imgs = (c.car_images ?? []) as {
          image_url: string;
          is_primary: boolean;
          sort_order: number;
        }[];
        const primary =
          imgs.find((i) => i.is_primary)?.image_url ??
          imgs.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url ??
          null;
        return { ...c, primary_image: primary };
      });

      setRows(mapped);
    } catch (error) {
      setSellerId(null);
      setSeller(null);
      setOpenInquiries(0);
      setRows([]);
      toast.error((error as any)?.message || "Unable to load live seller data.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteListing(id: string) {
    const { error } = await supabase.from("cars").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Listing deleted");
      load();
    }
  }

  async function handleBoostListing(carId: string) {
    if (!sellerId) return;
    try {
      const res = await fetch("/api/public/stripe-checkout-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          sellerId,
          returnUrl: window.location.href,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to initiate boost checkout.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate boost");
    }
  }


  const total = rows?.length ?? 0;
  const approved = rows?.filter((r) => r.status === "approved").length ?? 0;
  const pending = rows?.filter((r) => r.status === "pending").length ?? 0;
  const views = rows?.reduce((s, r) => s + (r.views ?? 0), 0) ?? 0;
  const loading = rows === null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Seller workspace"
        title="Today in your showroom"
        description="What needs you now, how your cars are doing, and everything else one tap away."
        actions={
          <>
            <Button asChild variant="outline" className="h-11 rounded-full px-5">
              <Link to="/seller/listings/import">
                <FileSpreadsheet className="h-4 w-4" /> Bulk import
              </Link>
            </Button>
            <Button
              asChild
              className="h-11 rounded-full bg-ac-accent px-5 text-ac-ink hover:bg-ac-accent/90"
            >
              <Link to="/seller/listings/new" search={{ edit: undefined }}>
                <Plus className="h-4 w-4" /> New listing
              </Link>
            </Button>
          </>
        }
      />

      {seller && !seller.is_approved && !seller.is_suspended && (
        <Notice
          tone="warning"
          icon={<Clock3 />}
          title="Your seller account is under review"
          action={
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link to="/seller/verify">Check verification</Link>
            </Button>
          }
        >
          You can prepare listings now — they'll go live once an admin approves your account.
          We'll notify you as soon as you're approved.
        </Notice>
      )}
      {seller?.is_suspended && (
        <Notice tone="danger" icon={<AlertTriangle />} title="Account suspended">
          {seller.rejection_reason ?? "Contact support to resolve this."}
        </Notice>
      )}
      {seller?.is_approved && (
        <Notice tone="success" icon={<CheckCircle2 />} title="You're approved to sell">
          New listings still pass through a quick quality review before going live.
        </Notice>
      )}

      {/* Stat row — the numbers a seller checks first */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Link
          to="/seller/inquiries"
          className="rounded-3xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <StatTile
            featured
            icon={<MessageSquare />}
            label="Unread inquiries"
            value={openInquiries}
            sub={openInquiries > 0 ? "Reply while interest is warm" : "All caught up"}
            loading={loading}
          />
        </Link>
        <StatTile
          icon={<CheckCircle2 />}
          tone="success"
          label="Live"
          value={approved}
          sub={`${pending} pending`}
          loading={loading}
        />
        <StatTile
          icon={<TrendingUp />}
          tone="accent"
          label="Total views"
          value={views.toLocaleString()}
          sub="Across all listings"
          loading={loading}
        />
        <StatTile
          icon={<CarIcon />}
          label="Listings"
          value={total}
          sub="In your inventory"
          loading={loading}
        />
      </div>

      {/* Needs your attention */}
      {(openInquiries > 0 || pending > 0 || sellerId) && (
        <section className="space-y-3" aria-labelledby="attention-heading">
          <div>
            <p className="brand-kicker text-muted-foreground">Needs your attention</p>
            <h2 id="attention-heading" className="font-brand mt-1 text-2xl sm:text-3xl">
              Start here
            </h2>
          </div>
          {(openInquiries > 0 || pending > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {openInquiries > 0 && (
                <AttentionCard
                  to="/seller/inquiries"
                  icon={<MessageSquare />}
                  title={`${openInquiries} unread ${openInquiries === 1 ? "inquiry" : "inquiries"}`}
                  body="Buyers are waiting for a reply. Fast answers win more sales."
                  cta="Open inquiries"
                />
              )}
              {pending > 0 && (
                <AttentionCard
                  to="/seller/documents"
                  icon={<Clock3 />}
                  title={`${pending} ${pending === 1 ? "listing" : "listings"} waiting for review`}
                  body="Add documents so the review team can approve faster."
                  cta="Add documents"
                />
              )}
            </div>
          )}
          {sellerId && <SellerReadiness sellerId={sellerId} />}
        </section>
      )}

      {/* Listings */}
      <Panel
        kicker="Inventory"
        title="My listings"
        description={
          rows && rows.length > 0
            ? `${total} ${total === 1 ? "car" : "cars"} · ${approved} live · ${pending} pending`
            : undefined
        }
        actions={
          rows && rows.length > 0 ? (
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link to="/seller/listings/new" search={{ edit: undefined }}>
                <Plus className="h-4 w-4" /> Add a car
              </Link>
            </Button>
          ) : undefined
        }
      >
        {rows === null ? (
          <ListSkeleton rows={3} />
        ) : !sellerId ? (
          <EmptyPanel
            icon={<Store />}
            title="Your seller profile is being prepared"
            description="Please refresh in a moment. If this keeps showing, finish your seller verification."
            action={
              <Button asChild className="h-11 rounded-full">
                <Link to="/seller/verify">Go to verification</Link>
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyPanel
            icon={<CarIcon />}
            title="No listings yet"
            description="Add your first vehicle to start receiving inquiries."
            action={
              <>
                <Button
                  asChild
                  className="h-11 rounded-full bg-ac-accent px-5 text-ac-ink hover:bg-ac-accent/90"
                >
                  <Link to="/seller/listings/new" search={{ edit: undefined }}>
                    <Plus className="h-4 w-4" /> Create listing
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full">
                  <Link to="/seller/listings/import">Bulk import</Link>
                </Button>
              </>
            }
          />
        ) : (
          <>
            {/* md and up: table that scrolls inside its own container */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border md:block">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vehicle</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Country</th>
                    <th className="px-4 py-3 font-semibold">Views</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const country = countryByCode(r.country);
                    return (
                      <tr key={r.id} className="border-t border-border transition hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ListingThumb row={r} className="aspect-[4/3] w-20" />
                            <div className="min-w-0">
                              <div className="max-w-[240px] truncate font-semibold">{r.title}</div>
                              <ListingFlags row={r} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={r.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold">
                          {formatPrice(r)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {country ? `${country.flag} ${country.name}` : r.country}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.views}</td>
                        <td className="px-4 py-3">
                          <ListingActions
                            row={r}
                            onBoost={handleBoostListing}
                            onDelete={deleteListing}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Below md: cards */}
            <div className="grid gap-3 sm:grid-cols-2 md:hidden">
              {rows.map((r) => {
                const country = countryByCode(r.country);
                return (
                  <article
                    key={r.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <ListingThumb row={r} className="aspect-[4/3] w-full rounded-none" />
                    <div className="flex-1 space-y-2 p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusPill status={r.status} />
                      </div>
                      <h3 className="line-clamp-2 font-semibold leading-snug">{r.title}</h3>
                      <p className="font-brand text-xl">{formatPrice(r)}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {r.views} views
                        </span>
                        <span aria-hidden>•</span>
                        <span>{country?.name ?? r.country}</span>
                      </div>
                      <ListingFlags row={r} />
                    </div>
                    <div className="border-t border-border px-2 py-1">
                      <ListingActions
                        row={r}
                        onBoost={handleBoostListing}
                        onDelete={deleteListing}
                        className="justify-between"
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </Panel>

      {rows && rows.length > 0 && <AnalyticsChart listings={rows} />}

      {/* Everything else */}
      <section className="space-y-3" aria-labelledby="everything-else">
        <p id="everything-else" className="brand-kicker text-muted-foreground">
          Everything else
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map((s) => (
            <Link
              key={s.to}
              to={s.to as never}
              className="group flex min-h-[88px] items-start gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-foreground/20 hover:bg-muted/40"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-foreground [&_svg]:h-4 [&_svg]:w-4">
                {s.icon}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  {s.label}
                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                  {s.body}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

const SHORTCUTS: { to: string; label: string; body: string; icon: ReactNode }[] = [
  {
    to: "/seller/transactions",
    label: "Transactions & payouts",
    body: "Sales, held payments and handover.",
    icon: <Wallet />,
  },
  { to: "/seller/yard", label: "My car yard", body: "Your public storefront.", icon: <Store /> },
  {
    to: "/seller/documents",
    label: "Documents",
    body: "Paperwork for each listing.",
    icon: <FileBadge />,
  },
  {
    to: "/seller/inspections",
    label: "Inspections",
    body: "Request an independent check.",
    icon: <Wrench />,
  },
  {
    to: "/seller/auctions",
    label: "Auctions & flash offers",
    body: "Schedule a timed sale.",
    icon: <Gavel />,
  },
  {
    to: "/seller/trade-ins",
    label: "Trade-in leads",
    body: "Buyers offering their car in part-exchange.",
    icon: <ArrowRightLeft />,
  },
  {
    to: "/seller/import-requests",
    label: "Import requests",
    body: "Open requests from buyers abroad.",
    icon: <Inbox />,
  },
  {
    to: "/seller/verify",
    label: "Verify account",
    body: "Identity and business documents.",
    icon: <BadgeCheck />,
  },
];

function formatPrice(r: ListingRow) {
  return `${r.currency} ${Number(r.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function AttentionCard({
  to,
  icon,
  title,
  body,
  cta,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      to={to as never}
      className="group flex items-center gap-4 rounded-3xl border border-ac-accent/30 bg-ac-accent/10 p-4 transition hover:border-ac-accent/60 sm:p-5"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm leading-6 text-muted-foreground">{body}</span>
      </span>
      <span className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-foreground sm:inline-flex">
        {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
      <ArrowRight className="h-5 w-5 shrink-0 sm:hidden" aria-label={cta} />
    </Link>
  );
}

function ListingThumb({ row, className }: { row: ListingRow; className?: string }) {
  return (
    <div className={`shrink-0 overflow-hidden rounded-xl bg-muted ${className ?? ""}`}>
      {row.primary_image ? (
        <img
          src={row.primary_image}
          alt={row.title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <CarIcon className="h-5 w-5" />
          No image
        </div>
      )}
    </div>
  );
}

function ListingFlags({ row }: { row: ListingRow }) {
  const flags: string[] = [];
  if (row.featured) flags.push("Featured", "Premium ⚡");
  if (row.available_for_export) flags.push("Export");
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span>{row.year}</span>
      {flags.map((f) => (
        <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
          {f}
        </span>
      ))}
    </div>
  );
}

function ListingActions({
  row,
  onBoost,
  onDelete,
  className,
}: {
  row: ListingRow;
  onBoost: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-1 ${className ?? ""}`}>
      <Button asChild size="icon" variant="ghost" className="h-11 w-11 rounded-full" title="View">
        <Link to="/cars/$id" params={{ id: row.id }} aria-label={`View ${row.title}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      {!row.featured && (
        <Button
          size="icon"
          variant="ghost"
          title="Boost Listing ($19.99)"
          aria-label="Boost listing ($19.99)"
          className="h-11 w-11 rounded-full text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-400 dark:hover:bg-amber-500/10"
          onClick={() => onBoost(row.id)}
        >
          <Zap className="h-4 w-4" />
        </Button>
      )}
      <Button
        asChild
        size="icon"
        variant="ghost"
        className="h-11 w-11 rounded-full"
        title="Edit listing"
      >
        <Link to="/seller/listings/new" search={{ edit: row.id }} aria-label="Edit listing">
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="h-11 w-11 rounded-full text-destructive"
            title="Delete"
            aria-label="Delete listing"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{row.title}" and its photos. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(row.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
