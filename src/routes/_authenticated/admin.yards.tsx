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
import { StatusPill } from "@/components/StatusPill";
import {
  AdminPage,
  AdminPanel,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP,
  ageOf,
  oldestFirst,
} from "@/components/admin/AdminUI";

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

  const all = useMemo(() => yardsQuery.data ?? [], [yardsQuery.data]);
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

  // Waiting yards read oldest-first.
  const ordered = tab === "pending" ? oldestFirst(rows, (y) => y.created_at) : rows;

  return (
    <AdminPage>
      <QueueToolbar
        eyebrow="Moderation"
        title="Car yards"
        description="Approve dealership storefronts, feature the best ones, suspend bad actors."
        counts={counts}
        active={tab}
        onSelect={setTab}
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search yards…"
      />

      {yardsQuery.isError && (
        <QueueError>
          Car yards could not load. This is not an empty result — refresh to retry.
        </QueueError>
      )}

      <AdminPanel>
        {yardsQuery.isLoading ? (
          <QueueSkeleton rows={4} />
        ) : ordered.length === 0 ? (
          <QueueEmpty
            icon={<Store />}
            title="Nothing here"
            description={
              tab === "pending"
                ? "No dealership storefronts are waiting for review."
                : "No yards in this group. Try another filter or clear the search."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {ordered.map((y) => {
              const c = countryByCode(y.country);
              return (
                <li
                  key={y.id}
                  className="flex flex-col gap-3 p-4 transition hover:bg-muted/30 sm:px-6 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-background">
                      {y.logo_url ? (
                        <img
                          src={y.logo_url}
                          alt={`${y.name} logo`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{y.name}</p>
                        {y.is_suspended ? (
                          <StatusPill status="suspended" />
                        ) : y.is_approved ? (
                          <StatusPill status="approved" />
                        ) : (
                          <StatusPill status="pending" />
                        )}
                        {y.is_featured && (
                          <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                            Featured
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {c?.flag} {y.city ? `${y.city}, ` : ""}
                        {c?.name ?? y.country}
                        {y.phone ? ` · ${y.phone}` : ""}
                        {!y.is_approved && !y.is_suspended && ` · waiting ${ageOf(y.created_at)}`}
                      </p>
                      {y.rejection_reason && !y.is_approved && (
                        <p className="mt-1 text-xs text-destructive">
                          Changes requested: {y.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {y.is_approved && (
                      <Button asChild variant="ghost" size="sm" className={TAP}>
                        <Link to="/yards/$slug" params={{ slug: y.slug }}>
                          <ExternalLink className="h-4 w-4" /> View
                        </Link>
                      </Button>
                    )}
                    {!y.is_approved && (
                      <Button
                        size="sm"
                        className={TAP}
                        onClick={() =>
                          void patch(
                            y.id,
                            { is_approved: true, is_suspended: false, rejection_reason: null },
                            "Yard approved and live",
                          )
                        }
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                    )}
                    {!y.is_approved && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={TAP}
                        onClick={() => {
                          setRejecting(y);
                          setReason("");
                        }}
                      >
                        <XCircle className="h-4 w-4" /> Request changes
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className={TAP}
                      onClick={() =>
                        void patch(
                          y.id,
                          { is_featured: !y.is_featured },
                          y.is_featured ? "Unfeatured" : "Featured",
                        )
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${y.is_featured ? "fill-accent text-accent" : ""}`}
                      />
                      {y.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        y.is_suspended
                          ? TAP
                          : `${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`
                      }
                      onClick={() =>
                        void patch(
                          y.id,
                          { is_suspended: !y.is_suspended },
                          y.is_suspended ? "Yard restored" : "Yard suspended",
                        )
                      }
                    >
                      <Ban className="h-4 w-4" />
                      {y.is_suspended ? "Restore" : "Suspend"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>

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
          <DialogFooter className="gap-2">
            <Button variant="outline" className={TAP} onClick={() => setRejecting(null)}>
              Cancel
            </Button>
            <Button
              className={TAP}
              onClick={async () => {
                if (!rejecting) return;
                await patch(
                  rejecting.id,
                  {
                    is_approved: false,
                    rejection_reason: reason || "Please review your yard details.",
                  },
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
    </AdminPage>
  );
}
