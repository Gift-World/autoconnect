import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight, Clock, MessageSquare, MessagesSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InquiryThread } from "@/components/InquiryThread";
import { VehicleImage } from "@/components/VehicleImage";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ErrorNotice,
  ListSkeleton,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/account/inquiries")({
  component: InquiriesPage,
});

type ActiveThread = {
  id: string;
  message: string;
  created_at: string;
  title: string;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Waiting for seller",
  responded: "Seller replied",
  closed: "Closed",
};

function InquiriesPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<null | ActiveThread>(null);
  const { data, isLoading, isError, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["buyer-inquiries", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select(
          "id, created_at, inquiry_type, message, status, cars(id,title,year,price,currency,car_images(image_url,is_primary,sort_order))",
        )
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const rows = data ?? [];
  const replied = rows.filter((q) => q.status === "responded");
  const waiting = rows.filter((q) => q.status !== "responded" && q.status !== "closed");
  const closed = rows.filter((q) => q.status === "closed");

  const renderRow = (q: (typeof rows)[number]) => {
    const car = q.cars as unknown as {
      id: string;
      title: string;
      year: number;
      car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
    } | null;
    const sorted = car ? [...(car.car_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : [];
    const img = sorted.find((i) => i.is_primary)?.image_url ?? sorted[0]?.image_url ?? null;
    const open = () =>
      setActive({
        id: q.id,
        message: q.message,
        created_at: q.created_at,
        title: car ? `${car.year} ${car.title}` : "Conversation",
      });
    return (
      <article
        key={q.id}
        className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-3 transition hover:border-ac-accent/50 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
      >
        <button
          type="button"
          onClick={open}
          className="flex min-w-0 flex-1 gap-3 text-left sm:gap-4"
          aria-label={`Open conversation about ${car ? `${car.year} ${car.title}` : "a removed listing"}`}
        >
          <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl bg-muted sm:w-32">
            <VehicleImage src={img} alt="" year={car?.year} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="capitalize">
                {String(q.inquiry_type).replace("_", " ")}
              </Badge>
              <Badge
                variant="outline"
                className={
                  q.status === "responded"
                    ? "border-ac-accent/50 bg-ac-accent/10 text-foreground"
                    : "capitalize"
                }
              >
                {STATUS_LABEL[q.status] ?? q.status}
              </Badge>
            </div>
            {car ? (
              <span className="mt-1.5 block truncate text-sm font-bold">
                {car.year} {car.title}
              </span>
            ) : (
              <p className="mt-1.5 text-sm text-muted-foreground">Listing removed</p>
            )}
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{q.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(q.created_at).toLocaleDateString()}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 gap-2 border-t border-border pt-3 sm:flex-col sm:border-0 sm:pt-0">
          <button
            type="button"
            onClick={open}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-ac-ink px-4 text-sm font-bold text-white transition hover:bg-ac-ink-soft dark:bg-white dark:text-ac-ink"
          >
            <MessageSquare className="h-4 w-4" /> Open
          </button>
          {car && (
            <Link
              to="/cars/$id"
              params={{ id: car.id }}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              View listing <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Conversations"
        title="My inquiries"
        description="Every message you sent to a seller. Replies show first so you never miss one."
        actions={
          <Link to="/cars" className={primaryButton}>
            <Search className="h-4 w-4" /> Browse cars
          </Link>
        }
      />

      <StatRow className="lg:grid-cols-3">
        <StatTile
          label="Seller replied"
          value={replied.length}
          icon={<MessagesSquare />}
          hint="Read and respond"
          tone="ink"
          loading={isLoading}
        />
        <StatTile label="Waiting for seller" value={waiting.length} icon={<Clock />} loading={isLoading} />
        <StatTile label="All conversations" value={rows.length} icon={<MessageSquare />} loading={isLoading} />
      </StatRow>

      {isLoading ? (
        <ListSkeleton rows={3} className="h-28" />
      ) : isError ? (
        <ErrorNotice title="We couldn't load your inquiries" onRetry={() => void refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title="No inquiries yet"
          description="When you contact a seller, your conversations will appear here."
          actionLabel="Browse cars"
          actionTo="/cars"
        />
      ) : (
        <>
          {replied.length > 0 && (
            <section>
              <SectionHeading kicker="Needs your reply" title="Seller replied" />
              <div className="space-y-3">{replied.map(renderRow)}</div>
            </section>
          )}
          {waiting.length > 0 && (
            <section>
              <SectionHeading kicker="In progress" title="Waiting for seller" />
              <div className="space-y-3">{waiting.map(renderRow)}</div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <SectionHeading kicker="History" title="Closed" />
              <div className="space-y-3">{closed.map(renderRow)}</div>
            </section>
          )}
        </>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden rounded-3xl p-0">
          <DialogHeader className="border-b p-4 pr-12">
            <DialogTitle className="truncate">{active?.title}</DialogTitle>
          </DialogHeader>
          <div className="h-[70vh] sm:h-[60vh]">
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
