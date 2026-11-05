import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Inbox,
  Receipt,
  Search,
  Star,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ErrorNotice,
  ListSkeleton,
  NextStepCard,
  SectionHeading,
  StatRow,
  StatTile,
} from "@/components/account/DashboardKit";
import { primaryButton } from "@/components/account/dashboard-utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/service-bookings")({
  component: ServiceBookingsPage,
});
type Booking = {
  id: string;
  customer_id: string;
  provider_id: string;
  service_type: string;
  requested_for: string | null;
  customer_notes: string;
  provider_notes: string | null;
  quoted_amount: number | null;
  currency: string;
  status: string;
  receipt_number: string | null;
  completed_notes: string | null;
  service_providers: { name: string } | null;
  garage_vehicles: { make_name: string; model_name: string | null; year: number | null } | null;
};
type Provider = { id: string; name: string; city: string | null; country: string };
const select =
  "id,customer_id,provider_id,service_type,requested_for,customer_notes,provider_notes,quoted_amount,currency,status,receipt_number,completed_notes,service_providers(name),garage_vehicles(make_name,model_name,year)";

function ServiceBookingsPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [claimProviderId, setClaimProviderId] = useState("");
  const [claimNote, setClaimNote] = useState("");
  const [reviewFor, setReviewFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const customer = useQuery({
    queryKey: ["my-service-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_bookings")
        .select(select)
        .eq("customer_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });
  const provider = useQuery({
    queryKey: ["provider-service-bookings", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: owned, error: ownerError } = await supabase
        .from("service_providers")
        .select("id")
        .eq("owner_id", userId!);
      if (ownerError) throw ownerError;
      if (!owned?.length) return [] as Booking[];
      const { data, error } = await supabase
        .from("service_bookings")
        .select(select)
        .in(
          "provider_id",
          owned.map((p) => p.id),
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Booking[];
    },
  });
  const available = useQuery({
    queryKey: ["unlinked-service-providers"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id,name,city,country")
        .eq("is_approved", true)
        .is("owner_id", null)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Provider[];
    },
  });
  const reviews = useQuery({
    queryKey: ["my-service-reviews", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_reviews")
        .select("booking_id")
        .eq("customer_id", userId!);
      if (error) throw error;
      return new Set((data ?? []).map((x) => x.booking_id));
    },
  });
  const refresh = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["my-service-bookings", userId] }),
      qc.invalidateQueries({ queryKey: ["provider-service-bookings", userId] }),
      qc.invalidateQueries({ queryKey: ["my-service-reviews", userId] }),
    ]);
  const update = useMutation({
    mutationFn: async ({
      id,
      status,
      quoted,
      completed,
    }: {
      id: string;
      status: string;
      quoted?: boolean;
      completed?: boolean;
    }) => {
      const values: Record<string, unknown> = { status };
      if (quoted) {
        if (!amount || Number(amount) < 0) throw new globalThis.Error("Enter a valid quote amount.");
        values.quoted_amount = Number(amount);
        values.provider_notes = note.trim() || null;
      }
      if (completed) {
        values.completed_at = new Date().toISOString();
        values.receipt_number = `AC-SVC-${id.slice(0, 8).toUpperCase()}`;
        values.completed_notes = completionNote.trim() || "Work marked complete by provider.";
      }
      const { error } = await supabase.from("service_bookings").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      setQuoteFor(null);
      setAmount("");
      setNote("");
      setCompletionNote("");
      toast.success("Service record updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const claim = useMutation({
    mutationFn: async () => {
      if (!claimProviderId) throw new globalThis.Error("Choose the business you represent.");
      const { error } = await supabase
        .from("service_provider_claims")
        .insert({
          provider_id: claimProviderId,
          claimant_id: userId!,
          note: claimNote.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      setClaimProviderId("");
      setClaimNote("");
      qc.invalidateQueries({ queryKey: ["unlinked-service-providers"] });
      toast.success("Claim sent for admin review");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const submit = useMutation({
    mutationFn: async (booking: Booking) => {
      const { error } = await supabase
        .from("service_reviews")
        .insert({
          booking_id: booking.id,
          provider_id: booking.provider_id,
          customer_id: userId!,
          rating,
          comment: reviewComment.trim() || null,
        });
      if (error) throw error;
    },
    onSuccess: async () => {
      await refresh();
      setReviewFor(null);
      setReviewComment("");
      toast.success("Thank you — your review was recorded.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const review = customer.data?.find((item) => item.id === reviewFor) ?? null;
  const action = (booking: Booking, inbox = false) =>
    inbox ? (
      quoteFor === booking.id ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input className="h-11"
            type="number"
            min="0"
            placeholder="Quote amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input className="h-11"
            placeholder="Scope / quote note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button className="min-h-11 rounded-full px-5"
            disabled={update.isPending}
            onClick={() => update.mutate({ id: booking.id, status: "quoted", quoted: true })}
          >
            Send quote
          </Button>
        </div>
      ) : booking.status === "requested" ? (
        <Button size="sm" className="min-h-11 rounded-full px-5" onClick={() => setQuoteFor(booking.id)}>
          Prepare quote
        </Button>
      ) : booking.status === "approved" ? (
        <Button size="sm" className="min-h-11 rounded-full px-5" onClick={() => update.mutate({ id: booking.id, status: "confirmed" })}>
          Confirm appointment
        </Button>
      ) : booking.status === "confirmed" ? (
        <Button size="sm" className="min-h-11 rounded-full px-5" onClick={() => update.mutate({ id: booking.id, status: "in_progress" })}>
          Start work
        </Button>
      ) : booking.status === "in_progress" ? (
        <div className="flex flex-wrap gap-2">
          <Input
            className="h-11 max-w-sm"
            placeholder="Work completed / parts fitted"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
          />
          <Button className="min-h-11 rounded-full px-5"
            size="sm"
            onClick={() => update.mutate({ id: booking.id, status: "completed", completed: true })}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark completed
          </Button>
        </div>
      ) : null
    ) : booking.status === "quoted" ? (
      <Button size="sm" className="min-h-11 rounded-full px-5" onClick={() => update.mutate({ id: booking.id, status: "approved" })}>
        Approve quote
      </Button>
    ) : booking.status === "completed" && !reviews.data?.has(booking.id) ? (
      <Button size="sm" className="min-h-11 rounded-full px-5" variant="outline" onClick={() => setReviewFor(booking.id)}>
        <Star className="mr-2 h-4 w-4" />
        Leave a review
      </Button>
    ) : null;
  const mine = customer.data ?? [];
  const needsMe = mine.filter(
    (b) => b.status === "quoted" || (b.status === "completed" && !reviews.data?.has(b.id)),
  );
  const finished = mine.filter((b) => !needsMe.includes(b) && b.status === "completed");
  const ongoing = mine.filter((b) => !needsMe.includes(b) && b.status !== "completed");
  const quoteReady = mine.some((x) => x.status === "quoted");
  const inbox = provider.data ?? [];

  return (
    <main className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        eyebrow="Connected aftercare"
        title="Service requests & work records"
        description="Request care for a vehicle, approve a clear quote, and keep completed work attached to its history."
        actions={
          <Link to="/services" className={primaryButton}>
            <Search className="h-4 w-4" /> Find a provider
          </Link>
        }
      />

      <StatRow className={inbox.length ? "" : "lg:grid-cols-3"}>
        <StatTile
          icon={<ClipboardList />}
          label="Requests"
          value={mine.length}
          hint="Your care journey"
          loading={customer.isLoading}
        />
        <StatTile
          icon={<CalendarDays />}
          label="Next step"
          value={quoteReady ? "Quote ready" : "All clear"}
          hint="Only you approve a quote"
          tone={quoteReady ? "ink" : "default"}
          loading={customer.isLoading}
        />
        <StatTile
          icon={<Receipt />}
          label="Work records"
          value={mine.filter((x) => x.receipt_number).length}
          hint="Receipts linked to vehicles"
          loading={customer.isLoading}
        />
        {inbox.length > 0 && (
          <StatTile
            icon={<Inbox />}
            label="Provider inbox"
            value={inbox.filter((b) => b.status !== "completed").length}
            hint="Open jobs for your business"
          />
        )}
      </StatRow>

      {quoteReady && (
        <NextStepCard
          icon={<Receipt />}
          title="A quote is waiting for you"
          body="Check the price and scope below. Work only starts after you approve it."
        />
      )}

      <section>
        <SectionHeading
          kicker="Customer workspace"
          title="My service requests"
          description="Every request stays tied to the vehicle you selected from My Garage."
        />
        {customer.isLoading ? (
          <ListSkeleton rows={2} className="h-44" />
        ) : customer.isError ? (
          <ErrorNotice
            title="We could not load your service requests"
            message="Refresh to retry."
            onRetry={() => void customer.refetch()}
          />
        ) : mine.length ? (
          <div className="space-y-6">
            {needsMe.length > 0 && (
              <Group label="Needs your action" count={needsMe.length}>
                {needsMe.map((b) => (
                  <BookingCard key={b.id} booking={b} footer={action(b)} highlight />
                ))}
              </Group>
            )}
            {ongoing.length > 0 && (
              <Group label="In progress" count={ongoing.length}>
                {ongoing.map((b) => (
                  <BookingCard key={b.id} booking={b} footer={action(b)} />
                ))}
              </Group>
            )}
            {finished.length > 0 && (
              <Group label="Completed" count={finished.length}>
                {finished.map((b) => (
                  <BookingCard key={b.id} booking={b} footer={action(b)} />
                ))}
              </Group>
            )}
          </div>
        ) : (
          <EmptyState
            icon={<ClipboardList />}
            title="No service requests yet"
            description="Choose a garage, mechanic or inspector and attach a vehicle to begin."
            actionLabel="Find a provider"
            actionTo="/services"
          />
        )}
      </section>

      {inbox.length ? (
        <section className="pt-4">
          <SectionHeading
            kicker="Provider workspace"
            title="Booking inbox"
            description="Move work forward in a clear sequence: quote, customer approval, appointment and receipt."
          />
          <div className="grid gap-3">
            {inbox.map((b) => (
              <BookingCard key={b.id} booking={b} footer={action(b, true)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-ac-accent">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="brand-kicker text-muted-foreground">Provider activation</p>
            <h2 className="mt-1 text-lg font-bold">Represent a listed business</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              An administrator must approve the request before the account can access its booking
              inbox.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <select
            className="h-11 min-w-0 rounded-xl border border-input bg-background px-3 text-sm"
            value={claimProviderId}
            onChange={(e) => setClaimProviderId(e.target.value)}
            aria-label="Choose business"
          >
            <option value="">Choose business</option>
            {available.data?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name} · {x.city ?? x.country}
              </option>
            ))}
          </select>
          <Input
            className="h-11"
            value={claimNote}
            onChange={(e) => setClaimNote(e.target.value)}
            placeholder="Your role and contact detail for verification"
          />
          <Button
            variant="outline"
            className="h-11 rounded-full px-5"
            disabled={claim.isPending || !claimProviderId}
            onClick={() => claim.mutate()}
          >
            Request activation
          </Button>
        </div>
      </section>

      <Dialog open={!!review} onOpenChange={(o) => !o && setReviewFor(null)}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          {review && (
            <>
              <DialogHeader>
                <p className="brand-kicker text-muted-foreground">Completed work</p>
                <DialogTitle className="font-brand text-2xl">
                  Review {review.service_providers?.name ?? "provider"}
                </DialogTitle>
                <DialogDescription>{review.service_type}</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={rating === v}
                    onClick={() => setRating(v)}
                    className={cn(
                      "inline-flex h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-3 text-sm font-bold transition",
                      rating === v
                        ? "border-transparent bg-ac-accent text-ac-ink"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {v}
                  </button>
                ))}
              </div>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What was useful? Keep it factual."
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="min-h-11 rounded-full"
                  onClick={() => setReviewFor(null)}
                >
                  Cancel
                </Button>
                <button
                  type="button"
                  className={primaryButton}
                  disabled={submit.isPending}
                  onClick={() => submit.mutate(review)}
                >
                  Submit review
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Group({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
        {label}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {count}
        </span>
      </p>
      <div className="grid gap-3">{children}</div>
    </div>
  );
}

const BOOKING_STEPS = ["requested", "quoted", "approved", "confirmed", "in_progress", "completed"];
const BOOKING_STEP_LABEL: Record<string, string> = {
  requested: "Requested",
  quoted: "Quoted",
  approved: "Approved",
  confirmed: "Booked",
  in_progress: "In work",
  completed: "Done",
};

function BookingCard({
  booking,
  footer,
  highlight,
}: {
  booking: Booking;
  footer: React.ReactNode;
  highlight?: boolean;
}) {
  const car = booking.garage_vehicles;
  const carLabel = car
    ? `${car.year ?? ""} ${car.make_name} ${car.model_name ?? ""}`.trim()
    : "Vehicle not available";
  const stepIdx = BOOKING_STEPS.indexOf(booking.status);
  return (
    <article
      className={cn(
        "rounded-3xl border bg-card p-5 sm:p-6",
        highlight ? "border-ac-accent/60" : "border-border",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="brand-kicker text-ac-accent">{booking.status.replaceAll("_", " ")}</p>
          <h3 className="font-brand mt-1.5 text-2xl">{booking.service_type}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 shrink-0 text-ac-accent" />
            <span className="min-w-0">
              {booking.service_providers?.name ?? "Service provider"} · {carLabel}
            </span>
          </p>
        </div>
        {booking.quoted_amount != null && (
          <strong className="font-brand shrink-0 self-start rounded-2xl bg-ac-cream px-3 py-2 text-lg text-ac-ink">
            {booking.currency} {Number(booking.quoted_amount).toLocaleString()}
          </strong>
        )}
      </div>
      {stepIdx >= 0 && (
        <ol className="mt-4 grid grid-cols-6 gap-1" aria-label="Booking progress">
          {BOOKING_STEPS.map((s, i) => (
            <li key={s} className="min-w-0">
              <div className={cn("h-1.5 rounded-full", i <= stepIdx ? "bg-ac-accent" : "bg-muted")} />
              <p
                className={cn(
                  "mt-1 hidden truncate text-[10px] font-semibold sm:block",
                  i <= stepIdx ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {BOOKING_STEP_LABEL[s]}
              </p>
            </li>
          ))}
        </ol>
      )}
      <div className="mt-5 grid gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:grid-cols-2">
        {booking.requested_for && (
          <p>
            <b className="text-foreground">Requested:</b>{" "}
            {new Date(booking.requested_for).toLocaleString()}
          </p>
        )}
        {booking.receipt_number && (
          <p className="inline-flex items-center gap-2 font-semibold text-foreground">
            <Receipt className="h-4 w-4 text-ac-accent" />
            Receipt {booking.receipt_number}
          </p>
        )}
        {booking.customer_notes && (
          <p>
            <b className="text-foreground">Your note:</b> {booking.customer_notes}
          </p>
        )}
        {booking.provider_notes && (
          <p>
            <b className="text-foreground">Provider note:</b> {booking.provider_notes}
          </p>
        )}
        {booking.completed_notes && (
          <p className="inline-flex items-start gap-1.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              <b className="text-foreground">Completion:</b> {booking.completed_notes}
            </span>
          </p>
        )}
      </div>
      {footer && <div className="mt-5">{footer}</div>}
    </article>
  );
}
