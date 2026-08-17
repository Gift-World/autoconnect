import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquare, Mail, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { InquiryThread } from "@/components/InquiryThread";
import { cn } from "@/lib/utils";

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
  const [items, setItems] = useState<InqRow[] | null>(null);
  const [active, setActive] = useState<InqRow | null>(null);

  async function load() {
    if (!user) return;
    const { data: seller } = await supabase
      .from("sellers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!seller) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from("inquiries")
      .select(
        "id, created_at, last_message_at, status, inquiry_type, buyer_name, buyer_email, buyer_phone, message, is_read, cars(id,title,year)",
      )
      .eq("seller_id", seller.id)
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    const rows = (data as unknown as InqRow[]) ?? [];
    setItems(rows);
    if (!active && rows[0]) setActive(rows[0]);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function openInquiry(r: InqRow) {
    setActive(r);
    if (!r.is_read) {
      await supabase.from("inquiries").update({ is_read: true }).eq("id", r.id);
      setItems((cur) => cur?.map((x) => (x.id === r.id ? { ...x, is_read: true } : x)) ?? null);
    }
  }

  if (items === null) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-5 w-5" />}
        title="No inquiries yet"
        description="When buyers contact you about a listing, their messages appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Inquiries</h1>
        <p className="text-sm text-muted-foreground">{items.length} conversation{items.length === 1 ? "" : "s"}</p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="overflow-hidden rounded-xl border bg-card">
          <div className="max-h-[70vh] divide-y overflow-y-auto">
            {items.map((r) => (
              <button
                key={r.id}
                onClick={() => openInquiry(r)}
                className={cn(
                  "block w-full px-4 py-3 text-left transition-colors hover:bg-muted/60",
                  active?.id === r.id && "bg-accent/[0.06]",
                  !r.is_read && "font-medium",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm">{r.buyer_name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {new Date(r.last_message_at ?? r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.cars ? `${r.cars.year} ${r.cars.title}` : "Listing removed"}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {r.inquiry_type.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] capitalize",
                    r.status === "open" && "border-warning/40 text-warning",
                    r.status === "responded" && "border-success/40 text-success",
                  )}>
                    {r.status}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex h-[70vh] flex-col overflow-hidden rounded-xl border bg-card">
          {active ? (
            <>
              <div className="border-b p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{active.buyer_name}</h2>
                    <p className="text-xs text-muted-foreground">
                      About: {active.cars ? `${active.cars.year} ${active.cars.title}` : "Listing removed"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <a href={`mailto:${active.buyer_email}`} className="inline-flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3.5 w-3.5" /> {active.buyer_email}
                    </a>
                    {active.buyer_phone && (
                      <a href={`tel:${active.buyer_phone}`} className="inline-flex items-center gap-1 hover:text-foreground">
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
    </div>
  );
}
