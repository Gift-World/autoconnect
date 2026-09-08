import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/provider-claims")({
  head: () => ({ meta: [{ title: "Provider claims — Admin — AutoConnect" }] }),
  component: ProviderClaimsPage,
});

type Claim = {
  id: string;
  claimant_id: string;
  note: string | null;
  created_at: string;
  service_providers: { name: string; city: string | null; country: string } | null;
};

function ProviderClaimsPage() {
  const queryClient = useQueryClient();
  const claims = useQuery({
    queryKey: ["admin-service-provider-claims"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_claims")
        .select("id,claimant_id,note,created_at,service_providers(name,city,country)")
        .eq("status", "requested")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as Claim[];
    },
  });
  const resolve = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const { error } = await supabase.rpc("resolve_service_provider_claim", {
        p_claim_id: id,
        p_approve: approve,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-service-provider-claims"] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Provider activation"
        title="Link real businesses safely"
        description="Approve a claim only after checking that the account holder represents the mechanic or garage. Approval unlocks that provider's booking inbox."
      />
      {claims.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">The provider claims queue could not be loaded.</p>
      ) : claims.data?.length ? (
        <div className="grid gap-3">
          {claims.data.map((claim) => (
            <article key={claim.id} className="app-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Ownership request</p>
                <h2 className="mt-1 font-display text-lg font-bold">{claim.service_providers?.name ?? "Provider"}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{claim.service_providers?.city ? `${claim.service_providers.city}, ` : ""}{claim.service_providers?.country}</p>
                <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">{claim.note || "No verification note supplied."}</p>
                <p className="mt-2 text-xs text-muted-foreground">Account ID: {claim.claimant_id} · requested {new Date(claim.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" disabled={resolve.isPending} onClick={() => resolve.mutate({ id: claim.id, approve: false })}><X className="mr-2 h-4 w-4" />Reject</Button>
                <Button disabled={resolve.isPending} onClick={() => resolve.mutate({ id: claim.id, approve: true })}><Check className="mr-2 h-4 w-4" />Link account</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="No provider claims awaiting review" description="A real mechanic or garage can request ownership from the service workspace." />
      )}
    </div>
  );
}
