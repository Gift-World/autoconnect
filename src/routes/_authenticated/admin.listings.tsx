import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Star,
  Eye,
  Sparkles,
  Loader2,
  ShieldAlert,
  FileCheck2,
  BadgeCheck,
  Wrench,
  Car,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiFraudCheck } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { countryByCode } from "@/lib/countries";
import { ListingChecklist } from "@/components/ListingChecklist";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  AiSuggestion,
  FilterChips,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";
import { DetailSheet } from "@/components/admin/DetailSheet";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  head: () => ({ meta: [{ title: "Listings — Admin — AutoConnect" }] }),
  component: AdminListingsPage,
});

type CarRow = {
  id: string;
  title: string;
  make_name: string | null;
  model_name: string | null;
  year: number;
  price: number;
  currency: string;
  country: string;
  status: string;
  featured: boolean;
  views: number;
  rejection_reason: string | null;
  created_at: string;
  documents_verified: boolean;
  ntsa_verified: boolean;
  inspection_verified: boolean;
  car_images: { image_url: string; is_primary: boolean }[];
};

type FraudResult = {
  risk: "low" | "medium" | "high";
  score: number;
  signals: string[];
  recommendation: "approve" | "review" | "reject";
  summary: string;
};

type Flag = "documents_verified" | "ntsa_verified" | "inspection_verified";

function AdminListingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<CarRow | null>(null);
  const [reason, setReason] = useState("");
  const [scans, setScans] = useState<Record<string, FraudResult | "loading">>({});
  const [openId, setOpenId] = useState<string | null>(null);

  async function runScan(c: CarRow) {
    setScans((s) => ({ ...s, [c.id]: "loading" }));
    try {
      // Pull description on demand (not in list query)
      const { data: full } = await supabase
        .from("cars")
        .select("description,mileage,condition")
        .eq("id", c.id)
        .maybeSingle();
      const result = await aiFraudCheck({
        data: {
          title: c.title,
          make: c.make_name,
          model: c.model_name,
          year: c.year,
          price: c.price,
          currency: c.currency,
          country: c.country,
          condition: full?.condition ?? null,
          mileage: full?.mileage ?? null,
          description: full?.description ?? null,
          image_count: c.car_images?.length ?? 0,
        },
      });
      setScans((s) => ({ ...s, [c.id]: result }));
    } catch (e) {
      setScans((s) => {
        const { [c.id]: _, ...rest } = s;
        return rest;
      });
      toast.error(e instanceof Error ? e.message : "AI scan failed");
    }
  }

  const carsQuery = useQuery({
    queryKey: ["admin-cars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select(
          "id, is_sample, title, make_name, model_name, year, price, currency, country, status, featured, views, rejection_reason, created_at, documents_verified, ntsa_verified, inspection_verified, car_images(image_url, is_primary)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CarRow[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-cars"] });

  // Realtime: refresh list when a new listing is submitted or status changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-cars-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "cars" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-cars"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  async function approve(c: CarRow) {
    const { error } = await supabase
      .from("cars")
      .update({ status: "approved", rejection_reason: null })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Listing approved");
    refresh();
  }
  async function toggleFeatured(c: CarRow) {
    const { error } = await supabase.from("cars").update({ featured: !c.featured }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.featured ? "Removed from featured" : "Marked as featured");
    refresh();
  }
  async function toggleFlag(c: CarRow, field: Flag) {
    const next = !c[field];
    const { error } = await supabase
      .from("cars")
      .update({ [field]: next })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Marked as checked" : "Unmarked");
    refresh();
  }
  async function submitReject() {
    if (!rejecting) return;
    const { error } = await supabase
      .from("cars")
      .update({ status: "rejected", rejection_reason: reason || "Not specified" })
      .eq("id", rejecting.id);
    if (error) return toast.error(error.message);
    toast.success("Listing rejected");
    setRejecting(null);
    setReason("");
    refresh();
  }

  const all = carsQuery.data ?? [];
  const term = q.trim().toLowerCase();
  const filter = (rows: CarRow[]) =>
    term
      ? rows.filter(
          (r) =>
            r.title.toLowerCase().includes(term) ||
            r.make_name?.toLowerCase().includes(term) ||
            r.model_name?.toLowerCase().includes(term),
        )
      : rows;

  // Pending is a queue: oldest submission first.
  const pending = oldestFirst(
    filter(all.filter((c) => c.status === "pending")),
    (c) => c.created_at,
  );
  const approved = filter(all.filter((c) => c.status === "approved"));
  const rejected = filter(all.filter((c) => c.status === "rejected"));
  const sold = filter(all.filter((c) => c.status === "sold"));

  const groups: Record<string, CarRow[]> = { pending, approved, rejected, sold };
  const rows = groups[tab] ?? pending;
  const openCar = all.find((c) => c.id === openId) ?? null;

  const startReject = (c: CarRow) => {
    setOpenId(null);
    setRejecting(c);
  };

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Listing quality queue"
        title="Review with evidence"
        description="Approve, reject or feature listings based on the details and documents actually provided."
      />

      <AdminToolbar
        filters={
          <FilterChips
            label="Listing status"
            active={tab}
            onSelect={setTab}
            options={[
              { key: "pending", label: "Pending", count: pending.length },
              { key: "approved", label: "Approved", count: approved.length },
              { key: "rejected", label: "Rejected", count: rejected.length },
              { key: "sold", label: "Sold", count: sold.length },
            ]}
          />
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search by title, make, or model…"
      />

      {carsQuery.isError && (
        <QueueError>
          Listings could not load. This is not an empty result — refresh to retry.
        </QueueError>
      )}

      <AdminPanel>
        {carsQuery.isLoading ? (
          <QueueSkeleton rows={5} media />
        ) : rows.length === 0 ? (
          <QueueEmpty
            icon={<Car />}
            title={tab === "pending" ? "No listings waiting" : "No listings in this group"}
            description={
              tab === "pending"
                ? "New submissions appear here in real time, oldest first."
                : "Try another status or clear the search."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <ListingRow
                key={c.id}
                c={c}
                scan={scans[c.id]}
                onOpen={() => setOpenId(c.id)}
                onApprove={() => approve(c)}
                onReject={() => startReject(c)}
              />
            ))}
          </ul>
        )}
      </AdminPanel>

      {/* Review sheet */}
      <DetailSheet
        open={!!openCar}
        onOpenChange={(o) => !o && setOpenId(null)}
        kicker="Listing review"
        title={openCar?.title ?? "Listing"}
        footer={
          openCar && (
            <>
              {openCar.status === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  className={TAP}
                  onClick={() => toggleFeatured(openCar)}
                >
                  <Star
                    className={`h-4 w-4 ${openCar.featured ? "fill-accent text-accent" : ""}`}
                  />
                  {openCar.featured ? "Unfeature" : "Feature"}
                </Button>
              )}
              {openCar.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                  onClick={() => startReject(openCar)}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
              )}
              {openCar.status !== "approved" && (
                <Button size="sm" className={TAP} onClick={() => approve(openCar)}>
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
            </>
          )
        }
      >
        {openCar && (
          <ListingDetail
            c={openCar}
            scan={scans[openCar.id]}
            onScan={() => runScan(openCar)}
            onToggleFlag={(f) => toggleFlag(openCar, f)}
          />
        )}
      </DetailSheet>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
          </DialogHeader>
          <Label htmlFor="lr">Reason</Label>
          <Textarea
            id="lr"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this listing being rejected?"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" className={TAP} onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" className={TAP} onClick={submitReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}

function primaryImage(c: CarRow) {
  return c.car_images.find((i) => i.is_primary) ?? c.car_images[0];
}

function ListingRow({
  c,
  scan,
  onOpen,
  onApprove,
  onReject,
}: {
  c: CarRow;
  scan: FraudResult | "loading" | undefined;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const primary = primaryImage(c);
  const country = countryByCode(c.country);
  const checks = [c.documents_verified, c.ntsa_verified, c.inspection_verified].filter(
    Boolean,
  ).length;
  return (
    <li className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:px-6">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-4 text-left"
      >
        <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
          {primary ? (
            <img
              src={primary.image_url}
              alt={c.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{c.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {c.year} · {c.make_name} {c.model_name} · {country?.flag} {country?.name ?? c.country}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <StatusPill status={c.status} />
            {c.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {checks}/3 checks
            </span>
            {scan && scan !== "loading" && (
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  scan.risk === "high"
                    ? "bg-destructive/10 text-destructive"
                    : scan.risk === "medium"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                AI risk: {scan.risk}
              </span>
            )}
            {c.status === "pending" && (
              <span className="text-[11px] text-muted-foreground">
                waiting {ageOf(c.created_at)}
              </span>
            )}
          </div>
          {c.rejection_reason && (
            <p className="mt-2 line-clamp-1 text-xs text-destructive">
              Rejected: {c.rejection_reason}
            </p>
          )}
        </div>
        <div className="hidden shrink-0 text-right md:block">
          <div className="font-semibold tabular-nums">
            {c.currency} {c.price.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" /> {c.views}
          </div>
        </div>
        <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
      </button>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className="font-semibold tabular-nums md:hidden">
          {c.currency} {c.price.toLocaleString()}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className={TAP} onClick={onOpen}>
            Review
          </Button>
          {c.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                onClick={onReject}
                aria-label={`Reject ${c.title}`}
              >
                <XCircle className="h-4 w-4" />
                <span className="hidden lg:inline">Reject</span>
              </Button>
              <Button size="sm" className={TAP} onClick={onApprove}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function FlagButton({
  on,
  icon,
  label,
  onClick,
}: {
  on: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex min-h-11 items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-left text-sm transition ${
        on
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-border bg-card hover:border-foreground/30"
      }`}
    >
      <span className="flex items-center gap-2 font-semibold [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        {label}
      </span>
      <span className="text-xs">{on ? "Checked" : "Mark checked"}</span>
    </button>
  );
}

function ListingDetail({
  c,
  scan,
  onScan,
  onToggleFlag,
}: {
  c: CarRow;
  scan: FraudResult | "loading" | undefined;
  onScan: () => void;
  onToggleFlag: (f: Flag) => void;
}) {
  const primary = primaryImage(c);
  const country = countryByCode(c.country);
  return (
    <div className="space-y-5">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {primary ? (
          <img src={primary.image_url} alt={c.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            No photo
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {c.year} · {c.make_name} {c.model_name} · {country?.flag} {country?.name ?? c.country}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusPill status={c.status} />
            {c.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
          </div>
        </div>
        <div className="text-right">
          <div className="font-brand text-2xl tabular-nums">
            {c.currency} {c.price.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" /> {c.views} views · submitted {ageOf(c.created_at)} ago
          </div>
        </div>
      </div>

      {c.rejection_reason && (
        <div className="rounded-2xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Rejected: {c.rejection_reason}
        </div>
      )}

      <Button size="sm" variant="outline" asChild className={TAP}>
        <Link to="/cars/$id" params={{ id: c.id }}>
          <ExternalLink className="h-4 w-4" /> View public listing
        </Link>
      </Button>

      <section>
        <p className="brand-kicker mb-2 text-muted-foreground">Evidence checks</p>
        <div className="grid gap-2">
          <FlagButton
            on={c.documents_verified}
            icon={<FileCheck2 />}
            label="Logbook"
            onClick={() => onToggleFlag("documents_verified")}
          />
          <FlagButton
            on={c.ntsa_verified}
            icon={<BadgeCheck />}
            label="NTSA"
            onClick={() => onToggleFlag("ntsa_verified")}
          />
          <FlagButton
            on={c.inspection_verified}
            icon={<Wrench />}
            label="Inspection"
            onClick={() => onToggleFlag("inspection_verified")}
          />
        </div>
      </section>

      <section>
        <ListingChecklist carId={c.id} variant="admin" />
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="brand-kicker text-muted-foreground">Fraud check</p>
          <Button
            size="sm"
            variant="outline"
            className={TAP}
            disabled={scan === "loading"}
            onClick={onScan}
          >
            {scan === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 text-accent" />
            )}
            {scan && scan !== "loading" ? "Run AI scan again" : "AI scan"}
          </Button>
        </div>
        {scan && scan !== "loading" ? (
          <AiSuggestion
            tone={scan.risk}
            title={
              <span className="inline-flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                AI risk: {scan.risk.toUpperCase()} · score {scan.score}/100 · recommend{" "}
                {scan.recommendation}
              </span>
            }
          >
            <p>{scan.summary}</p>
            {scan.signals.length > 0 && (
              <ul className="mt-1 list-inside list-disc">
                {scan.signals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </AiSuggestion>
        ) : (
          <p className="text-xs text-muted-foreground">
            Run an AI scan for price, description and photo red flags. It is a suggestion — you make
            the decision.
          </p>
        )}
      </section>
    </div>
  );
}
