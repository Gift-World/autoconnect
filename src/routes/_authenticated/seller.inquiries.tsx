import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Inbox, MessageSquare, Mail, Phone, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { InquiryThread } from "@/components/InquiryThread";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyPanel, FilterPills, ListSkeleton, StatTile } from "@/components/seller/SellerUI";

export const Route = createFileRoute("/_authenticated/seller/inquiries")({
  head: () => ({ meta: [{ title: "Inquiries — Seller — AutoConnect" }] }),
  component: SellerInquiriesPage,
});

interface InqRow {
  id: string;
  created_at: string;
  last_message_at: string | null;
  status: string;
  inquiry_type: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  message: string;
  is_read: boolean;
  cars: { id: string; title: string; year: number } | null;
}

function SellerInquiriesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const {
    data: items,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["seller_inquiries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: seller } = await supabase
        .from("sellers")
        .select("id")
        .eq("profile_id", user.id)
        .maybeSingle();
      if (!seller) {
        return [];
      }
      const { data } = await supabase
        .from("inquiries")
        .select(
          "id, created_at, last_message_at, status, inquiry_type, buyer_name, buyer_email, buyer_phone, message, is_read, cars(id,title,year)",
        )
        .eq("seller_id", seller.id)
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      return (data as unknown as InqRow[]) ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const active = items?.find((x) => x.id === activeId) || (items && items[0]) || null;

  async function openInquiry(r: InqRow) {
    setActiveId(r.id);
    if (!r.is_read) {
      await supabase.from("inquiries").update({ is_read: true }).eq("id", r.id);
      queryClient.setQueryData(["seller_inquiries", user?.id], (old: InqRow[] | undefined) =>
        old?.map((x) => (x.id === r.id ? { ...x, is_read: true } : x)),
      );
    }
  }

  const loading = isLoading || items === undefined;
  const list = items ?? [];
  const unread = list.filter((x) => !x.is_read).length;
  const openCount = list.filter((x) => x.status === "open").length;
  const shown = filter === "unread" ? list.filter((x) => !x.is_read) : list;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Buyer conversations"
        title="Respond while interest is warm"
        description={
          loading
            ? "Keep every response attached to the vehicle and next action."
            : `${list.length} conversation${list.length === 1 ? "" : "s"}. Keep every response attached to the vehicle and next action.`
        }
        actions={
          <Button
            variant="outline"
            className="h-11 rounded-full"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <StatTile
          featured
          icon={<MessageSquare />}
          label="Unread"
          value={unread}
          sub={unread > 0 ? "Waiting for your reply" : "All caught up"}
          loading={loading}
        />
        <StatTile
          icon={<Inbox />}
          tone="warning"
          label="Open"
          value={openCount}
          sub="Not yet responded"
          loading={loading}
        />
        <div className="col-span-2 lg:col-span-1">
          <StatTile
            icon={<MessageSquare />}
            label="All conversations"
            value={list.length}
            sub="Refreshes every 30 seconds"
            loading={loading}
          />
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : items === null || list.length === 0 ? (
        <EmptyPanel
          icon={<MessageSquare />}
          title="No inquiries yet"
          description="When buyers contact you about a listing, their messages appear here. Complete listings with full photos get more messages."
          action={
            <Button asChild className="h-11 rounded-full">
              <Link to="/seller">Review your listings</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside
            className={cn(
              "min-w-0 space-y-3",
              // On small screens the list hides once a conversation is open.
              activeId && "hidden lg:block",
            )}
          >
            <FilterPills
              label="Filter inquiries"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All", count: list.length },
                { value: "unread", label: "Unread", count: unread },
              ]}
            />
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              {shown.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No unread inquiries. Nice work.
                </p>
              ) : (
                <div className="divide-y divide-border lg:max-h-[70vh] lg:overflow-y-auto">
                  {shown.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openInquiry(r)}
                      className={cn(
                        "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
                        active?.id === r.id && "lg:bg-ac-accent/10",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                          r.is_read ? "bg-transparent" : "bg-ac-accent",
                        )}
                        aria-label={r.is_read ? undefined : "Unread"}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-sm",
                              !r.is_read ? "font-bold" : "font-medium",
                            )}
                          >
                            {r.buyer_name}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {new Date(r.last_message_at ?? r.created_at).toLocaleDateString()}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {r.cars ? `${r.cars.year} ${r.cars.title}` : "Listing removed"}
                        </span>
                        <span className="mt-1.5 flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {r.inquiry_type.replace("_", " ")}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] capitalize",
                              r.status === "open" && "border-warning/40 text-warning",
                              r.status === "responded" && "border-success/40 text-success",
                            )}
                          >
                            {r.status}
                          </Badge>
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section
            className={cn(
              "min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-card lg:flex lg:h-[70vh]",
              activeId ? "flex h-[80vh]" : "hidden",
            )}
          >
            {active ? (
              <>
                <div className="border-b border-border p-4">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="-ml-2 mb-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-muted-foreground hover:text-foreground lg:hidden"
                  >
                    <ArrowLeft className="h-4 w-4" /> All inquiries
                  </button>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-brand text-xl">{active.buyer_name}</h2>
                      <p className="text-xs text-muted-foreground">
                        About:{" "}
                        {active.cars
                          ? `${active.cars.year} ${active.cars.title}`
                          : "Listing removed"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <a
                        href={`mailto:${active.buyer_email}`}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-muted-foreground transition hover:text-foreground"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span className="max-w-[180px] truncate">{active.buyer_email}</span>
                      </a>
                      {active.buyer_phone && (
                        <a
                          href={`tel:${active.buyer_phone}`}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-3 text-muted-foreground transition hover:text-foreground"
                        >
                          <Phone className="h-3.5 w-3.5" /> {active.buyer_phone}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <InquiryThread
                  inquiryId={active.id}
                  selfRole="seller"
                  initialMessage={{
                    body: active.message,
                    created_at: active.created_at,
                    sender_name: active.buyer_name,
                  }}
                />
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                Select an inquiry to view the conversation.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
