import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plane, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/account/import-requests")({
  component: ImportRequestsPage,
});

const statusColor: Record<string, string> = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning-foreground",
  fulfilled: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

function ImportRequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
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
        .from("import_requests").update({ status: "closed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request closed");
      qc.invalidateQueries({ queryKey: ["my-import-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<Plane className="h-5 w-5" />}
        title="No import requests yet"
        description="Tell us what car you're looking for and approved exporters worldwide can quote you."
        actionLabel="Submit import request"
        actionTo="/import"
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((r) => {
        const country = countryByCode(r.buyer_country);
        const source = r.preferred_source_country ? countryByCode(r.preferred_source_country) : null;
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor[r.status] ?? ""}`}>
                {r.status.replace("_", " ")}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
            </div>
            <h3 className="mt-2 text-base font-semibold">
              {r.make_name} {r.model_name ?? ""}
              {(r.year_from || r.year_to) && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {r.year_from ?? "?"} – {r.year_to ?? "?"}
                </span>
              )}
            </h3>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Budget: {r.budget_min ?? "?"} – {r.budget_max ?? "?"} {r.budget_currency}</span>
              <span>Deliver to: {country?.flag} {country?.name ?? r.buyer_country}</span>
              {source && <span>From: {source.flag} {source.name}</span>}
              {r.preferred_condition && (
                <Badge variant="outline" className="capitalize">{r.preferred_condition}</Badge>
              )}
            </div>
            {r.additional_notes && (
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {r.additional_notes}
              </p>
            )}
            {r.status !== "closed" && r.status !== "fulfilled" && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => close.mutate(r.id)}
                  disabled={close.isPending}
                >
                  <X className="mr-1 h-4 w-4" /> Close request
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
