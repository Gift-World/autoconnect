import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarPlus,
  CarFront,
  ClipboardCheck,
  MapPin,
  Sparkles,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackProductEvent } from "@/lib/product-analytics";

import { Button } from "@/components/ui/button";
import { StoryEmpty, QuietLink } from "@/components/yard/StoryEmpty";
import { FloatingStack, type FloatingCard } from "@/components/motion/FloatingStack";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/services")({
  head: () => ({ meta: [{ title: "Car Care Providers — AutoConnect" }] }),
  component: ServicesPage,
});
type Provider = {
  id: string;
  name: string;
  provider_type: string;
  country: string;
  city: string | null;
  description: string | null;
  phone: string | null;
  is_verified: boolean;
  is_preview: boolean;
};
const labels: Record<string, string> = {
  mechanic: "Mechanic",
  garage: "Garage",
  inspection: "Inspection",
  logistics: "Logistics",
  insurance: "Insurance",
  roadside: "Roadside help",
};

const careTypes = ["all", "garage", "mechanic", "inspection"] as const;
type CareType = (typeof careTypes)[number];

function providerImage(provider: Provider) {
  const description = provider.description?.toLowerCase() ?? "";
  if (provider.provider_type === "inspection")
    return "/images/providers/nairobi-vehicle-inspection.jpg";
  if (provider.provider_type === "mechanic") return "/images/providers/nairobi-mobile-mechanic.jpg";
  if (description.includes("hybrid") || description.includes("ev"))
    return "/images/providers/nairobi-hybrid-workshop.jpg";
  return "/images/providers/nairobi-garage-workshop.jpg";
}

function providerIcon(type: string) {
  return type === "inspection" ? ClipboardCheck : type === "garage" ? CarFront : Wrench;
}

function ServicesPage() {
  const [activeType, setActiveType] = useState<CareType>("all");
  const providers = useQuery({
    queryKey: ["approved-service-providers"],
    queryFn: async () => {
      const response = await fetch("/api/public/service-providers");
      const payload = (await response.json()) as { data?: Provider[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Unable to load providers.");
      return payload.data ?? [];
    },
  });
  const visibleProviders = useMemo(
    () =>
      providers.data?.filter(
        (provider) => activeType === "all" || provider.provider_type === activeType,
      ) ?? [],
    [activeType, providers.data],
  );
  const careCards: FloatingCard[] = [
    {
      eyebrow: "Start here",
      title: "Open My Garage.",
      body: "Add the vehicle once. Every request, receipt and reminder attaches to it.",
      color: "var(--color-ac-cream)",
      to: "/garage",
    },
    {
      eyebrow: "Need a part?",
      title: "Find parts.",
      body: "Search approved suppliers and link a quote to the same car.",
      color: "var(--color-ac-powder)",
      to: "/parts",
    },
    {
      eyebrow: "Already booked",
      title: "Manage service requests.",
      body: "Follow quotes, confirmations and the work record for each booking.",
      color: "var(--color-ac-apricot)",
      to: "/service-bookings",
    },
  ];

  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          <img
            src="/images/providers/nairobi-hybrid-workshop.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.94),rgba(11,19,36,.55)_60%,rgba(11,19,36,.4))]" />
          <div className="mx-auto max-w-[1360px] px-5 py-14 sm:px-10 sm:py-20 lg:py-28">
            <p className="brand-kicker text-ac-accent">Car care network</p>
            <h1 className="font-brand mt-5 max-w-4xl text-4xl sm:text-6xl lg:text-7xl">
              Care that stays <span className="text-ac-accent">connected to your car.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              One directory for workshops, individual mechanics and independent inspections. Choose
              a provider, attach the vehicle from My Garage, then keep the request and work record
              together.
            </p>
            <a
              href="#providers"
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:gap-3 hover:brightness-110"
            >
              Find a provider <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section id="providers" className="mx-auto max-w-[1360px] scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <p className="brand-kicker text-muted-foreground">Choose your next step</p>
        <h2 className="font-brand mt-3 text-3xl sm:text-5xl">Car-care providers</h2>

        {/* Care type tiles double as the filter */}
        <div
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          role="group"
          aria-label="Filter car-care providers"
        >
          {careTypes.map((type) => {
            const meta = CARE_META[type];
            const active = activeType === type;
            return (
              <button
                key={type}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveType(type)}
                className={`flex min-h-11 items-start gap-3 rounded-3xl border p-4 text-left transition ${
                  active
                    ? "border-ac-ink bg-ac-ink text-white dark:border-ac-accent"
                    : "border-border bg-card text-foreground hover:border-foreground/30"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                    active ? "bg-ac-accent text-ac-ink" : "bg-muted text-ac-accent"
                  }`}
                >
                  {meta.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold">{meta.title}</span>
                  <span
                    className={`mt-0.5 block text-sm leading-5 ${active ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {meta.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10">
          {providers.isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
                  <Skeleton className="h-5 w-2/3 rounded-full" />
                  <Skeleton className="h-4 w-1/2 rounded-full" />
                </div>
              ))}
            </div>
          ) : providers.isError ? (
            <StoryEmpty
              tone="warning"
              icon={<Wrench />}
              kicker="Connection issue"
              title="Service directory is unavailable"
              description="Please refresh and try again."
              actionLabel="Open My Garage"
              actionTo="/garage"
            />
          ) : providers.data?.length ? (
            visibleProviders.length ? (
              <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
                {visibleProviders.map((provider) => (
                  <ProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <StoryEmpty
                icon={<Wrench />}
                title="No matching providers"
                description="Try another care category."
                actionLabel="Show all care"
                onAction={() => setActiveType("all")}
              />
            )
          ) : (
            <StoryEmpty
              icon={<Wrench />}
              kicker="Network growing"
              title="No service providers yet"
              description="Approved mechanics and garages will appear here. Add your car to My Garage now so it is ready when you book."
              actionLabel="Open My Garage"
              actionTo="/garage"
              secondary={<QuietLink to="/parts">Find parts</QuietLink>}
            />
          )}
        </div>
      </section>

      {/* How care stays connected */}
      <section className="pb-16 sm:pb-24">
        <FloatingStack
          image="/images/providers/nairobi-garage-workshop.jpg"
          imageAlt="A mechanic working on a car in a Nairobi workshop"
          heading={
            <>
              One car.
              <br />
              <span className="text-ac-accent">One record.</span>
            </>
          }
          cards={careCards}
        />
      </section>
    </main>
  );
}

const CARE_META: Record<CareType, { icon: ReactNode; title: string; description: string }> = {
  all: {
    icon: <Sparkles className="h-5 w-5" />,
    title: "All care",
    description: "Every approved provider in the network.",
  },
  garage: {
    icon: <CarFront className="h-5 w-5" />,
    title: "Garage or workshop",
    description: "A physical place with bays, equipment and usually a team.",
  },
  mechanic: {
    icon: <Wrench className="h-5 w-5" />,
    title: "Mechanic",
    description: "An individual or mobile specialist for focused work and diagnostics.",
  },
  inspection: {
    icon: <ClipboardCheck className="h-5 w-5" />,
    title: "Inspection",
    description: "An independent condition check before you decide to buy.",
  },
};

function ProviderCard({ provider }: { provider: Provider }) {
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("Routine service");
  const [requestedFor, setRequestedFor] = useState("");
  const [notes, setNotes] = useState("");
  const vehicles = useQuery({
    queryKey: ["booking-garage-vehicles", session?.user.id],
    enabled: !!session?.user.id && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("garage_vehicles")
        .select("id,make_name,model_name,year,nickname")
        .eq("owner_id", session!.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const booking = useMutation({
    mutationFn: async () => {
      if (!session?.user) throw new Error("Please sign in to request an appointment.");
      if (!vehicleId) throw new Error("Choose the vehicle this work is for.");
      if (!requestedFor) throw new Error("Choose a preferred date and time.");
      const { error } = await supabase.from("service_bookings").insert({
        customer_id: session.user.id,
        provider_id: provider.id,
        garage_vehicle_id: vehicleId,
        service_type: serviceType.trim() || "Service request",
        requested_for: new Date(requestedFor).toISOString(),
        customer_notes: notes.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service request sent", {
        description: "The provider can now quote or confirm it.",
      });
      void trackProductEvent("service_booking_requested", { provider_id: provider.id, garage_vehicle_id: vehicleId, service_type: serviceType });
      setOpen(false);
      setNotes("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const Icon = providerIcon(provider.provider_type);
  const description =
    provider.description?.replace(/^Sample\s+/i, "") ?? "Listed car-care provider.";
  return (
    <article className="group flex flex-col">
      <div className="flex w-full flex-1 flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
          <img
            src={providerImage(provider)}
            alt="Representative service environment"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ac-ink">
              <Icon className="h-3.5 w-3.5 text-ac-accent" />
              {labels[provider.provider_type] ?? provider.provider_type}
            </span>
            {provider.is_preview && (
              <span className="rounded-full bg-ac-ink/85 px-2.5 py-1 text-[10px] font-semibold text-white">
                Preview listing
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col px-1 pt-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-brand text-xl">{provider.name}</h3>
            {provider.is_verified && (
              <BadgeCheck
                className="mt-1 h-5 w-5 shrink-0 text-ac-accent"
                aria-label="Verified provider"
              />
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {provider.city ? `${provider.city}, ` : ""}
            {provider.country}
          </p>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>
          {provider.is_verified ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-success">
              <BadgeCheck className="h-3.5 w-3.5" />
              Account and business reviewed
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              Representative image · provider details will be confirmed before launch.
            </p>
          )}
          <div className="mt-auto" />
          {!user || !session ? (
            <Button
              onClick={() =>
                toast.info("Sign in with a test or customer account to request an appointment.")
              }
              className="mt-5 min-h-11 w-full rounded-full"
              size="sm"
            >
              <CalendarPlus className="mr-2 h-4 w-4" /> Request appointment
            </Button>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="mt-5 min-h-11 w-full rounded-full" size="sm">
                  <CalendarPlus className="mr-2 h-4 w-4" /> Choose service time
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Book {provider.name}</DialogTitle>
                  <DialogDescription>
                    Connect a vehicle from your Garage to request an appointment.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {vehicles.isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading your garage…</p>
                  ) : !vehicles.data?.length ? (
                    <div className="rounded-xl border bg-muted/40 p-4 text-center text-sm">
                      <CarFront className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Add a vehicle to My Garage before requesting service.
                      </p>
                      <Button
                        onClick={() => setOpen(false)}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        asChild
                      >
                        <Link to="/garage">Go to My Garage</Link>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`vehicle-${provider.id}`}>Vehicle</Label>
                        <select
                          id={`vehicle-${provider.id}`}
                          value={vehicleId}
                          onChange={(event) => setVehicleId(event.target.value)}
                          className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="">Select a vehicle</option>
                          {vehicles.data.map((vehicle) => (
                            <option value={vehicle.id} key={vehicle.id}>
                              {`${vehicle.year ?? ""} ${vehicle.make_name} ${vehicle.model_name ?? ""}`.trim()}
                              {vehicle.nickname ? ` · ${vehicle.nickname}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`service-${provider.id}`}>Service needed</Label>
                        <Input
                          id={`service-${provider.id}`}
                          value={serviceType}
                          onChange={(event) => setServiceType(event.target.value)}
                          placeholder="Diagnostics, maintenance, inspection…"
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`when-${provider.id}`}>Preferred time</Label>
                        <Input
                          id={`when-${provider.id}`}
                          type="datetime-local"
                          value={requestedFor}
                          onChange={(event) => setRequestedFor(event.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`notes-${provider.id}`}>
                          What should the provider know?
                        </Label>
                        <Textarea
                          id={`notes-${provider.id}`}
                          value={notes}
                          onChange={(event) => setNotes(event.target.value)}
                          placeholder="Symptoms, inspection notes, or a question…"
                        />
                      </div>
                      <Button
                        disabled={booking.isPending}
                        onClick={() => booking.mutate()}
                        className="w-full"
                      >
                        {booking.isPending ? "Sending request…" : "Send service request"}
                      </Button>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </article>
  );
}
