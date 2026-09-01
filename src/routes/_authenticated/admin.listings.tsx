import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Star, Eye, Sparkles, Loader2, ShieldAlert, FileCheck2, BadgeCheck, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiFraudCheck } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

function AdminListingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<CarRow | null>(null);
  const [reason, setReason] = useState("");
  const [scans, setScans] = useState<Record<string, FraudResult | "loading">>({});

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
        .select("id, title, make_name, model_name, year, price, currency, country, status, featured, views, rejection_reason, created_at, documents_verified, ntsa_verified, inspection_verified, car_images(image_url, is_primary)")
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cars" },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-cars"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  async function approve(c: CarRow) {
    const { error } = await supabase.from("cars").update({ status: "approved", rejection_reason: null }).eq("id", c.id);
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
  async function toggleFlag(c: CarRow, field: "documents_verified" | "ntsa_verified" | "inspection_verified") {
    const next = !c[field];
    const { error } = await supabase.from("cars").update({ [field]: next }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Marked as checked" : "Unmarked");
    refresh();
  }
  async function submitReject() {
    if (!rejecting) return;
    const { error } = await supabase.from("cars").update({ status: "rejected", rejection_reason: reason || "Not specified" }).eq("id", rejecting.id);
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

  const pending = filter(all.filter((c) => c.status === "pending"));
  const approved = filter(all.filter((c) => c.status === "approved"));
  const rejected = filter(all.filter((c) => c.status === "rejected"));
  const sold = filter(all.filter((c) => c.status === "sold"));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Listings</h1>
        <p className="text-sm text-muted-foreground">Approve, reject, or feature car listings.</p>
      </header>

      <Input
        placeholder="Search by title, make, or model…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({sold.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          <CarsList rows={pending} scans={scans} onScan={runScan} onApprove={approve} onReject={(c) => setRejecting(c)} onFeature={toggleFeatured} onToggleFlag={toggleFlag} />
        </TabsContent>
        <TabsContent value="approved" className="mt-4">
          <CarsList rows={approved} scans={scans} onScan={runScan} onApprove={approve} onReject={(c) => setRejecting(c)} onFeature={toggleFeatured} onToggleFlag={toggleFlag} />
        </TabsContent>
        <TabsContent value="rejected" className="mt-4">
          <CarsList rows={rejected} scans={scans} onScan={runScan} onApprove={approve} onReject={(c) => setRejecting(c)} onFeature={toggleFeatured} onToggleFlag={toggleFlag} />
        </TabsContent>
        <TabsContent value="sold" className="mt-4">
          <CarsList rows={sold} scans={scans} onScan={runScan} onApprove={approve} onReject={(c) => setRejecting(c)} onFeature={toggleFeatured} onToggleFlag={toggleFlag} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
          </DialogHeader>
          <Label htmlFor="lr">Reason</Label>
          <Textarea id="lr" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this listing being rejected?" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={submitReject}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
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
    <Button
      size="sm"
      variant={on ? "default" : "outline"}
      className={on ? "bg-emerald-600 hover:bg-emerald-600/90" : ""}
      onClick={onClick}
    >
      {icon}
      {label}: {on ? "Checked" : "Mark checked"}
    </Button>
  );
}

function CarsList({
  rows,
  scans,
  onScan,
  onApprove,
  onReject,
  onFeature,
  onToggleFlag,
}: {
  rows: CarRow[];
  scans: Record<string, FraudResult | "loading">;
  onScan: (c: CarRow) => void;
  onApprove: (c: CarRow) => void;
  onReject: (c: CarRow) => void;
  onFeature: (c: CarRow) => void;
  onToggleFlag: (c: CarRow, field: "documents_verified" | "ntsa_verified" | "inspection_verified") => void;
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">No listings in this group.</div>;
  }
  return (
    <div className="space-y-3">
      {rows.map((c) => {
        const primary = c.car_images.find((i) => i.is_primary) ?? c.car_images[0];
        const country = countryByCode(c.country);
        return (
          <div key={c.id} className="flex flex-wrap gap-4 rounded-lg border bg-card p-4 shadow-sm">
            <div className="h-24 w-32 flex-shrink-0 overflow-hidden rounded-md bg-muted">
              {primary ? (
                <img src={primary.image_url} alt={c.title} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">No photo</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{c.title}</h3>
                  <div className="text-xs text-muted-foreground">
                    {c.year} · {c.make_name} {c.model_name} · {country?.flag} {country?.name ?? c.country}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{c.currency} {c.price.toLocaleString()}</div>
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {c.views}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline">{c.status}</Badge>
                {c.featured && <Badge className="bg-accent text-accent-foreground">Featured</Badge>}
              </div>
              {c.rejection_reason && (
                <div className="mt-2 rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  Rejected: {c.rejection_reason}
                </div>
              )}
              <div className="mt-3">
                <ListingChecklist carId={c.id} variant="admin" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <FlagButton on={c.documents_verified} icon={<FileCheck2 className="mr-1 h-4 w-4" />} label="Logbook" onClick={() => onToggleFlag(c, "documents_verified")} />
                <FlagButton on={c.ntsa_verified} icon={<BadgeCheck className="mr-1 h-4 w-4" />} label="NTSA" onClick={() => onToggleFlag(c, "ntsa_verified")} />
                <FlagButton on={c.inspection_verified} icon={<Wrench className="mr-1 h-4 w-4" />} label="Inspection" onClick={() => onToggleFlag(c, "inspection_verified")} />
              </div>
              {scans[c.id] && scans[c.id] !== "loading" && (() => {
                const r = scans[c.id] as FraudResult;
                const tone =
                  r.risk === "high"
                    ? "border-destructive/30 bg-destructive/10 text-destructive"
                    : r.risk === "medium"
                      ? "border-amber-300 bg-amber-50 text-amber-900"
                      : "border-emerald-300 bg-emerald-50 text-emerald-900";
                return (
                  <div className={`mt-2 rounded-md border px-3 py-2 text-xs ${tone}`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      AI risk: {r.risk.toUpperCase()} · score {r.score}/100 · recommend {r.recommendation}
                    </div>
                    <p className="mt-1">{r.summary}</p>
                    {r.signals.length > 0 && (
                      <ul className="mt-1 list-inside list-disc">
                        {r.signals.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    )}
                  </div>
                );
              })()}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to="/cars/$id" params={{ id: c.id }}>
                  <Button size="sm" variant="outline">View</Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={scans[c.id] === "loading"}
                  onClick={() => onScan(c)}
                >
                  {scans[c.id] === "loading" ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-4 w-4 text-accent" />
                  )}
                  AI scan
                </Button>
                {c.status !== "approved" && (
                  <Button size="sm" onClick={() => onApprove(c)}>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Approve
                  </Button>
                )}
                {c.status !== "rejected" && (
                  <Button size="sm" variant="destructive" onClick={() => onReject(c)}>
                    <XCircle className="mr-1 h-4 w-4" /> Reject
                  </Button>
                )}
                {c.status === "approved" && (
                  <Button size="sm" variant="outline" onClick={() => onFeature(c)}>
                    <Star className={`mr-1 h-4 w-4 ${c.featured ? "fill-accent text-accent" : ""}`} />
                    {c.featured ? "Unfeature" : "Feature"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
