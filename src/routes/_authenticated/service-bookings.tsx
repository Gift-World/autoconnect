import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Receipt,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";

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
        if (!amount || Number(amount) < 0) throw new Error("Enter a valid quote amount.");
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
      if (!claimProviderId) throw new Error("Choose the business you represent.");
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
          <Input
            type="number"
            min="0"
            placeholder="Quote amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            placeholder="Scope / quote note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            disabled={update.isPending}
            onClick={() => update.mutate({ id: booking.id, status: "quoted", quoted: true })}
          >
            Send quote
          </Button>
        </div>
      ) : booking.status === "requested" ? (
        <Button size="sm" onClick={() => setQuoteFor(booking.id)}>
          Prepare quote
        </Button>
      ) : booking.status === "approved" ? (
        <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "confirmed" })}>
          Confirm appointment
        </Button>
      ) : booking.status === "confirmed" ? (
        <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "in_progress" })}>
          Start work
        </Button>
      ) : booking.status === "in_progress" ? (
        <div className="flex flex-wrap gap-2">
          <Input
            className="max-w-sm"
            placeholder="Work completed / parts fitted"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
          />
          <Button
            size="sm"
            onClick={() => update.mutate({ id: booking.id, status: "completed", completed: true })}
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark completed
          </Button>
        </div>
      ) : null
    ) : booking.status === "quoted" ? (
      <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "approved" })}>
        Approve quote
      </Button>
    ) : booking.status === "completed" && !reviews.data?.has(booking.id) ? (
      <Button size="sm" variant="outline" onClick={() => setReviewFor(booking.id)}>
        <Star className="mr-2 h-4 w-4" />
        Leave a review
      </Button>
    ) : null;
  return (
    <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6 lg:py-12">
      <PageHeader
        eyebrow="Connected aftercare"
        title="Service requests & work records"
        description="Request care for a vehicle, approve a clear quote, and keep completed work attached to its history."
      />
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Metric
          icon={<ClipboardList />}
          label="Requests"
          value={customer.data?.length ?? 0}
          detail="Your care journey"
        />
        <Metric
          icon={<CalendarDays />}
          label="Next step"
          value={customer.data?.some((x) => x.status === "quoted") ? "Quote ready" : "All clear"}
          detail="Only you approve a quote"
        />
        <Metric
          icon={<Receipt />}
          label="Work records"
          value={customer.data?.filter((x) => x.receipt_number).length ?? 0}
          detail="Receipts linked to vehicles"
        />
      </section>
      <section className="mt-10">
        <Title
          eyebrow="Customer workspace"
          title="My service requests"
          description="Every request stays tied to the vehicle you selected from My Garage."
        />
        {customer.isError ? (
          <Error />
        ) : customer.data?.length ? (
          <div className="mt-5 grid gap-4">
            {customer.data.map((b) => (
              <BookingCard key={b.id} booking={b} footer={action(b)} />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={<ClipboardList />}
              title="No service requests yet"
              description="Choose a garage, mechanic or inspector and attach a vehicle to begin."
              actionLabel="Find a provider"
              actionTo="/services"
            />
          </div>
        )}
      </section>
      {provider.data?.length ? (
        <section className="mt-12">
          <Title
            eyebrow="Provider workspace"
            title="Booking inbox"
            description="Move work forward in a clear sequence: quote, customer approval, appointment and receipt."
          />
          <div className="mt-5 grid gap-4">
            {provider.data.map((b) => (
              <BookingCard key={b.id} booking={b} footer={action(b, true)} />
            ))}
          </div>
        </section>
      ) : null}
      <section className="app-surface mt-12 p-5 sm:p-6">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
              Provider activation
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">Represent a listed business</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              An administrator must approve the request before the account can access its booking
              inbox.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
          <select
            className="h-11 rounded-xl border bg-background px-3 text-sm"
            value={claimProviderId}
            onChange={(e) => setClaimProviderId(e.target.value)}
          >
            <option value="">Choose business</option>
            {available.data?.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name} · {x.city ?? x.country}
              </option>
            ))}
          </select>
          <Input
            value={claimNote}
            onChange={(e) => setClaimNote(e.target.value)}
            placeholder="Your role and contact detail for verification"
          />
          <Button
            className="h-11"
            disabled={claim.isPending || !claimProviderId}
            onClick={() => claim.mutate()}
          >
            Request activation
          </Button>
        </div>
      </section>
      {review && (
        <section className="app-surface mt-6 p-5">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
            Completed work
          </p>
          <h2 className="mt-1 font-display text-lg font-bold">
            Review {review.service_providers?.name ?? "provider"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((v) => (
              <Button
                key={v}
                size="sm"
                variant={rating === v ? "default" : "outline"}
                onClick={() => setRating(v)}
              >
                <Star className="mr-1 h-3.5 w-3.5" />
                {v}
              </Button>
            ))}
          </div>
          <Textarea
            className="mt-3"
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder="What was useful? Keep it factual."
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => setReviewFor(null)}>
              Cancel
            </Button>
            <Button disabled={submit.isPending} onClick={() => submit.mutate(review)}>
              Submit review
            </Button>
          </div>
        </section>
      )}
    </main>
  );
}
function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <article className="app-surface p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </article>
  );
}
function Title({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
function Error() {
  return (
    <p className="mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      We could not load your service requests. Refresh to retry.
    </p>
  );
}
function BookingCard({ booking, footer }: { booking: Booking; footer: React.ReactNode }) {
  const car = booking.garage_vehicles;
  const carLabel = car
    ? `${car.year ?? ""} ${car.make_name} ${car.model_name ?? ""}`.trim()
    : "Vehicle not available";
  return (
    <article className="app-surface p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-primary">
            {booking.status.replaceAll("_", " ")}
          </p>
          <h3 className="mt-1 font-display text-xl font-bold">{booking.service_type}</h3>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="h-4 w-4 text-primary" />
            {booking.service_providers?.name ?? "Service provider"} · {carLabel}
          </p>
        </div>
        {booking.quoted_amount != null && (
          <strong className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">
            {booking.currency} {Number(booking.quoted_amount).toLocaleString()}
          </strong>
        )}
      </div>
      <div className="mt-5 grid gap-3 border-t pt-4 text-sm text-muted-foreground sm:grid-cols-2">
        {booking.requested_for && (
          <p>
            <b className="text-foreground">Requested:</b>{" "}
            {new Date(booking.requested_for).toLocaleString()}
          </p>
        )}
        {booking.receipt_number && (
          <p className="inline-flex items-center gap-2 font-semibold text-primary">
            <Receipt className="h-4 w-4" />
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
          <p>
            <b className="text-foreground">Completion:</b> {booking.completed_notes}
          </p>
        )}
      </div>
      {footer && <div className="mt-5">{footer}</div>}
    </article>
  );
}
