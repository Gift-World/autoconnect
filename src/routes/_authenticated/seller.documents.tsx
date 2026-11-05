import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Clock3, FileBadge, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { EmptyPanel, ListSkeleton, StatTile } from "@/components/seller/SellerUI";
import { DocumentManager } from "@/components/DocumentManager";
import { ListingChecklist } from "@/components/ListingChecklist";
import { PageHeader } from "@/components/layout/PageHeader";

export const Route = createFileRoute("/_authenticated/seller/documents")({
  component: SellerDocuments,
});

interface Listing {
  id: string;
  title: string;
  status: string;
  verified_count: number;
  pending_count: number;
}

function SellerDocuments() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: sellerRow } = await supabase
        .from("sellers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!sellerRow) {
        setListings([]);
        setLoading(false);
        return;
      }
      const { data: cars } = await supabase
        .from("cars")
        .select("id,title,status")
        .eq("seller_id", sellerRow.id)
        .order("created_at", { ascending: false });
      const ids = (cars ?? []).map((c) => c.id);
      let counts: Record<string, { v: number; p: number }> = {};
      if (ids.length) {
        const { data: docs } = await supabase
          .from("car_documents")
          .select("car_id,status")
          .in("car_id", ids);
        counts = (docs ?? []).reduce(
          (acc, d) => {
            const k = d.car_id as string;
            acc[k] = acc[k] ?? { v: 0, p: 0 };
            if (d.status === "verified") acc[k].v += 1;
            if (d.status === "pending") acc[k].p += 1;
            return acc;
          },
          {} as Record<string, { v: number; p: number }>,
        );
      }
      const merged: Listing[] = (cars ?? []).map((c) => ({
        id: c.id as string,
        title: c.title as string,
        status: c.status as string,
        verified_count: counts[c.id as string]?.v ?? 0,
        pending_count: counts[c.id as string]?.p ?? 0,
      }));
      setListings(merged);
      setSelected((cur) => cur ?? merged[0]?.id ?? null);
      setLoading(false);
    })();
  }, [user?.id]);

  const current = useMemo(
    () => listings.find((l) => l.id === selected) ?? null,
    [listings, selected],
  );

  if (!user) return null;

  const totalVerified = listings.reduce((s, l) => s + l.verified_count, 0);
  const totalPending = listings.reduce((s, l) => s + l.pending_count, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Seller evidence centre"
        title="Documents, clearly organised"
        description="Attach the paperwork you actually hold to the right listing. Buyers and reviewers can then see what has been checked."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          featured
          icon={<FileBadge />}
          label="Listings"
          value={listings.length}
          sub="Pick one to manage its papers"
          loading={loading}
        />
        <StatTile
          icon={<ShieldCheck />}
          tone="success"
          label="Verified"
          value={totalVerified}
          sub="Checked by reviewers"
          loading={loading}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            icon={<Clock3 />}
            tone="warning"
            label="Pending"
            value={totalPending}
            sub="Waiting for review"
            loading={loading}
          />
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : listings.length === 0 ? (
        <EmptyPanel
          icon={<FileBadge />}
          title="Create a listing first"
          description="Once you have at least one listing, you can attach its documents here."
          action={
            <Button asChild className="h-11 rounded-full">
              <Link to="/seller/listings/new" search={{ edit: undefined }}>
                Create a listing
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          {/* Picker: select on small screens, list on large */}
          <div className="min-w-0">
            <div className="grid gap-2 lg:hidden">
              <Label className="brand-kicker text-muted-foreground">Choose a listing</Label>
              <Select value={selected ?? undefined} onValueChange={setSelected}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title} · {l.verified_count}✓{" "}
                      {l.pending_count > 0 ? `· ${l.pending_count} pending` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden lg:block">
              <p className="brand-kicker mb-2 text-muted-foreground">Choose a listing</p>
              <ul className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto">
                {listings.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(l.id)}
                      aria-pressed={l.id === selected}
                      className={`w-full rounded-2xl border p-3 text-left transition ${
                        l.id === selected
                          ? "border-foreground bg-card ring-1 ring-foreground"
                          : "border-border bg-card hover:border-foreground/30"
                      }`}
                    >
                      <span className="line-clamp-2 text-sm font-semibold">{l.title}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusPill status={l.status} />
                        <span className="text-[11px] text-muted-foreground">
                          {l.verified_count}✓
                          {l.pending_count > 0 ? ` · ${l.pending_count} pending` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {current && (
            <section className="min-w-0 rounded-3xl border border-border bg-card p-4 sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div className="min-w-0">
                  <p className="brand-kicker text-muted-foreground">Listing</p>
                  <p className="font-brand mt-1 text-xl">{current.title}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {current.verified_count} verified · {current.pending_count} pending
                </div>
              </div>
              <div className="mb-5">
                <ListingChecklist carId={current.id} variant="seller" />
              </div>
              <div className="min-w-0 overflow-x-auto">
                <DocumentManager carId={current.id} sellerId={user.id} />
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
