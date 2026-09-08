import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ClipboardList, Wrench } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/service-bookings")({ component: ServiceBookingsPage });

type Booking = { id: string; customer_id: string; provider_id: string; service_type: string; requested_for: string | null; customer_notes: string; provider_notes: string | null; quoted_amount: number | null; currency: string; status: string; service_providers: { name: string } | null; garage_vehicles: { make_name: string; model_name: string | null; year: number | null } | null };

function ServiceBookingsPage() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const [quoteFor, setQuoteFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const customer = useQuery({ queryKey: ["my-service-bookings", session?.user.id], enabled: !!session?.user.id, queryFn: async () => {
    const { data, error } = await supabase.from("service_bookings").select("id,customer_id,provider_id,service_type,requested_for,customer_notes,provider_notes,quoted_amount,currency,status,service_providers(name),garage_vehicles(make_name,model_name,year)").eq("customer_id", session!.user.id).order("created_at", { ascending: false });
    if (error) throw error; return (data ?? []) as unknown as Booking[];
  }});
  const provider = useQuery({ queryKey: ["provider-service-bookings", session?.user.id], enabled: !!session?.user.id, queryFn: async () => {
    const { data: providers, error: providerError } = await supabase.from("service_providers").select("id").eq("owner_id", session!.user.id);
    if (providerError) throw providerError;
    if (!providers?.length) return [] as Booking[];
    const { data, error } = await supabase.from("service_bookings").select("id,customer_id,provider_id,service_type,requested_for,customer_notes,provider_notes,quoted_amount,currency,status,service_providers(name),garage_vehicles(make_name,model_name,year)").in("provider_id", providers.map(item => item.id)).order("created_at", { ascending: false });
    if (error) throw error; return (data ?? []) as unknown as Booking[];
  }});
  const refresh = () => Promise.all([queryClient.invalidateQueries({ queryKey: ["my-service-bookings", session?.user.id] }), queryClient.invalidateQueries({ queryKey: ["provider-service-bookings", session?.user.id] })]);
  const update = useMutation({ mutationFn: async ({ id, status, quoted }: { id: string; status: string; quoted?: boolean }) => {
    const values: Record<string, unknown> = { status };
    if (quoted) { if (!amount || Number(amount) < 0) throw new Error("Enter a valid quoted amount."); values.quoted_amount = Number(amount); values.provider_notes = note.trim() || null; }
    if (status === "completed") { values.completed_at = new Date().toISOString(); values.receipt_number = `AC-SVC-${id.slice(0, 8).toUpperCase()}`; }
    const { error } = await supabase.from("service_bookings").update(values).eq("id", id); if (error) throw error;
  }, onSuccess: async () => { await refresh(); setQuoteFor(null); setAmount(""); setNote(""); toast.success("Booking updated"); }, onError: (e: Error) => toast.error(e.message) });
  return <main className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6 lg:py-12"><section className="rounded-3xl border bg-slate-950 p-7 text-white"><p className="text-xs font-bold uppercase tracking-[.16em] text-teal-300">Connected aftercare</p><h1 className="mt-2 text-3xl font-extrabold">Service requests and work records</h1><p className="mt-2 text-sm text-slate-300">Quotes require customer approval. Completion becomes a durable, vehicle-linked service record.</p></section><section className="mt-8"><h2 className="text-xl font-bold">My service requests</h2>{customer.isError ? <p className="mt-3 text-sm text-destructive">We could not load your service requests. Please try again.</p> : customer.data?.length ? <div className="mt-4 grid gap-3">{customer.data.map(booking => <BookingCard key={booking.id} booking={booking} footer={booking.status === "quoted" ? <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "approved" })}>Approve quote</Button> : null} />)}</div> : <EmptyState icon={<ClipboardList />} title="No service requests yet" description="Choose a garage or mechanic and attach a vehicle to begin." actionLabel="Find a provider" actionTo="/services" />}</section>{provider.data?.length ? <section className="mt-12"><h2 className="text-xl font-bold">Provider inbox</h2><p className="mt-1 text-sm text-muted-foreground">Only service providers you own can see these requests.</p><div className="mt-4 grid gap-3">{provider.data.map(booking => <BookingCard key={booking.id} booking={booking} footer={quoteFor === booking.id ? <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input type="number" min="0" placeholder="Quote amount" value={amount} onChange={e => setAmount(e.target.value)} /><Input placeholder="Scope / quote note" value={note} onChange={e => setNote(e.target.value)} /><Button disabled={update.isPending} onClick={() => update.mutate({ id: booking.id, status: "quoted", quoted: true })}>Send quote</Button></div> : booking.status === "requested" ? <Button size="sm" onClick={() => setQuoteFor(booking.id)}>Prepare quote</Button> : booking.status === "approved" ? <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "confirmed" })}>Confirm appointment</Button> : booking.status === "confirmed" ? <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "in_progress" })}>Start work</Button> : booking.status === "in_progress" ? <Button size="sm" onClick={() => update.mutate({ id: booking.id, status: "completed" })}><CheckCircle2 className="mr-2 h-4 w-4" />Mark completed</Button> : null} />)}</div></section> : null}</main>;
}
function BookingCard({ booking, footer }: { booking: Booking; footer: React.ReactNode }) { const vehicle = booking.garage_vehicles; return <article className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-primary">{booking.status.replace("_", " ")}</p><h3 className="mt-1 text-lg font-bold">{booking.service_type}</h3><p className="mt-1 text-sm text-muted-foreground"><Wrench className="mr-1 inline h-4 w-4" />{booking.service_providers?.name ?? "Service provider"}{vehicle ? ` · ${vehicle.year ?? ""} ${vehicle.make_name} ${vehicle.model_name ?? ""}` : ""}</p></div>{booking.quoted_amount != null ? <b>{booking.currency} {Number(booking.quoted_amount).toLocaleString()}</b> : null}</div>{booking.requested_for ? <p className="mt-3 text-sm">Requested for {new Date(booking.requested_for).toLocaleString()}</p> : null}{booking.customer_notes ? <p className="mt-2 text-sm text-muted-foreground">Customer: {booking.customer_notes}</p> : null}{booking.provider_notes ? <p className="mt-2 text-sm text-muted-foreground">Provider: {booking.provider_notes}</p> : null}{footer ? <div className="mt-4">{footer}</div> : null}</article>; }
