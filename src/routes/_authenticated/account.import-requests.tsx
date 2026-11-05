import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, MapPin, Plane, Plus, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { countryByCode } from "@/lib/countries";
import {
  ErrorNotice,
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton, secondaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/account/import-requests")({
  component: ImportRequestsPage,
});

const statusColor: Record<string, string> = {
  open: "border-ac-accent/40 bg-ac-accent/10 text-foreground",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  fulfilled: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "border-border bg-muted text-muted-foreground",
};

function ImportRequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["my-import-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_requests")
        .select("*")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const close = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("import_requests")
        .update({ status: "closed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request closed");
      qc.invalidateQueries({ queryKey: ["my-import-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const active = rows.filter((r) => r.status !== "closed" && r.status !== "fulfilled");
  const finished = rows.filter((r) => r.status === "closed" || r.status === "fulfilled");

  const renderRow = (r: (typeof rows)[number]) => {
    const country = countryByCode(r.buyer_country);
    const source = r.preferred_source_country ? countryByCode(r.preferred_source_country) : null;
    return (
      <article key={r.id} className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusColor[r.status] ?? ""}`}
          >
            {r.status.replace("_", " ")}
          </span>
          <span className="text-xs text-muted-foreground">
            Sent {new Date(r.created_at).toLocaleDateString()}
          </span>
        </div>
        <h3 className="font-brand mt-3 text-2xl">
          {r.make_name} {r.model_name ?? ""}
          {(r.year_from || r.year_to) && (
            <span className="ml-2 font-sans text-sm font-semibold tracking-normal text-muted-foreground">
              {r.year_from ?? "?"} – {r.year_to ?? "?"}
            </span>
          )}
        </h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Budget</dt>
              <dd className="font-semibold">
                {r.budget_min ?? "?"} – {r.budget_max ?? "?"} {r.budget_currency}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Deliver to</dt>
              <dd className="font-semibold">
                {country?.flag} {country?.name ?? r.buyer_country}
              </dd>
            </div>
          </div>
          {source && (
            <div className="flex items-start gap-2">
              <Plane className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" />
              <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">From</dt>
                <dd className="font-semibold">
                  {source.flag} {source.name}
                </dd>
              </div>
            </div>
          )}
        </dl>
        {r.preferred_condition && (
          <Badge variant="outline" className="mt-3 capitalize">
            {r.preferred_condition}
          </Badge>
        )}
        {r.additional_notes && (
          <p className="mt-3 line-clamp-3 rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
            {r.additional_notes}
          </p>
        )}
        {r.status !== "closed" && r.status !== "fulfilled" && (
          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => close.mutate(r.id)}
              disabled={close.isPending}
            >
              <X className="h-4 w-4" /> Close request
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Import support"
        title="Import requests"
        description="Cars you asked approved exporters to source. Close a request once you no longer need quotes."
        actions={
          <Link to="/import" className={primaryButton}>
            <Plus className="h-4 w-4" /> New import request
          </Link>
        }
      />

      <StatRow className="lg:grid-cols-3">
        <StatTile label="Open requests" value={active.length} icon={<Clock />} tone="ink" loading={isLoading} />
        <StatTile
          label="Fulfilled"
          value={rows.filter((r) => r.status === "fulfilled").length}
          icon={<CheckCircle2 />}
          loading={isLoading}
        />
        <StatTile label="All time" value={rows.length} icon={<Plane />} loading={isLoading} />
      </StatRow>

      {isLoading ? (
        <ListSkeleton rows={2} className="h-44" />
      ) : isError ? (
        <ErrorNotice title="We couldn't load your import requests" onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Plane className="h-5 w-5" />}
          title="No import requests yet"
          description="Tell us what car you're looking for and approved exporters worldwide can quote you."
          actionLabel="Submit import request"
          actionTo="/import"
        />
      ) : (
        <>
          <section>
            <SectionHeading kicker="Waiting on quotes" title="Active" />
            {active.length ? (
              <div className="space-y-3">{active.map(renderRow)}</div>
            ) : (
              <p className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No active requests. Start a new one when you're ready.
              </p>
            )}
          </section>
          {finished.length > 0 && (
            <section>
              <SectionHeading kicker="History" title="Closed and fulfilled" />
              <div className="space-y-3">{finished.map(renderRow)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
