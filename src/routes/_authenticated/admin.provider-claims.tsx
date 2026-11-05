import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ShieldCheck, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AdminPage,
  AdminPanel,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  TAP,
  ageOf,
} from "@/components/admin/AdminUI";

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

  const count = claims.data?.length ?? 0;

  return (
    <AdminPage>
      <PageHeader
        eyebrow="Provider activation"
        title="Link real businesses safely"
        description="Approve a claim only after checking that the account holder represents the mechanic or garage. Approval unlocks that provider's booking inbox."
      />
      {claims.isError ? (
        <QueueError>The provider claims queue could not be loaded.</QueueError>
      ) : (
        <AdminPanel
          kicker="Ownership requests"
          title={claims.isLoading ? "Loading…" : `${count} waiting`}
          description="Oldest request first."
        >
          {claims.isLoading ? (
            <QueueSkeleton rows={3} />
          ) : count ? (
            <ul className="divide-y divide-border">
              {claims.data!.map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-col gap-4 p-4 sm:px-6 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ac-cream text-ac-ink">
                      <Wrench className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="brand-kicker text-muted-foreground">Ownership request</p>
                      <h2 className="font-brand mt-1 text-xl">
                        {claim.service_providers?.name ?? "Provider"}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {claim.service_providers?.city ? `${claim.service_providers.city}, ` : ""}
                        {claim.service_providers?.country}
                      </p>
                      <p className="mt-3 rounded-2xl bg-muted/60 p-3 text-sm">
                        {claim.note || "No verification note supplied."}
                      </p>
                      <p className="mt-2 break-all text-xs text-muted-foreground">
                        Account ID: {claim.claimant_id} · requested{" "}
                        {new Date(claim.created_at).toLocaleString()} ({ageOf(claim.created_at)}{" "}
                        ago)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:shrink-0 lg:justify-end">
                    <Button
                      variant="outline"
                      className={`${TAP} border-destructive/40 text-destructive hover:bg-destructive/10`}
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: claim.id, approve: false })}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      className={TAP}
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: claim.id, approve: true })}
                    >
                      <Check className="h-4 w-4" />
                      Link account
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <QueueEmpty
              icon={<ShieldCheck />}
              title="No provider claims awaiting review"
              description="A real mechanic or garage can request ownership from the service workspace."
            />
          )}
        </AdminPanel>
      )}
    </AdminPage>
  );
}
