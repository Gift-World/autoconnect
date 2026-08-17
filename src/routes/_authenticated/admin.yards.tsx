import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, Star, Store, ExternalLink, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { countryByCode } from "@/lib/countries";
import { QueueToolbar } from "@/components/admin/QueueToolbar";

export const Route = createFileRoute("/_authenticated/admin/yards")({
  head: () => ({ meta: [{ title: "Car yards — Admin — AutoConnect" }] }),
  component: AdminYardsPage,
});

type YardRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  country: string;
  city: string | null;
  phone: string | null;
  is_approved: boolean;
  is_featured: boolean;
  is_suspended: boolean;
  rejection_reason: string | null;
  created_at: string;
};

function AdminYardsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<YardRow | null>(null);
  const [reason, setReason] = useState("");

  const yardsQuery = useQuery({
    queryKey: ["admin-yards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_yards")
        .select(
          "id,slug,name,tagline,logo_url,country,city,phone,is_approved,is_featured,is_suspended,rejection_reason,created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as YardRow[];
    },
  });

  const all = yardsQuery.data ?? [];
  const counts = useMemo(
    () => [
      {
        key: "pending",
        label: "Waiting for review",
        count: all.filter((y) => !y.is_approved && !y.is_suspended).length,
      },
      {
        key: "live",
        label: "Live",
        count: all.filter((y) => y.is_approved && !y.is_suspended).length,
      },
      {
        key: "suspended",
        label: "Suspended",
        count: all.filter((y) => y.is_suspended).length,
      },
    ],
    [all],
  );

  const rows = all.filter((y) => {
    const inTab =
      tab === "pending"
        ? !y.is_approved && !y.is_suspended
        : tab === "live"
          ? y.is_approved && !y.is_suspended
          : y.is_suspended;
    if (!inTab) return false;
    const term = q.trim().toLowerCase();
    if (!term) return true;
    return `${y.name} ${y.city ?? ""}`.toLowerCase().includes(term);
  });

  async function patch(id: string, values: Partial<YardRow>, msg: string) {
    const { error } = await supabase.from("car_yards").update(values).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(msg);
    await qc.invalidateQueries({ queryKey: ["admin-yards"] });
  }

  return (
    <div className="space-y-5">
      <QueueToolbar
        title="Car yards"
        description="Approve dealership storefronts, feature the best ones, suspend bad actors."
        counts={counts}
        active={tab}
        onSelect={setTab}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search yards…"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {yardsQuery.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nothing here.</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((y) => {
              const c = countryByCode(y.country);
              return (
                <div
                  key={y.id}
                  className="flex flex-wrap items-center gap-4 p-4"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
                    {y.logo_url ? (
                      <img src={y.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-5 w-5 text-muted-foreground" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{y.name}</p>
                      {y.is_featured && (
                        <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                          Featured
                        </Badge>
                      )}
                      {y.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {c?.flag} {y.city ? `${y.city}, ` : ""}
                      {c?.name ?? y.country}
                      {y.phone ? ` · ${y.phone}` : ""}
                    </p>
                    {y.rejection_reason && !y.is_approved && (
                      <p className="mt-1 text-xs text-destructive">
                        Changes requested: {y.rejection_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {y.is_approved && (
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/yards/$slug" params={{ slug: y.slug }}>
                          <ExternalLink className="mr-1.5 h-4 w-4" /> View
                        </Link>
                      </Button>
                    )}
                    {!y.is_approved && (
                      <Button
                        size="sm"
                        onClick={() =>
                          void patch(
                            y.id,
                            { is_approved: true, is_suspended: false, rejection_reason: null },
                            "Yard approved and live",
                          )
                        }
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                      </Button>
                    )}
                    {!y.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRejecting(y);
                          setReason("");
                        }}
                      >
                        <XCircle className="mr-1.5 h-4 w-4" /> Request changes
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void patch(
                          y.id,
                          { is_featured: !y.is_featured },
                          y.is_featured ? "Unfeatured" : "Featured",
                        )
                      }
                    >
                      <Star className="mr-1.5 h-4 w-4" />
                      {y.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      size="sm"
                      variant={y.is_suspended ? "outline" : "destructive"}
                      onClick={() =>
                        void patch(
                          y.id,
                          { is_suspended: !y.is_suspended },
                          y.is_suspended ? "Yard restored" : "Yard suspended",
                        )
                      }
                    >
                      <Ban className="mr-1.5 h-4 w-4" />
                      {y.is_suspended ? "Restore" : "Suspend"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={Boolean(rejecting)} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request changes</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the yard owner what needs fixing (photos, address, contact details)…"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!rejecting) return;
                await patch(
                  rejecting.id,
                  { is_approved: false, rejection_reason: reason || "Please review your yard details." },
                  "Feedback sent to yard owner",
                );
                setRejecting(null);
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
