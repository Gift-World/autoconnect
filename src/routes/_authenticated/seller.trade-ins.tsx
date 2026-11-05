import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Car, DollarSign, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EmptyPanel, ListSkeleton, StatTile } from "@/components/seller/SellerUI";

export const Route = createFileRoute("/_authenticated/seller/trade-ins")({
  component: SellerTradeIns,
});

function SellerTradeIns() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();

  const { data: seller } = useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: requests, isLoading } = useQuery({
    queryKey: ["trade_in_requests", seller?.id],
    queryFn: async () => {
      if (!seller?.id) return [];
      const { data, error } = await supabase
        .from("trade_in_requests")
        .select(`
          *,
          cars ( title, price )
        `)
        .eq("seller_id", seller.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[];
    },
    enabled: !!seller?.id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("trade_in_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade_in_requests"] });
      toast.success("Trade-in status updated");
    },
  });

  const all = requests ?? [];
  const pendingCount = all.filter((r) => r.status === "pending").length;
  const acceptedCount = all.filter((r) => r.status === "accepted").length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Leads"
        title="Trade-In Leads"
        description="Review and negotiate trade-in offers from buyers."
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          featured
          icon={<Clock />}
          label="Waiting on you"
          value={pendingCount}
          sub="Pending decisions"
          loading={isLoading}
        />
        <StatTile
          icon={<CheckCircle />}
          tone="success"
          label="Accepted"
          value={acceptedCount}
          loading={isLoading}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatTile icon={<Car />} label="All leads" value={all.length} loading={isLoading} />
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !requests || requests.length === 0 ? (
        <EmptyPanel
          icon={<Car />}
          title="No Trade-In Requests"
          description="You don't have any active trade-in leads yet. When a buyer estimates their car's value against one of your listings, it will appear here."
          action={
            <Button asChild variant="outline" className="h-11 rounded-full">
              <Link to="/seller">Review your listings</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {[...requests]
            .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"))
            .map((req) => (
              <article
                key={req.id}
                className={`rounded-3xl border bg-card p-4 sm:p-6 ${
                  req.status === "pending" ? "border-ac-accent/40" : "border-border"
                }`}
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          req.status === "accepted"
                            ? "border-green-500 text-green-600 dark:text-green-400"
                            : req.status === "rejected"
                              ? "border-red-500 text-red-600 dark:text-red-400"
                              : "border-amber-500 text-amber-700 dark:text-amber-400"
                        }
                      >
                        {req.status === "pending" && <Clock className="mr-1 h-3 w-3" />}
                        {req.status === "accepted" && <CheckCircle className="mr-1 h-3 w-3" />}
                        {req.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {req.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <h3 className="font-brand text-2xl leading-tight">
                      {req.year} {req.make} {req.model}
                    </h3>
                    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>Odometer: {req.mileage.toLocaleString()} km</span>
                      <span>Condition: {req.condition}</span>
                      <span>Location: {req.location}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-ac-ink p-4 text-white sm:min-w-[220px] sm:text-right">
                    <p className="brand-kicker mb-1 text-ac-accent">Est. Trade-In Value</p>
                    <p className="font-brand text-xl">
                      {formatPrice(req.est_min)} - {formatPrice(req.est_max)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 text-sm">
                    <span className="text-muted-foreground">Target Purchase: </span>
                    <span className="font-semibold">{req.cars?.title}</span>
                    <span className="ml-2 font-mono">{formatPrice(req.cars?.price || 0)}</span>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="h-11 flex-1 rounded-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10 sm:flex-none"
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: "rejected" })}
                      >
                        Decline
                      </Button>
                      <Button
                        className="h-11 flex-1 rounded-full bg-green-600 text-white hover:bg-green-700 sm:flex-none"
                        onClick={() => updateStatusMutation.mutate({ id: req.id, status: "accepted" })}
                      >
                        Accept Trade-In
                      </Button>
                    </div>
                  )}
                </div>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
