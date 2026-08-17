import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Search,
  FileText,
  Handshake,
  Ship,
  CheckCircle2,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AED", "KES", "NGN", "GHS", "ZAR", "CNY", "INR", "AUD", "CAD"] as const;

const schema = z.object({
  buyer_name: z.string().trim().min(2, "Name required").max(100),
  buyer_email: z.string().trim().email("Valid email required").max(255),
  buyer_phone: z.string().trim().max(30).optional().or(z.literal("")),
  buyer_country: z.string().min(2, "Country required"),
  make_name: z.string().trim().min(1, "Make required").max(60),
  model_name: z.string().trim().max(80).optional().or(z.literal("")),
  year_from: z.coerce.number().int().min(1950).max(2030).optional().or(z.literal("" as unknown as number)),
  year_to: z.coerce.number().int().min(1950).max(2030).optional().or(z.literal("" as unknown as number)),
  budget_min: z.coerce.number().min(0).optional().or(z.literal("" as unknown as number)),
  budget_max: z.coerce.number().min(0).optional().or(z.literal("" as unknown as number)),
  budget_currency: z.string().default("USD"),
  preferred_condition: z.enum(["new", "foreign-used", "locally-used", "any"]).default("any"),
  preferred_source_country: z.string().optional().or(z.literal("")),
  transmission_preference: z.string().optional().or(z.literal("")),
  fuel_preference: z.string().optional().or(z.literal("")),
  additional_notes: z.string().max(2000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/import")({
  head: () => ({
    meta: [
      { title: "Import a Car — AutoConnect" },
      {
        name: "description",
        content:
          "Tell us the car you want and we'll connect you with verified exporters worldwide. Free, no obligation import requests.",
      },
      { property: "og:title", content: "Import a Car — AutoConnect" },
      {
        property: "og:description",
        content:
          "Submit an import request and get matched with verified exporters globally.",
      },
    ],
  }),
  component: ImportPage,
});

function ImportPage() {
  const { user, profile } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      buyer_name: profile?.full_name ?? "",
      buyer_email: user?.email ?? "",
      buyer_phone: profile?.phone ?? "",
      buyer_country: profile?.country ?? "",
      budget_currency: "USD",
      preferred_condition: "any",
    } as FormValues,
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    const payload = {
      buyer_id: user?.id ?? null,
      buyer_name: values.buyer_name,
      buyer_email: values.buyer_email,
      buyer_phone: values.buyer_phone || null,
      buyer_country: values.buyer_country,
      make_name: values.make_name,
      model_name: values.model_name || null,
      year_from: values.year_from ? Number(values.year_from) : null,
      year_to: values.year_to ? Number(values.year_to) : null,
      budget_min: values.budget_min ? Number(values.budget_min) : null,
      budget_max: values.budget_max ? Number(values.budget_max) : null,
      budget_currency: values.budget_currency || "USD",
      preferred_condition: values.preferred_condition,
      preferred_source_country: values.preferred_source_country || null,
      transmission_preference: values.transmission_preference || null,
      fuel_preference: values.fuel_preference || null,
      additional_notes: values.additional_notes || null,
    };
    const { error } = await supabase.from("import_requests").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit request", { description: error.message });
      return;
    }
    toast.success("Import request submitted!");
    setSubmitted(true);
    reset();
  };

  return (
    <div className="bg-muted/30">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary/80 py-16 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm">
            <Globe2 className="h-4 w-4" /> Worldwide import network
          </div>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">
            Import the exact car you want
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Tell us your specs and budget. We'll match you with verified
            exporters in Japan, UK, UAE, Germany, USA, and more.
          </p>
        </div>
      </section>

      <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="rounded-lg border bg-card p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Submit import request</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All fields marked * are required. We share approved requests only
            with verified exporters.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-md border border-success/30 bg-success/10 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
              <h3 className="mt-3 text-xl font-semibold">Request received</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Verified exporters will be notified. You'll receive proposals
                by email within 24–72 hours.
              </p>
              <div className="mt-5 flex justify-center gap-3">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit another
                </Button>
                <Link to="/cars">
                  <Button>Browse cars</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Your details
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="buyer_name">Full name *</Label>
                    <Input id="buyer_name" {...register("buyer_name")} />
                    {errors.buyer_name && <p className="mt-1 text-xs text-destructive">{errors.buyer_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="buyer_email">Email *</Label>
                    <Input id="buyer_email" type="email" {...register("buyer_email")} />
                    {errors.buyer_email && <p className="mt-1 text-xs text-destructive">{errors.buyer_email.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="buyer_phone">Phone (with country code)</Label>
                    <Input id="buyer_phone" placeholder="+254 712 345 678" {...register("buyer_phone")} />
                  </div>
                  <div>
                    <Label>Destination country *</Label>
                    <Select
                      value={watch("buyer_country") || undefined}
                      onValueChange={(v) => setValue("buyer_country", v, { shouldValidate: true })}
                    >
                      <SelectTrigger><SelectValue placeholder="Where to deliver" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.buyer_country && <p className="mt-1 text-xs text-destructive">{errors.buyer_country.message}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle specs
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="make_name">Make *</Label>
                    <Input id="make_name" placeholder="Toyota" {...register("make_name")} />
                    {errors.make_name && <p className="mt-1 text-xs text-destructive">{errors.make_name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="model_name">Model</Label>
                    <Input id="model_name" placeholder="Land Cruiser" {...register("model_name")} />
                  </div>
                  <div>
                    <Label htmlFor="year_from">Year from</Label>
                    <Input id="year_from" type="number" min={1950} max={2030} {...register("year_from")} />
                  </div>
                  <div>
                    <Label htmlFor="year_to">Year to</Label>
                    <Input id="year_to" type="number" min={1950} max={2030} {...register("year_to")} />
                  </div>
                  <div>
                    <Label>Condition</Label>
                    <Select
                      value={watch("preferred_condition")}
                      onValueChange={(v) => setValue("preferred_condition", v as FormValues["preferred_condition"])}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="foreign-used">Foreign-used</SelectItem>
                        <SelectItem value="locally-used">Locally-used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Preferred source country</Label>
                    <Select
                      value={watch("preferred_source_country") || undefined}
                      onValueChange={(v) => setValue("preferred_source_country", v)}
                    >
                      <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                      <SelectContent>
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Transmission</Label>
                    <Select
                      value={watch("transmission_preference") || undefined}
                      onValueChange={(v) => setValue("transmission_preference", v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="automatic">Automatic</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="cvt">CVT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fuel</Label>
                    <Select
                      value={watch("fuel_preference") || undefined}
                      onValueChange={(v) => setValue("fuel_preference", v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="petrol">Petrol</SelectItem>
                        <SelectItem value="diesel">Diesel</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                        <SelectItem value="electric">Electric</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Budget
                </h3>
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_140px]">
                  <div>
                    <Label htmlFor="budget_min">Min</Label>
                    <Input id="budget_min" type="number" min={0} {...register("budget_min")} />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Max</Label>
                    <Input id="budget_max" type="number" min={0} {...register("budget_max")} />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={watch("budget_currency")}
                      onValueChange={(v) => setValue("budget_currency", v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section>
                <Label htmlFor="additional_notes">Additional notes</Label>
                <Textarea
                  id="additional_notes"
                  rows={4}
                  placeholder="Color preferences, must-have features, timeline, port of delivery, etc."
                  {...register("additional_notes")}
                />
              </section>

              <Button type="submit" size="lg" disabled={submitting} className="w-full md:w-auto">
                {submitting ? "Submitting…" : "Submit import request"}
              </Button>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <ShieldCheck className="h-5 w-5 text-success" /> Why use AutoConnect?
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>✓ Verified exporters only</li>
              <li>✓ Free to submit — no obligation</li>
              <li>✓ Multiple quotes, side by side</li>
              <li>✓ Shipping &amp; duty guidance included</li>
            </ul>
          </div>
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Already know what you want?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse live listings marked "Available for export".
            </p>
            <Link to="/cars" search={{ exportOnly: true }}>
              <Button variant="outline" className="mt-3 w-full">Browse exportable cars</Button>
            </Link>
          </div>
        </aside>
      </div>

      {/* How importing works */}
      <section className="border-t bg-background py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold">How importing works</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              From request to delivery, a transparent 4-step process.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-4">
            <Step n={1} icon={<FileText className="h-6 w-6" />} title="Submit request" desc="Tell us the make, model, year range, and budget." />
            <Step n={2} icon={<Search className="h-6 w-6" />} title="Get matched" desc="Verified exporters review and send proposals with photos." />
            <Step n={3} icon={<Handshake className="h-6 w-6" />} title="Choose &amp; pay" desc="Compare offers, agree terms, and pay the exporter directly." />
            <Step n={4} icon={<Ship className="h-6 w-6" />} title="Ship &amp; receive" desc="Track shipment to your port. We help with duty estimates." />
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({ n, icon, title, desc }: { n: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative rounded-lg border bg-card p-6 shadow-sm">
      <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
        {n}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
