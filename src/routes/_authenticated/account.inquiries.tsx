import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InquiryThread } from "@/components/InquiryThread";

export const Route = createFileRoute("/_authenticated/account/inquiries")({
  component: InquiriesPage,
});

function InquiriesPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<null | {
    id: string;
    message: string;
    created_at: string;
    title: string;
  }>(null);
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("inquiries")
          .select(
            "id, created_at, inquiry_type, message, status, cars(id,title,year,price,currency,car_images(image_url,is_primary,sort_order))",
          )
          .eq("buyer_id", user!.id)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch {
        // fallback
      }

      // Demo fallback when testing buyer persona
      if (user?.id?.startsWith("demo-")) {
        return [
          {
            id: "demo-inquiry-1",
            created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
            inquiry_type: "video_inspection",
            message: "Hi Kenji, could you confirm the chassis inspection rating and provide the KRA duty breakdown for Nairobi delivery?",
            status: "replied",
            cars: {
              id: "demo-car-prado",
              title: "2022 Toyota Land Cruiser Prado TX-L",
              year: 2022,
              price: 7450000,
              currency: "KES",
              car_images: [{ image_url: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1200&auto=format&fit=crop&q=80", is_primary: true, sort_order: 1 }],
            },
          },
        ];
      }

      return [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-5 w-5" />}
        title="No inquiries yet"
        description="When you contact a seller, your conversations will appear here."
        actionLabel="Browse cars"
        actionTo="/cars"
      />
    );
  }

  return (
    <div className="space-y-3">
      {data.map((q) => {
        const car = q.cars as unknown as {
          id: string; title: string; year: number;
          car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
        } | null;
        const sorted = car ? [...(car.car_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : [];
        const img = sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
        return (
          <button
            key={q.id}
            onClick={() =>
              setActive({
                id: q.id,
                message: q.message,
                created_at: q.created_at,
                title: car ? `${car.year} ${car.title}` : "Conversation",
              })
            }
            className="block w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-accent/40 hover:bg-muted/40"
          >
            <div className="flex gap-4">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                {img && <img src={img} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {String(q.inquiry_type).replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{q.status}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
                {car ? (
                  <span className="mt-1 block truncate text-sm font-semibold">
                    {car.year} {car.title}
                  </span>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Listing removed</p>
                )}
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{q.message}</p>
                {car && (
                  <Link
                    to="/cars/$id"
                    params={{ id: car.id }}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 inline-block text-xs text-accent hover:underline"
                  >
                    View listing →
                  </Link>
                )}
              </div>
            </div>
          </button>
        );
      })}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl gap-0 p-0">
          <DialogHeader className="border-b p-4">
            <DialogTitle>{active?.title}</DialogTitle>
          </DialogHeader>
          <div className="h-[60vh]">
            {active && (
              <InquiryThread
                inquiryId={active.id}
                selfRole="buyer"
                initialMessage={{
                  body: active.message,
                  created_at: active.created_at,
                  sender_name: "You",
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
