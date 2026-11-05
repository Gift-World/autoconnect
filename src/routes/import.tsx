import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowRight,
  Calculator,
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
import { KraCrspCalculator } from "@/components/import/KraCrspCalculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StackPanels, type StackPanel } from "@/components/motion/StackPanels";

const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AED",
  "KES",
  "NGN",
  "GHS",
  "ZAR",
  "CNY",
  "INR",
  "AUD",
  "CAD",
] as const;

const schema = z.object({
  buyer_name: z.string().trim().min(2, "Name required").max(100),
  buyer_email: z.string().trim().email("Valid email required").max(255),
  buyer_phone: z.string().trim().max(30).optional().or(z.literal("")),
  buyer_country: z.string().min(2, "Country required"),
  make_name: z.string().trim().min(1, "Make required").max(60),
  model_name: z.string().trim().max(80).optional().or(z.literal("")),
  year_from: z.coerce
    .number()
    .int()
    .min(1950)
    .max(2030)
    .optional()
    .or(z.literal("" as unknown as number)),
  year_to: z.coerce
    .number()
    .int()
    .min(1950)
    .max(2030)
    .optional()
    .or(z.literal("" as unknown as number)),
  budget_min: z.coerce
    .number()
    .min(0)
    .optional()
    .or(z.literal("" as unknown as number)),
  budget_max: z.coerce
    .number()
    .min(0)
    .optional()
    .or(z.literal("" as unknown as number)),
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
        content: "Submit an import request and get matched with verified exporters globally.",
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

  const panels: StackPanel[] = IMPORT_STEPS.map((step) => ({
    id: step.id,
    label: step.label,
    color: step.color,
    content: (
      <div className="grid h-full gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-ac-ink text-ac-accent [&_svg]:h-6 [&_svg]:w-6">
            {step.icon}
          </span>
          <h3 className="font-brand mt-6 text-4xl sm:text-6xl lg:text-7xl">{step.title}</h3>
          <p className="mt-5 max-w-md text-base leading-7 text-ac-ink/75 sm:text-lg">
            {step.body}
          </p>
        </div>
        <div className="relative hidden h-full max-h-[440px] overflow-hidden rounded-3xl sm:block">
          <img src={step.image} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      </div>
    ),
  }));

  return (
    <main className="overflow-x-clip bg-background text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          <img
            src="/images/hero-driving-crossover.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.92),rgba(11,19,36,.55)_60%,rgba(11,19,36,.7))]" />
          <div className="flex min-h-[560px] flex-col justify-end gap-8 p-6 sm:min-h-[640px] sm:p-10 lg:p-14">
            <div className="max-w-4xl">
              <p className="brand-kicker inline-flex items-center gap-2 text-ac-accent">
                <Globe2 className="h-4 w-4" /> Worldwide import network
              </p>
              <h1 className="font-brand mt-5 text-4xl sm:text-6xl lg:text-7xl">
                Import the exact car you want.{" "}
                <span className="text-ac-accent">Watch it come home.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Tell us your specs and budget. We&apos;ll match you with verified exporters in Japan,
                UK, UAE, Germany, USA, and more.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#request"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:gap-3 hover:brightness-110"
              >
                Start your import request <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/import-tracker"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white/85 transition hover:border-white/50 hover:text-white"
              >
                <Ship className="h-4 w-4" /> Track an existing order
              </Link>
            </div>
            <ul className="grid gap-2 text-sm text-white/80 sm:grid-cols-2 lg:grid-cols-4">
              {WHY.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-ac-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How importing works */}
      <section className="pt-20 sm:pt-28">
        <div className="mx-auto mb-10 max-w-[1360px] px-4 sm:px-6">
          <p className="brand-kicker text-muted-foreground">How importing works</p>
          <h2 className="font-brand mt-4 max-w-3xl text-4xl sm:text-6xl">
            From request to delivery, four clear steps.
          </h2>
        </div>
        <StackPanels panels={panels} />
      </section>

      {/* Request + duty estimate */}
      <section id="request" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="brand-kicker text-muted-foreground">Your request</p>
            <h2 className="font-brand mt-4 text-3xl sm:text-5xl">
              Describe the car. We do the matching.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              All fields marked * are required. We share approved requests only with verified
              exporters. Want to know the landed cost first? Open the duty estimate tab.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <Tabs defaultValue="request" className="min-w-0">
              <TabsList className="h-auto w-full justify-start gap-1 rounded-full bg-muted p-1 sm:w-auto">
                <TabsTrigger value="request" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
                  <FileText className="mr-2 h-4 w-4" /> Request a car
                </TabsTrigger>
                <TabsTrigger value="duty" className="min-h-11 flex-1 rounded-full px-4 sm:flex-none">
                  <Calculator className="mr-2 h-4 w-4" /> Estimate duty
                </TabsTrigger>
              </TabsList>

              <TabsContent value="request" forceMount className="mt-5 data-[state=inactive]:hidden">
                <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:rounded-[36px] sm:p-8">
                  {submitted ? (
                    <div className="py-6 text-center sm:py-10">
                      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15">
                        <CheckCircle2 className="h-9 w-9 text-success" />
                      </span>
                      <h3 className="font-brand mt-5 text-3xl">Request received</h3>
                      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
                        Verified exporters will be notified. Our import specialists typically
                        respond within 24-48 hours.
                      </p>
                      <div className="mt-7 flex flex-wrap justify-center gap-3">
                        <Link
                          to="/account/import-requests"
                          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink"
                        >
                          Track your request <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="outline"
                          className="min-h-11 rounded-full"
                          onClick={() => setSubmitted(false)}
                        >
                          Submit another
                        </Button>
                        <Button asChild variant="ghost" className="min-h-11 rounded-full">
                          <Link to="/cars">Browse cars</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                      <FormGroup n="01" title="Your details">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="buyer_name">Full name *</Label>
                            <Input id="buyer_name" className="mt-1.5 h-11" {...register("buyer_name")} />
                            {errors.buyer_name && <FieldError>{errors.buyer_name.message}</FieldError>}
                          </div>
                          <div>
                            <Label htmlFor="buyer_email">Email *</Label>
                            <Input
                              id="buyer_email"
                              type="email"
                              className="mt-1.5 h-11"
                              {...register("buyer_email")}
                            />
                            {errors.buyer_email && (
                              <FieldError>{errors.buyer_email.message}</FieldError>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="buyer_phone">Phone (with country code)</Label>
                            <Input
                              id="buyer_phone"
                              placeholder="+254 712 345 678"
                              className="mt-1.5 h-11"
                              {...register("buyer_phone")}
                            />
                          </div>
                          <div>
                            <Label>Destination country *</Label>
                            <Select
                              value={watch("buyer_country") || undefined}
                              onValueChange={(v) =>
                                setValue("buyer_country", v, { shouldValidate: true })
                              }
                            >
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue placeholder="Where to deliver" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>
                                    {c.flag} {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.buyer_country && (
                              <FieldError>{errors.buyer_country.message}</FieldError>
                            )}
                          </div>
                        </div>
                      </FormGroup>

                      <FormGroup n="02" title="Vehicle specs">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="make_name">Make *</Label>
                            <Input
                              id="make_name"
                              placeholder="Toyota"
                              className="mt-1.5 h-11"
                              {...register("make_name")}
                            />
                            {errors.make_name && <FieldError>{errors.make_name.message}</FieldError>}
                          </div>
                          <div>
                            <Label htmlFor="model_name">Model</Label>
                            <Input
                              id="model_name"
                              placeholder="Land Cruiser"
                              className="mt-1.5 h-11"
                              {...register("model_name")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="year_from">Year from</Label>
                            <Input
                              id="year_from"
                              type="number"
                              min={1950}
                              max={2030}
                              className="mt-1.5 h-11"
                              {...register("year_from")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="year_to">Year to</Label>
                            <Input
                              id="year_to"
                              type="number"
                              min={1950}
                              max={2030}
                              className="mt-1.5 h-11"
                              {...register("year_to")}
                            />
                          </div>
                          <div>
                            <Label>Condition</Label>
                            <Select
                              value={watch("preferred_condition")}
                              onValueChange={(v) =>
                                setValue("preferred_condition", v as FormValues["preferred_condition"])
                              }
                            >
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue />
                              </SelectTrigger>
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
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue placeholder="No preference" />
                              </SelectTrigger>
                              <SelectContent>
                                {COUNTRIES.map((c) => (
                                  <SelectItem key={c.code} value={c.code}>
                                    {c.flag} {c.name}
                                  </SelectItem>
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
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
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
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="petrol">Petrol</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="hybrid">Hybrid</SelectItem>
                                <SelectItem value="electric">Electric</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </FormGroup>

                      <FormGroup n="03" title="Budget">
                        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_140px]">
                          <div>
                            <Label htmlFor="budget_min">Min</Label>
                            <Input
                              id="budget_min"
                              type="number"
                              min={0}
                              className="mt-1.5 h-11"
                              {...register("budget_min")}
                            />
                          </div>
                          <div>
                            <Label htmlFor="budget_max">Max</Label>
                            <Input
                              id="budget_max"
                              type="number"
                              min={0}
                              className="mt-1.5 h-11"
                              {...register("budget_max")}
                            />
                          </div>
                          <div>
                            <Label>Currency</Label>
                            <Select
                              value={watch("budget_currency")}
                              onValueChange={(v) => setValue("budget_currency", v)}
                            >
                              <SelectTrigger className="mt-1.5 h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CURRENCIES.map((c) => (
                                  <SelectItem key={c} value={c}>
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </FormGroup>

                      <FormGroup n="04" title="Anything else">
                        <Label htmlFor="additional_notes">Additional notes</Label>
                        <Textarea
                          id="additional_notes"
                          rows={4}
                          className="mt-1.5"
                          placeholder="Color preferences, must-have features, timeline, port of delivery, etc."
                          {...register("additional_notes")}
                        />
                      </FormGroup>

                      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-muted-foreground">
                          Free to submit — no obligation.
                        </p>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ac-accent px-7 text-sm font-extrabold text-ac-ink transition hover:brightness-110 disabled:opacity-60 sm:w-auto"
                        >
                          {submitting ? "Submitting…" : "Submit import request"}
                          {!submitting && <ArrowRight className="h-4 w-4" />}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="duty" forceMount className="mt-5 data-[state=inactive]:hidden">
                <div className="mb-4 rounded-2xl bg-ac-powder p-5 text-ac-ink">
                  <p className="font-brand text-2xl">Calculate your import duty</p>
                  <p className="mt-1 text-sm leading-6 text-ac-ink/75">
                    Use our built-in KRA CRSP calculator to estimate the total duty payable for your
                    imported vehicle based on current rates.
                  </p>
                </div>
                <KraCrspCalculator />
              </TabsContent>
            </Tabs>

            {/* Sidebar */}
            <aside className="space-y-4 lg:pt-16">
              <div className="rounded-3xl bg-ac-ink p-6 text-white">
                <p className="brand-kicker inline-flex items-center gap-2 text-ac-accent">
                  <ShieldCheck className="h-4 w-4" /> Why use AutoConnect?
                </p>
                <ul className="mt-4 space-y-3 text-sm text-white/80">
                  {WHY.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ac-accent" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-ac-cream p-6 text-ac-ink">
                <h3 className="font-brand text-2xl">Already know what you want?</h3>
                <p className="mt-2 text-sm leading-6 text-ac-ink/75">
                  Browse live listings marked &quot;Available for export&quot;.
                </p>
                <Link
                  to="/cars"
                  search={{ exportOnly: true }}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-ac-ink/20 px-5 text-sm font-bold transition hover:border-ac-ink"
                >
                  Browse exportable cars <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="font-semibold text-foreground">Already ordered?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Follow milestones, documents and ETA for your import order.
                </p>
                <Link
                  to="/import-tracker"
                  className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-foreground underline-offset-4 hover:underline"
                >
                  Open the order tracker <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

const WHY = [
  "Verified exporters only",
  "Free to submit — no obligation",
  "Multiple quotes, side by side",
  "Shipping & duty guidance included",
] as const;

const IMPORT_STEPS = [
  {
    id: "submit",
    label: "Submit request",
    color: "var(--color-ac-cream)",
    icon: <FileText />,
    title: "Tell us the car.",
    body: "Tell us the make, model, year range, and budget.",
    image: "/images/hero-driving-suv.jpg",
  },
  {
    id: "match",
    label: "Get matched",
    color: "var(--color-ac-powder)",
    icon: <Search />,
    title: "Get matched.",
    body: "Verified exporters review and send proposals with photos.",
    image: "/images/providers/nairobi-vehicle-inspection.jpg",
  },
  {
    id: "choose",
    label: "Choose & pay",
    color: "var(--color-ac-apricot)",
    icon: <Handshake />,
    title: "Choose & pay.",
    body: "Compare offers, agree terms, and pay the exporter directly.",
    image: "/images/hero-driving-sedan.jpg",
  },
  {
    id: "ship",
    label: "Ship & receive",
    color: "var(--color-ac-stone)",
    icon: <Ship />,
    title: "Ship & receive.",
    body: "Track shipment to your port. We help with duty estimates.",
    image: "/images/hero-driving-crossover.jpg",
  },
];

function FormGroup({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-border text-[11px] font-bold text-muted-foreground">
          {n}
        </span>
        <span className="font-brand text-xl text-foreground">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs text-destructive">{children}</p>;
}
