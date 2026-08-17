import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Eye, Pencil, Plus, Trash2, Car as CarIcon, Clock3, CheckCircle2, AlertTriangle, TrendingUp, MessageSquare } from "lucide-react";
import { countryByCode } from "@/lib/countries";
import { SellerReadiness } from "@/components/seller/SellerReadiness";
import { StatusPill } from "@/components/StatusPill";

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
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data: sellerRow } = await supabase
      .from("sellers")
      .select("id, is_approved, is_suspended, rejection_reason")
      .eq("profile_id", u.user.id)
      .maybeSingle();
    if (!sellerRow) {
      setSellerId(null);
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
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows(
      (cars ?? []).map((c: any) => {
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
      }),
    );
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

  const total = rows?.length ?? 0;
  const approved = rows?.filter((r) => r.status === "approved").length ?? 0;
  const pending = rows?.filter((r) => r.status === "pending").length ?? 0;
  const views = rows?.reduce((s, r) => s + (r.views ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      {seller && !seller.is_approved && !seller.is_suspended && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4">
          <Clock3 className="mt-0.5 h-5 w-5 text-warning" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">Your seller account is under review</p>
            <p className="mt-0.5 text-muted-foreground">
              You can prepare listings now — they'll go live once an admin approves your account. We'll notify you as soon as you're approved.
            </p>
          </div>
        </div>
      )}
      {seller?.is_suspended && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">Account suspended</p>
            <p className="mt-0.5 text-muted-foreground">
              {seller.rejection_reason ?? "Contact support to resolve this."}
            </p>
          </div>
        </div>
      )}
      {seller?.is_approved && (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
          <div className="flex-1 text-sm">
            <p className="font-semibold text-foreground">You're approved to sell</p>
            <p className="mt-0.5 text-muted-foreground">New listings still pass through a quick quality review before going live.</p>
          </div>
        </div>
      )}

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your inventory, replies and account at a glance.
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link to="/seller/listings/new">
            <Plus className="mr-2 h-4 w-4" /> New listing
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<CarIcon className="h-4 w-4" />} label="Listings" value={total} tone="primary" />
        <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Live" value={approved} tone="success" sub={`${pending} pending`} />
        <Stat icon={<TrendingUp className="h-4 w-4" />} label="Total views" value={views.toLocaleString()} tone="primary" />
        <Stat icon={<MessageSquare className="h-4 w-4" />} label="Unread inquiries" value={openInquiries} tone="accent" />
      </div>

      {sellerId && <SellerReadiness sellerId={sellerId} />}

      <h2 className="text-xl font-semibold tracking-tight">My listings</h2>

      {rows === null ? (
        <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : !sellerId ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Your seller profile is being prepared. Please refresh in a moment.
            </p>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <CarIcon className="h-10 w-10 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">No listings yet</h3>
              <p className="text-sm text-muted-foreground">
                Add your first vehicle to start receiving inquiries.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link to="/seller/listings/new">
                <Plus className="mr-2 h-4 w-4" /> Create listing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Views</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const country = countryByCode(r.country);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-16 overflow-hidden rounded bg-muted">
                          {r.primary_image ? (
                            <img
                              src={r.primary_image}
                              alt={r.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{r.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {r.year}
                            {r.featured && " · Featured"}
                            {r.available_for_export && " · Export"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.currency}{" "}
                      {Number(r.price).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {country ? `${country.flag} ${country.name}` : r.country}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.views}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="View">
                          <Link to="/cars/$id" params={{ id: r.id }}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Edit (coming soon)"
                          disabled
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" title="Delete">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove "{r.title}" and its
                                photos. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteListing(r.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  tone?: "primary" | "success" | "accent";
}) {
  const toneClass =
    tone === "success" ? "bg-success/10 text-success"
    : tone === "accent" ? "bg-accent/10 text-accent"
    : "bg-primary/10 text-primary";
  return (
    <Card className="border-border/60 shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tracking-tight">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
