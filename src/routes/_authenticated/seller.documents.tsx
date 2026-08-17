import { createFileRoute } from "@tanstack/react-router";
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
import { FileBadge, ShieldCheck } from "lucide-react";
import { DocumentManager } from "@/components/DocumentManager";
import { ListingChecklist } from "@/components/ListingChecklist";

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
        counts = (docs ?? []).reduce((acc, d) => {
          const k = d.car_id as string;
          acc[k] = acc[k] ?? { v: 0, p: 0 };
          if (d.status === "verified") acc[k].v += 1;
          if (d.status === "pending") acc[k].p += 1;
          return acc;
        }, {} as Record<string, { v: number; p: number }>);
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Documents & verification</h1>
        <p className="text-sm text-muted-foreground">
          Upload titles, registration, inspection and export paperwork per listing. Verified
          documents earn a trust badge on your listing.
        </p>
      </header>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading your listings…
        </div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
          <FileBadge className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-base font-semibold">Create a listing first</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Once you have at least one listing, you can attach its documents here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-2 sm:max-w-md">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Choose a listing
            </Label>
            <Select value={selected ?? undefined} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {listings.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.title} · {l.verified_count}✓ {l.pending_count > 0 ? `· ${l.pending_count} pending` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {current && (
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Listing</p>
                  <p className="text-base font-semibold">{current.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  {current.verified_count} verified · {current.pending_count} pending
                </div>
              </div>
              <div className="mb-4">
                <ListingChecklist carId={current.id} variant="seller" />
              </div>
              <DocumentManager carId={current.id} sellerId={user.id} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
