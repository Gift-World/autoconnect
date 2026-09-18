import { createFileRoute } from "@tanstack/react-router";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading leads...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Trade-In Leads"
        description="Review and negotiate trade-in offers from buyers."
      />

      {(!requests || requests.length === 0) ? (
        <Alert>
          <Car className="h-4 w-4" />
          <AlertTitle>No Trade-In Requests</AlertTitle>
          <AlertDescription>
            You don't have any active trade-in leads yet. When a buyer estimates their car's value against one of your listings, it will appear here.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div key={req.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={
                      req.status === 'accepted' ? 'border-green-500 text-green-500' :
                      req.status === 'rejected' ? 'border-red-500 text-red-500' :
                      'border-amber-500 text-amber-500'
                    }>
                      {req.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                      {req.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {req.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                      {req.status.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold">
                    {req.year} {req.make} {req.model}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 flex gap-4">
                    <span>Odometer: {req.mileage.toLocaleString()} km</span>
                    <span>Condition: {req.condition}</span>
                    <span>Location: {req.location}</span>
                  </p>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-right">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Est. Trade-In Value</p>
                  <p className="text-xl font-bold text-primary font-mono tracking-tight">
                    {formatPrice(req.est_min)} - {formatPrice(req.est_max)}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground">Target Purchase: </span>
                  <span className="font-medium">{req.cars?.title}</span>
                  <span className="ml-2 font-mono">{formatPrice(req.cars?.price || 0)}</span>
                </div>
                
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'rejected' })}
                    >
                      Decline
                    </Button>
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'accepted' })}
                    >
                      Accept Trade-In
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
