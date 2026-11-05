import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/StatusPill";
import { aiListingQuality } from "@/lib/ai.functions";
import {
  REQUIRED_PHOTO_KINDS,
  REQUIRED_DOC_KINDS,
  PHOTO_LABELS,
  DOC_LABELS,
  missingPhotoKinds,
  missingDocKinds,
} from "@/lib/listing-checklist";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

type ListingGap = {
  id: string;
  title: string;
  status: string;
  year: number;
  price: number;
  currency: string;
  country: string;
  description: string | null;
  rejection_reason: string | null;
  photoCount: number;
  missingPhotos: string[];
  missingDocs: string[];
  inspectionStatus: string | null;
};

type Quality = {
  readiness: "ready" | "needs_work" | "incomplete";
  warnings: string[];
  tips: string[];
};

/** Seller-facing "what still needs your attention" panel. */
export function SellerReadiness({ sellerId }: { sellerId: string }) {
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<{ approved: boolean; level: number } | null>(null);
  const [listings, setListings] = useState<ListingGap[]>([]);
  const [quality, setQuality] = useState<Record<string, Quality | "loading">>({});

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const [sellerRes, carsRes] = await Promise.all([
        supabase
          .from("sellers")
          .select("is_approved, verification_level")
          .eq("id", sellerId)
          .maybeSingle(),
        supabase
          .from("cars")
          .select(
            "id, title, status, year, price, currency, country, description, rejection_reason, car_images(photo_kind), car_documents(kind), inspections(status)",
          )
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (!active) return;

      setVerified({
        approved: Boolean(sellerRes.data?.is_approved),
        level: Number((sellerRes.data as any)?.verification_level ?? 0),
      });

      const rows: ListingGap[] = ((carsRes.data ?? []) as any[]).map((c) => {
        const photos = (c.car_images ?? []).map((i: any) => i.photo_kind);
        const docs = (c.car_documents ?? []).map((d: any) => d.kind);
        const insp = (c.inspections ?? [])[0];
        return {
          id: c.id,
          title: c.title,
          status: c.status,
          year: c.year,
          price: Number(c.price),
          currency: c.currency,
          country: c.country,
          description: c.description,
          rejection_reason: c.rejection_reason,
          photoCount: photos.length,
          missingPhotos: missingPhotoKinds(photos),
          missingDocs: missingDocKinds(docs),
          inspectionStatus: insp?.status ?? null,
        };
      });
      setListings(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [sellerId]);

  async function runQuality(l: ListingGap) {
    setQuality((s) => ({ ...s, [l.id]: "loading" }));
    try {
      const result = await aiListingQuality({
        data: {
          title: l.title,
          year: l.year,
          price: l.price,
          currency: l.currency,
          country: l.country,
          description: l.description,
          photo_count: l.photoCount,
          missing_photos: l.missingPhotos.map((k) => PHOTO_LABELS[k as never] ?? k),
          missing_documents: l.missingDocs.map((k) => DOC_LABELS[k] ?? k),
          rejection_reason: l.rejection_reason,
        },
      });
      setQuality((s) => ({ ...s, [l.id]: result as Quality }));
    } catch (e) {
      setQuality((s) => {
        const { [l.id]: _drop, ...rest } = s;
        return rest;
      });
      toast.error(e instanceof Error ? e.message : "Quality check failed");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6" aria-busy="true">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  const needsAttention = listings.filter(
    (l) =>
      l.missingPhotos.length > 0 ||
      l.missingDocs.length > 0 ||
      l.status === "rejected" ||
      !l.inspectionStatus,
  );

  const steps = [
    { label: "Seller account approved", done: Boolean(verified?.approved) },
    { label: "Identity verification submitted", done: (verified?.level ?? 0) >= 1 },
    {
      label: "All required photos uploaded",
      done: listings.length > 0 && listings.every((l) => l.missingPhotos.length === 0),
    },
    {
      label: "All required documents uploaded",
      done: listings.length > 0 && listings.every((l) => l.missingDocs.length === 0),
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="grid gap-4 border-b border-border p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:items-center">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-brand text-xl">Your progress</h3>
            <span className="text-sm font-semibold text-muted-foreground">
              {doneCount} of {steps.length} steps done
            </span>
          </div>
          <Progress value={(doneCount / steps.length) * 100} className="mt-3 h-2" />
          {!verified?.approved && (
            <Button asChild variant="outline" className="mt-4 h-11 rounded-full">
              <Link to="/seller/verify">Complete verification</Link>
            </Button>
          )}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {steps.map((s) => (
            <li
              key={s.label}
              className={`flex items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${
                s.done ? "bg-success/10" : "bg-muted/50"
              }`}
            >
              {s.done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span className={s.done ? "text-foreground" : "text-muted-foreground"}>
                {s.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="divide-y divide-border">
        {needsAttention.length === 0 ? (
          <div className="flex items-center gap-3 p-4 text-sm text-muted-foreground sm:px-6">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            Nothing outstanding — every listing has its required photos and documents.
          </div>
        ) : (
          needsAttention.map((l) => {
            const q = quality[l.id];
            return (
              <div key={l.id} className="space-y-3 p-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      to="/cars/$id"
                      params={{ id: l.id }}
                      className="block truncate font-semibold hover:underline"
                    >
                      {l.title}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <StatusPill status={l.status} />
                      {l.inspectionStatus ? (
                        <StatusPill status={l.inspectionStatus} />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Wrench className="h-3 w-3" /> No inspection requested
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="h-11 shrink-0 rounded-full"
                    onClick={() => runQuality(l)}
                    disabled={q === "loading"}
                  >
                    {q === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-foreground" />
                    )}
                    Check listing quality
                  </Button>
                </div>

                {l.rejection_reason && (
                  <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    Reason for rejection: {l.rejection_reason}
                  </p>
                )}

                {(l.missingPhotos.length > 0 || l.missingDocs.length > 0) && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {l.missingPhotos.length > 0 && (
                      <p className="rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                        <Camera className="mr-1 inline h-3.5 w-3.5" />
                        <span className="font-semibold text-foreground">
                          Missing photos ({l.missingPhotos.length}/{REQUIRED_PHOTO_KINDS.length}):
                        </span>{" "}
                        {l.missingPhotos.map((k) => PHOTO_LABELS[k as never] ?? k).join(", ")}
                      </p>
                    )}
                    {l.missingDocs.length > 0 && (
                      <p className="rounded-xl bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                        <FileText className="mr-1 inline h-3.5 w-3.5" />
                        <span className="font-semibold text-foreground">
                          Missing documents ({l.missingDocs.length}/{REQUIRED_DOC_KINDS.length}):
                        </span>{" "}
                        {l.missingDocs.map((k) => DOC_LABELS[k] ?? k).join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {q && q !== "loading" && (
                  <div className="rounded-2xl border border-ac-accent/30 bg-ac-accent/5 p-4 text-sm">
                    <p className="mb-1.5 flex items-center gap-2 font-semibold">
                      <Sparkles className="h-4 w-4 text-foreground" />
                      {q.readiness === "ready"
                        ? "Looks ready for review"
                        : q.readiness === "needs_work"
                          ? "A few things could delay approval"
                          : "Important items are still missing"}
                    </p>
                    <ul className="list-disc space-y-0.5 pl-5 text-xs leading-5 text-muted-foreground">
                      {q.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                      {q.tips.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
