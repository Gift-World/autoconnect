import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ScanLine,
  Camera,
  ShieldCheck,
  Wand2,
  Pencil,
} from "lucide-react";
import { aiGenerateDescription, aiListingQuality } from "@/lib/ai.functions";
import { COUNTRIES, CURRENCIES, countryByCode } from "@/lib/countries";
import {
  decodeVin,
  normalizeBody,
  normalizeFuel,
  normalizeTransmission,
  type NhtsaMake,
  type NhtsaModel,
} from "@/lib/nhtsa";
import { getFleetByteMakes, getFleetByteModels } from "@/lib/fleetbyte";
import { FuelEconomyEnricher } from "@/components/seller/FuelEconomyEnricher";
import { GuidedPhotoUploader, type UploadedPhoto } from "@/components/seller/GuidedPhotoUploader";
import { REQUIRED_PHOTO_KINDS, PHOTO_LABELS } from "@/lib/listing-checklist";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ChoiceTiles,
  CheckLine,
  HelperCard,
  ListingPreview,
  StepIntro,
  WizardProgress,
  type WizardStep,
} from "@/components/listing/ListingWizardParts";


export const Route = createFileRoute("/_authenticated/seller/listings/new")({
  validateSearch: (search: Record<string, unknown>) => ({
    edit: typeof search.edit === "string" ? search.edit : undefined,
  }),
  component: NewListing,
});

const schema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
    make_name: z.string().trim().min(1, "Make is required"),
    model_name: z.string().trim().min(1, "Model is required"),
    year: z.coerce
      .number()
      .int()
      .min(1950)
      .max(new Date().getFullYear() + 1),
    price: z.coerce.number().positive("Price must be greater than 0"),
    currency: z.string().min(3).max(3),
    country: z.string().length(2, "Country is required"),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    mileage: z.coerce.number().int().min(0).optional(),
    mileage_unit: z.enum(["km", "miles"]),
    transmission: z.enum(["automatic", "manual", "semi-automatic"]).optional().or(z.literal("")),
    fuel_type: z
      .enum(["petrol", "diesel", "electric", "hybrid", "other"])
      .optional()
      .or(z.literal("")),
    body_type: z
      .enum([
        "sedan",
        "suv",
        "hatchback",
        "pickup",
        "van",
        "coupe",
        "wagon",
        "convertible",
        "bus",
        "other",
      ])
      .optional()
      .or(z.literal("")),
    color: z.string().trim().max(40).optional().or(z.literal("")),
    engine_size: z.string().trim().max(20).optional().or(z.literal("")),
    condition: z.enum(["new", "foreign-used", "locally-used"]),
    steering_side: z.enum(["left", "right"]),
    vin: z.string().trim().max(17).optional().or(z.literal("")),
    description: z.string().trim().max(4000).optional().or(z.literal("")),
    available_for_export: z.boolean(),
    shipping_info: z.string().trim().max(500).optional().or(z.literal("")),
    import_duties_note: z.string().trim().max(500).optional().or(z.literal("")),
    pay_full: z.boolean(),
    pay_deposit: z.boolean(),
    pay_installments: z.boolean(),
    deposit_percent: z.coerce.number().min(1).max(100).optional(),
    installment_months: z.coerce.number().int().min(1).max(120).optional(),
    installment_interest_rate: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((v) => v.pay_full || v.pay_deposit || v.pay_installments, {
    message: "Enable at least one payment option",
    path: ["pay_full"],
  });

type FormValues = z.infer<typeof schema>;

function NewListing() {
  const navigate = useNavigate();
  const { edit: editingId } = Route.useSearch();
  const [makes, setMakes] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [decodingVin, setDecodingVin] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [yardId, setYardId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [genDesc, setGenDesc] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      title: "",
      make_name: "",
      model_name: "",
      year: new Date().getFullYear(),
      price: 0,
      currency: "USD",
      country: "",
      city: "",
      mileage: 0,
      mileage_unit: "km",
      transmission: "",
      fuel_type: "",
      body_type: "",
      color: "",
      engine_size: "",
      condition: "foreign-used",
      steering_side: "left",
      vin: "",
      description: "",
      available_for_export: false,
      shipping_info: "",
      import_duties_note: "",
      pay_full: true,
      pay_deposit: false,
      pay_installments: false,
      deposit_percent: 20,
      installment_months: 12,
      installment_interest_rate: 0,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = form;

  const watchMake = watch("make_name");
  const watchExport = watch("available_for_export");
  const watchPrice = watch("price");
  const watchFull = watch("pay_full");
  const watchDeposit = watch("pay_deposit");
  const watchInstall = watch("pay_installments");
  const watchDepPct = watch("deposit_percent");
  const watchMonths = watch("installment_months");
  const watchRate = watch("installment_interest_rate");
  const monthlyPreview = useMemo(() => {
    const p = Number(watchPrice) || 0;
    const m = Number(watchMonths) || 0;
    const r = (Number(watchRate) || 0) / 100 / 12;
    if (!p || !m) return 0;
    if (r === 0) return p / m;
    return (p * r) / (1 - Math.pow(1 + r, -m));
  }, [watchPrice, watchMonths, watchRate]);

  // Load auth + seller + makes on mount
  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, country, city")
        .eq("profile_id", u.user.id)
        .maybeSingle();
      if (seller) {
        setSellerId(seller.id);
        if (seller.country) setValue("country", seller.country);
        if (seller.city) setValue("city", seller.city);
        const { data: yard } = await supabase
          .from("car_yards")
          .select("id")
          .eq("seller_id", seller.id)
          .maybeSingle();
        if (yard) setYardId(yard.id);

        if (editingId) {
          const { data: existing, error: existingError } = await supabase
            .from("cars")
            .select("title, make_name, model_name, year, price, currency, country, city, mileage, mileage_unit, transmission, fuel_type, body_type, color, engine_size, condition, steering_side, vin, description, available_for_export, shipping_info, import_duties_note, pay_full, pay_deposit, pay_installments, deposit_percent, installment_months, installment_interest_rate")
            .eq("id", editingId)
            .eq("seller_id", seller.id)
            .maybeSingle();
          if (existingError) throw existingError;
          if (!existing) {
            toast.error("That listing is unavailable or does not belong to your seller account.");
            navigate({ to: "/seller" });
            return;
          }
          reset({
            title: existing.title,
            make_name: existing.make_name,
            model_name: existing.model_name,
            year: Number(existing.year),
            price: Number(existing.price),
            currency: existing.currency,
            country: existing.country,
            city: existing.city ?? "",
            mileage: existing.mileage ?? 0,
            mileage_unit: existing.mileage_unit ?? "km",
            transmission: existing.transmission ?? "",
            fuel_type: existing.fuel_type ?? "",
            body_type: existing.body_type ?? "",
            color: existing.color ?? "",
            engine_size: existing.engine_size ?? "",
            condition: existing.condition,
            steering_side: existing.steering_side ?? "left",
            vin: existing.vin ?? "",
            description: existing.description ?? "",
            available_for_export: Boolean(existing.available_for_export),
            shipping_info: existing.shipping_info ?? "",
            import_duties_note: existing.import_duties_note ?? "",
            pay_full: Boolean(existing.pay_full),
            pay_deposit: Boolean(existing.pay_deposit),
            pay_installments: Boolean(existing.pay_installments),
            deposit_percent: existing.deposit_percent ?? 20,
            installment_months: existing.installment_months ?? 12,
            installment_interest_rate: existing.installment_interest_rate ?? 0,
          });
        }
      }
      try {
        setMakes(await getFleetByteMakes());
      } catch (e) {
        console.error(e);
      }
    })();
  }, [editingId, navigate, reset, setValue]);

  // Load models when make changes
  useEffect(() => {
    if (!watchMake) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    getFleetByteModels(watchMake)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, [watchMake]);

  async function handleDecodeVin() {
    const vin = (watch("vin") ?? "").trim().toUpperCase();
    if (vin.length !== 17) {
      toast.error("VIN must be exactly 17 characters");
      return;
    }
    setDecodingVin(true);
    try {
      const decoded = await decodeVin(vin);
      if (decoded.make) setValue("make_name", titleCase(decoded.make));
      if (decoded.model) setValue("model_name", decoded.model);
      if (decoded.year) setValue("year", Number(decoded.year));
      const fuel = normalizeFuel(decoded.fuelType);
      const trans = normalizeTransmission(decoded.transmission);
      const body = normalizeBody(decoded.bodyClass);
      if (fuel) setValue("fuel_type", fuel as never);
      if (trans) setValue("transmission", trans as never);
      if (body) setValue("body_type", body as never);
      if (decoded.displacementL) setValue("engine_size", `${decoded.displacementL}L`);
      toast.success("VIN decoded — fields pre-filled");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "VIN decode failed");
    } finally {
      setDecodingVin(false);
    }
  }

  async function onSubmit(values: FormValues) {
    if (!sellerId) {
      toast.error("Seller profile not found");
      return;
    }
    if (!editingId && photos.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    const missing = REQUIRED_PHOTO_KINDS.filter((k) => !photos.some((p) => p.kind === k));
    if (!editingId && missing.length > 0) {
      toast.error(`Missing required photos: ${missing.map((k) => PHOTO_LABELS[k]).join(", ")}`);
      return;
    }
    setSubmitting(true);
    try {
      const primary = photos.find((p) => p.isPrimary) ?? photos[0];
      const listingPayload = {
        seller_id: sellerId,
        title: values.title,
        make_name: values.make_name,
        model_name: values.model_name,
        year: values.year,
        price: values.price,
        currency: values.currency,
        country: values.country,
        city: values.city || null,
        location_display: values.city ? `${values.city}, ${values.country}` : values.country,
        mileage: values.mileage ?? null,
        mileage_unit: values.mileage_unit,
        transmission: values.transmission || null,
        fuel_type: values.fuel_type || null,
        body_type: values.body_type || null,
        color: values.color || null,
        engine_size: values.engine_size || null,
        condition: values.condition,
        description: values.description || null,
        right_hand_drive: values.steering_side === "right",
        steering_side: values.steering_side,
        available_for_export: values.available_for_export,
        shipping_info: values.available_for_export ? values.shipping_info || null : null,
        import_duties_note: values.available_for_export ? values.import_duties_note || null : null,
        vin: values.vin || null,
        api_source: values.vin ? "nhtsa_vpic" : null,
        status: "pending" as const,
        yard_id: yardId,
        pay_full: values.pay_full,
        pay_deposit: values.pay_deposit,
        pay_installments: values.pay_installments,
        deposit_percent: values.pay_deposit ? (values.deposit_percent ?? 20) : null,
        installment_months: values.pay_installments ? (values.installment_months ?? 12) : null,
        installment_interest_rate: values.pay_installments
          ? (values.installment_interest_rate ?? 0)
          : null,
        installment_monthly: values.pay_installments
          ? Math.round(monthlyPreview * 100) / 100
          : null,
      };

      const { data: car, error: carErr } = editingId
        ? await supabase
            .from("cars")
            .update({ ...listingPayload, status: "pending" })
            .eq("id", editingId)
            .eq("seller_id", sellerId)
            .select("id")
            .single()
        : await supabase
            .from("cars")
            .insert(listingPayload)
            .select("id")
            .single();
      if (carErr) throw carErr;

      if (photos.length > 0) {
        const imageRows = photos.map((p, idx) => ({
          car_id: car.id,
          image_url: p.url,
          is_primary: p.path === primary.path,
          sort_order: idx,
          photo_kind: p.kind === "extra" ? null : p.kind,
        }));
        const { error: imgErr } = await supabase.from("car_images").insert(imageRows);
        if (imgErr) throw imgErr;
      }

      toast.success(editingId ? "Listing update submitted for review" : "Listing submitted for review");
      navigate({ to: "/seller" });
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to create listing");
    } finally {
      setSubmitting(false);
    }
  }

  const years = useMemo(() => {
    const now = new Date().getFullYear() + 1;
    return Array.from({ length: now - 1950 + 1 }, (_, i) => now - i);
  }, []);


  /* ---------------- Wizard state (presentation only) ---------------- */
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [quality, setQuality] = useState<ListingQuality | null>(null);
  const [checkingQuality, setCheckingQuality] = useState(false);
  const lastStep = STEPS.length - 1;

  // When editing, every step is already filled in — let the seller jump anywhere.
  useEffect(() => {
    if (editingId) setMaxVisited(lastStep);
  }, [editingId, lastStep]);

  function goTo(index: number) {
    const next = Math.max(0, Math.min(lastStep, index));
    setStep(next);
    setMaxVisited((m) => Math.max(m, next));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function next() {
    const fields = STEP_FIELDS[STEPS[step].id] ?? [];
    if (fields.length > 0) {
      const ok = await form.trigger(fields as never);
      if (!ok) {
        toast.error("Check the highlighted fields first");
        return;
      }
    }
    if (STEPS[step].id === "payments" && !watchFull && !watchDeposit && !watchInstall) {
      toast.error("Enable at least one payment option");
      return;
    }
    goTo(step + 1);
  }

  function onInvalid(errs: FieldErrors<FormValues>) {
    const keys = Object.keys(errs);
    const target = STEPS.findIndex((s) =>
      (STEP_FIELDS[s.id] ?? []).some((f) => keys.includes(f)),
    );
    if (target >= 0) goTo(target);
    toast.error("Some details need another look");
  }

  async function generateDescription() {
    const v = form.getValues();
    if (!v.make_name || !v.model_name || !v.year) {
      toast.error("Add make, model and year first");
      return;
    }
    setGenDesc(true);
    try {
      const { description } = await aiGenerateDescription({
        data: {
          make: v.make_name,
          model: v.model_name,
          year: Number(v.year),
          mileage: v.mileage ? Number(v.mileage) : undefined,
          mileage_unit: v.mileage_unit,
          transmission: v.transmission || undefined,
          fuel_type: v.fuel_type || undefined,
          body_type: v.body_type || undefined,
          color: v.color || undefined,
          engine_size: v.engine_size || undefined,
          condition: v.condition,
          country: v.country || undefined,
          features: v.description || undefined,
        },
      });
      setValue("description", description, { shouldDirty: true });
      toast.success("Description generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI failed");
    } finally {
      setGenDesc(false);
    }
  }

  const missingPhotoKinds = REQUIRED_PHOTO_KINDS.filter((k) => !photos.some((p) => p.kind === k));

  async function runQualityCheck() {
    const v = form.getValues();
    setCheckingQuality(true);
    try {
      const result = await aiListingQuality({
        data: {
          title: v.title || "",
          year: Number(v.year) || new Date().getFullYear(),
          price: Number(v.price) || 0,
          currency: v.currency,
          country: v.country || "",
          description: v.description || null,
          photo_count: photos.length,
          missing_photos: missingPhotoKinds.map((k) => PHOTO_LABELS[k]),
          // Documents are attached after submission, from the Documents page.
          missing_documents: [],
          rejection_reason: null,
        },
      });
      setQuality(result as ListingQuality);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Quality check failed");
    } finally {
      setCheckingQuality(false);
    }
  }

  const v = watch();
  const cover = photos.find((p) => p.isPrimary) ?? photos[0];
  const countryInfo = v.country ? countryByCode(v.country) : null;
  const priceLabel =
    Number(v.price) > 0
      ? `${v.currency} ${Number(v.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : undefined;
  const descLength = (v.description ?? "").trim().length;
  const localChecks = [
    {
      ok: (v.title ?? "").trim().length >= 5,
      label: "Clear listing title",
      hint: "At least 5 characters — year, make, model and one standout detail work well.",
      step: "vehicle",
    },
    {
      ok: Boolean(editingId) || missingPhotoKinds.length === 0,
      label: editingId
        ? "Photos (unchanged unless you add new ones)"
        : `All ${REQUIRED_PHOTO_KINDS.length} required photos`,
      hint: `${missingPhotoKinds.length} still missing: ${missingPhotoKinds
        .slice(0, 4)
        .map((k) => PHOTO_LABELS[k])
        .join(", ")}${missingPhotoKinds.length > 4 ? "…" : ""}`,
      step: "photos",
    },
    {
      ok: descLength >= 80,
      label: "A helpful description",
      hint: "A few sentences on history and condition. The AI writer can draft it for you.",
      step: "description",
    },
    {
      ok: Number(v.price) > 0 && Boolean(v.country),
      label: "Price and location",
      hint: "Buyers filter by both.",
      step: "price",
    },
    {
      ok: Boolean(v.mileage) && Boolean(v.transmission) && Boolean(v.fuel_type),
      label: "Mileage, transmission and fuel",
      hint: "These are the first specs buyers look for.",
      step: "details",
    },
    {
      ok: Boolean(v.pay_full || v.pay_deposit || v.pay_installments),
      label: "At least one payment option",
      step: "payments",
    },
  ];

  const stepId = STEPS[step].id;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow={editingId ? "Edit listing" : "New listing"}
        title={editingId ? "Update your listing" : "Let's list your car"}
        description={
          editingId
            ? "Changes are sent back for review before they appear publicly."
            : "Listings are reviewed before they appear in the public marketplace."
        }
        crumbs={[
          { label: "Seller", to: "/seller" },
          { label: editingId ? "Edit listing" : "New listing" },
        ]}
        actions={
          <Button asChild variant="outline" className="h-11 rounded-full">
            <Link to="/seller">Save &amp; exit</Link>
          </Button>
        }
      />

      <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
        <WizardProgress steps={STEPS} current={step} maxVisited={maxVisited} onJump={goTo} />
      </div>

      <form
        onSubmit={(e) => {
          if (step < lastStep) {
            e.preventDefault();
            void next();
            return;
          }
          void handleSubmit(onSubmit, onInvalid)(e);
        }}
        className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-8 lg:p-10">
          {/* ---------------- 1. VIN ---------------- */}
          {stepId === "vin" && (
            <>
              <StepIntro
                kicker="Quick start"
                title="Have the VIN handy?"
                description="We can fill in make, model, year, fuel, body and engine for you. It's optional — skip if you'd rather type."
              />
              <HelperCard
                icon={<ScanLine />}
                title="VIN decoder"
                badge="Free · NHTSA vPIC"
              >
                Powered by NHTSA vPIC — free, no API key. Best results for US-market vehicles.
              </HelperCard>
              <div className="mt-6 space-y-2">
                <Label htmlFor="vin" className="text-sm font-semibold">
                  Vehicle identification number
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="vin"
                    placeholder="17-character VIN (e.g. 1HGCM82633A004352)"
                    maxLength={17}
                    {...register("vin")}
                    className="h-12 rounded-xl font-mono text-base uppercase"
                  />
                  <Button
                    type="button"
                    onClick={handleDecodeVin}
                    disabled={decodingVin}
                    className="h-12 shrink-0 rounded-full bg-ac-accent px-6 text-ac-ink hover:bg-ac-accent/90"
                  >
                    {decodingVin ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Decode VIN
                  </Button>
                </div>
                {errors.vin?.message && (
                  <p className="text-xs text-destructive">{errors.vin.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Found on the dashboard near the windscreen, the driver's door frame or the
                  logbook.
                </p>
              </div>
            </>
          )}

          {/* ---------------- 2. Vehicle ---------------- */}
          {stepId === "vehicle" && (
            <>
              <StepIntro
                kicker="The car"
                title="Which car are you selling?"
                description="Start with the basics. Buyers search by make, model and year."
              />
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Make" error={errors.make_name?.message}>
                  <Select
                    value={watch("make_name")}
                    onValueChange={(val) => {
                      setValue("make_name", val);
                      setValue("model_name", "");
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Select make" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {makes.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {titleCase(m.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Model" error={errors.model_name?.message}>
                  <Select
                    value={watch("model_name")}
                    onValueChange={(val) => setValue("model_name", val)}
                    disabled={!watchMake || loadingModels}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue
                        placeholder={
                          !watchMake
                            ? "Select make first"
                            : loadingModels
                              ? "Loading…"
                              : "Select model"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                      {!loadingModels && models.length === 0 && watchMake && (
                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                          No models — type manually below
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <Input
                    className="mt-2 h-12 rounded-xl"
                    placeholder="Or type model manually"
                    {...register("model_name")}
                  />
                </Field>

                <Field label="Year" error={errors.year?.message}>
                  <Select
                    value={String(watch("year"))}
                    onValueChange={(val) => setValue("year", Number(val))}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Listing title"
                  error={errors.title?.message}
                  className="md:col-span-2"
                >
                  <Input
                    className="h-12 rounded-xl text-base"
                    placeholder="e.g. 2018 Toyota Land Cruiser V8 — Low Mileage"
                    {...register("title")}
                  />
                  {!(v.title ?? "").trim() && v.make_name && v.model_name && (
                    <button
                      type="button"
                      onClick={() =>
                        setValue(
                          "title",
                          `${v.year} ${titleCase(v.make_name)} ${v.model_name}`.trim(),
                          { shouldValidate: true },
                        )
                      }
                      className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
                    >
                      <Wand2 className="h-4 w-4 text-foreground" />
                      Use “{v.year} {titleCase(v.make_name)} {v.model_name}”
                    </button>
                  )}
                </Field>
              </div>
            </>
          )}

          {/* ---------------- 3. Photos ---------------- */}
          {stepId === "photos" && (
            <>
              <StepIntro
                kicker="Photos"
                title="Show buyers every angle"
                description="Listings with the full photo set get reviewed faster and earn more trust. Tap a slot to add that exact shot."
              />
              {editingId && (
                <p className="mb-4 rounded-2xl bg-muted/50 p-3 text-sm text-muted-foreground">
                  Your existing photos stay on the listing. Anything you add here is added to them.
                </p>
              )}
              {userId ? (
                <GuidedPhotoUploader userId={userId} value={photos} onChange={setPhotos} />
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
                  ))}
                  <p className="col-span-full text-sm text-muted-foreground">
                    Loading the photo uploader… Sign in again if this doesn't appear.
                  </p>
                </div>
              )}
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Daylight, no filters", "Shoot in open shade for true colours."],
                  ["Clean car, clear background", "Move it away from clutter."],
                  ["Landscape orientation", "Hold your phone sideways."],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-2xl bg-muted/40 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Camera className="h-4 w-4 text-foreground" /> {t}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ---------------- 4. Details ---------------- */}
          {stepId === "details" && (
            <>
              <StepIntro
                kicker="Specs"
                title="Tell buyers how it drives"
                description="Tap to choose. Anything you skip can be added later."
              />
              <div className="space-y-7">
                <Field label="Condition" error={errors.condition?.message}>
                  <ChoiceTiles
                    ariaLabel="Condition"
                    value={watch("condition")}
                    onChange={(val) => setValue("condition", val as never)}
                    options={[
                      { value: "new", label: "New" },
                      { value: "foreign-used", label: "Foreign used" },
                      { value: "locally-used", label: "Locally used" },
                    ]}
                  />
                </Field>

                <Field label="Mileage" error={errors.mileage?.message}>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="h-12 rounded-xl text-base"
                      {...register("mileage")}
                    />
                    <div className="flex shrink-0 rounded-xl border border-border p-1">
                      {(["km", "miles"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setValue("mileage_unit", u)}
                          aria-pressed={watch("mileage_unit") === u}
                          className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${
                            watch("mileage_unit") === u
                              ? "bg-foreground text-background"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </Field>

                <Field label="Transmission">
                  <ChoiceTiles
                    ariaLabel="Transmission"
                    value={watch("transmission") || ""}
                    onChange={(val) => setValue("transmission", val as never)}
                    options={[
                      { value: "automatic", label: "Automatic" },
                      { value: "manual", label: "Manual" },
                      { value: "semi-automatic", label: "Semi-automatic" },
                    ]}
                  />
                </Field>

                <Field label="Fuel type">
                  <ChoiceTiles
                    ariaLabel="Fuel type"
                    value={watch("fuel_type") || ""}
                    onChange={(val) => setValue("fuel_type", val as never)}
                    columns="grid-cols-2 sm:grid-cols-5"
                    options={[
                      { value: "petrol", label: "Petrol" },
                      { value: "diesel", label: "Diesel" },
                      { value: "hybrid", label: "Hybrid" },
                      { value: "electric", label: "Electric" },
                      { value: "other", label: "Other" },
                    ]}
                  />
                </Field>

                <Field label="Body type">
                  <ChoiceTiles
                    ariaLabel="Body type"
                    value={watch("body_type") || ""}
                    onChange={(val) => setValue("body_type", val as never)}
                    columns="grid-cols-2 sm:grid-cols-5"
                    options={BODY_TYPES.map((b) => ({ value: b, label: titleCase(b) }))}
                  />
                </Field>

                <Field label="Steering side" error={errors.steering_side?.message}>
                  <ChoiceTiles
                    ariaLabel="Steering side"
                    value={watch("steering_side")}
                    onChange={(val) => setValue("steering_side", val as never)}
                    columns="grid-cols-1 sm:grid-cols-2"
                    options={[
                      { value: "left", label: "Left-hand drive (LHD)" },
                      { value: "right", label: "Right-hand drive (RHD)" },
                    ]}
                  />
                </Field>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Color">
                    <Input
                      className="h-12 rounded-xl"
                      placeholder="e.g. Pearl White"
                      {...register("color")}
                    />
                  </Field>
                  <Field label="Engine size">
                    <Input
                      className="h-12 rounded-xl"
                      placeholder="e.g. 2.0L, 4.6L V8"
                      {...register("engine_size")}
                    />
                  </Field>
                </div>

                <FuelEconomyEnricher
                  make={watchMake || ""}
                  model={watch("model_name") || ""}
                  year={watch("year") || 0}
                  onAccept={(data) => {
                    if (data.engine_size) setValue("engine_size", data.engine_size);
                    if (data.fuel_type) setValue("fuel_type", data.fuel_type as never);
                    if (data.transmission) setValue("transmission", data.transmission as never);
                  }}
                />
              </div>
            </>
          )}

          {/* ---------------- 5. Description ---------------- */}
          {stepId === "description" && (
            <>
              <StepIntro
                kicker="Description"
                title="Describe it like you would to a friend"
                description="Service history, accessories, why you're selling. Honest detail builds trust."
              />
              <HelperCard
                icon={<Sparkles />}
                title="Let AI write a first draft"
                badge="AI helper"
                action={
                  <Button
                    type="button"
                    disabled={genDesc}
                    onClick={() => void generateDescription()}
                    className="h-11 rounded-full bg-ac-ink px-5 text-white hover:bg-ac-ink/90 dark:bg-ac-accent dark:text-ac-ink dark:hover:bg-ac-accent/90"
                  >
                    {genDesc ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Generate with AI
                  </Button>
                }
              >
                Uses the make, model, year and specs you've entered. Anything you've typed below is
                treated as features to include. Always read it through before submitting.
              </HelperCard>
              <div className="mt-6 space-y-1.5">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  rows={10}
                  className="rounded-2xl text-base leading-7"
                  placeholder="Service history, accessories, why you're selling, etc. — or click Generate with AI."
                  {...register("description")}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-destructive">{errors.description?.message}</span>
                  <span>{descLength} / 4000</span>
                </div>
              </div>
            </>
          )}

          {/* ---------------- 6. Price & location ---------------- */}
          {stepId === "price" && (
            <>
              <StepIntro
                kicker="Price & location"
                title="Set your price"
                description="You can change it any time. Where the car is parked helps local buyers find it."
              />
              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Price" error={errors.price?.message} className="md:col-span-2">
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="25000"
                    className="font-brand h-16 rounded-2xl text-3xl"
                    {...register("price")}
                  />
                </Field>
                <Field label="Currency" error={errors.currency?.message}>
                  <Select
                    value={watch("currency")}
                    onValueChange={(val) => setValue("currency", val)}
                  >
                    <SelectTrigger className="h-16 rounded-2xl text-base">
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
                </Field>
                <Field label="Country" error={errors.country?.message} className="md:col-span-2">
                  <Select
                    value={watch("country")}
                    onValueChange={(val) => setValue("country", val)}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Where is the car located?" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.flag} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="City" error={errors.city?.message}>
                  <Input
                    className="h-12 rounded-xl"
                    placeholder="e.g. Nairobi"
                    {...register("city")}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ---------------- 7. Export ---------------- */}
          {stepId === "export" && (
            <>
              <StepIntro
                kicker="Export & shipping"
                title="Open it up to buyers abroad?"
                description="Optional. Turn this on if you can help ship the car outside your country."
              />
              <label
                htmlFor="exp"
                className="flex min-h-[72px] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border p-4 transition hover:border-foreground/40"
              >
                <div>
                  <span className="font-semibold">Available for international export</span>
                  <p className="text-sm text-muted-foreground">
                    Buyers from any country can request a shipping quote.
                  </p>
                </div>
                <Switch
                  id="exp"
                  checked={watchExport}
                  onCheckedChange={(val) => setValue("available_for_export", val)}
                />
              </label>
              {watchExport && (
                <div className="mt-5 grid gap-5">
                  <Field
                    label="Shipping info / supported ports"
                    error={errors.shipping_info?.message}
                  >
                    <Textarea
                      rows={3}
                      className="rounded-2xl"
                      placeholder="e.g. RoRo or container from Mombasa to Lagos, Dar, Apapa…"
                      {...register("shipping_info")}
                    />
                  </Field>
                  <Field
                    label="Import duties / paperwork note"
                    error={errors.import_duties_note?.message}
                  >
                    <Textarea
                      rows={3}
                      className="rounded-2xl"
                      placeholder="e.g. Buyer is responsible for destination duties. We provide bill of lading + export certificate."
                      {...register("import_duties_note")}
                    />
                  </Field>
                </div>
              )}
            </>
          )}

          {/* ---------------- 8. Payments ---------------- */}
          {stepId === "payments" && (
            <>
              <StepIntro
                kicker="Payment options"
                title="How can buyers pay?"
                description="Choose how buyers may pay for this car. Pick at least one."
              />
              <div className="space-y-3">
                <PayOption
                  title="Full payment"
                  body="Buyer pays the full price up front through escrow."
                  checked={Boolean(watchFull)}
                  input={
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[var(--color-ac-accent)]"
                      {...register("pay_full")}
                    />
                  }
                />
                <PayOption
                  title="Deposit / reservation"
                  body="Buyer pays a deposit to reserve; balance settled later."
                  checked={Boolean(watchDeposit)}
                  input={
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[var(--color-ac-accent)]"
                      {...register("pay_deposit")}
                    />
                  }
                >
                  {watchDeposit && (
                    <div className="mt-3 flex items-center gap-2">
                      <Label className="text-xs">Deposit %</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        className="h-11 w-28 rounded-xl"
                        {...register("deposit_percent")}
                      />
                      {errors.deposit_percent?.message && (
                        <span className="text-xs text-destructive">
                          {errors.deposit_percent.message}
                        </span>
                      )}
                    </div>
                  )}
                </PayOption>
                <PayOption
                  title="Monthly installments"
                  body="Buyer pays over time. You set the term & rate."
                  checked={Boolean(watchInstall)}
                  input={
                    <input
                      type="checkbox"
                      className="mt-1 h-5 w-5 accent-[var(--color-ac-accent)]"
                      {...register("pay_installments")}
                    />
                  }
                >
                  {watchInstall && (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Label className="w-24 text-xs">Months</Label>
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          className="h-11 w-28 rounded-xl"
                          {...register("installment_months")}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="w-24 text-xs">Interest %/yr</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="0.1"
                          className="h-11 w-28 rounded-xl"
                          {...register("installment_interest_rate")}
                        />
                      </div>
                      {(errors.installment_months?.message ||
                        errors.installment_interest_rate?.message) && (
                        <p className="text-xs text-destructive sm:col-span-2">
                          {errors.installment_months?.message ??
                            errors.installment_interest_rate?.message}
                        </p>
                      )}
                      {monthlyPreview > 0 && (
                        <p className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground sm:col-span-2">
                          Estimated monthly ≈{" "}
                          <span className="font-semibold text-foreground">
                            {monthlyPreview.toFixed(2)} {watch("currency")}
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </PayOption>
              </div>
              {errors.pay_full && (
                <p className="mt-3 text-sm text-destructive">{errors.pay_full.message as string}</p>
              )}
              {!watchFull && !watchDeposit && !watchInstall && (
                <p className="mt-3 text-sm text-destructive">Enable at least one option</p>
              )}
            </>
          )}

          {/* ---------------- 9. Review ---------------- */}
          {stepId === "review" && (
            <>
              <StepIntro
                kicker="Review"
                title={editingId ? "Ready to resubmit?" : "Ready to submit?"}
                description={
                  editingId
                    ? "Changes are sent back for review before they appear publicly."
                    : "Our team reviews every listing before it goes live. Here's a quick check first."
                }
              />

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-3xl border border-border p-4 sm:p-5">
                  <p className="brand-kicker text-muted-foreground">Listing quality</p>
                  <ul className="mt-2 divide-y divide-border">
                    {localChecks.map((c) => (
                      <CheckLine key={c.label} ok={c.ok} label={c.label} hint={c.hint} />
                    ))}
                  </ul>
                </div>

                <HelperCard
                  icon={<ShieldCheck />}
                  title="Ask AI what could delay approval"
                  badge="AI helper"
                  action={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={checkingQuality}
                      onClick={() => void runQualityCheck()}
                      className="h-11 rounded-full bg-card"
                    >
                      {checkingQuality ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-foreground" />
                      )}
                      Check listing quality
                    </Button>
                  }
                >
                  A friendly second look at your title, price, description and photos.
                  {quality && (
                    <div className="mt-3 rounded-2xl bg-card p-3 text-sm">
                      <p className="font-semibold text-foreground">
                        {quality.readiness === "ready"
                          ? "Looks ready for review"
                          : quality.readiness === "needs_work"
                            ? "A few things could delay approval"
                            : "Important items are still missing"}
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs leading-5">
                        {quality.warnings.map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                        {quality.tips.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </HelperCard>
              </div>

              <dl className="mt-6 divide-y divide-border rounded-3xl border border-border">
                {[
                  {
                    k: "Car",
                    val: [v.year, v.make_name && titleCase(v.make_name), v.model_name]
                      .filter(Boolean)
                      .join(" "),
                    s: "vehicle",
                  },
                  { k: "Title", val: v.title, s: "vehicle" },
                  { k: "Photos", val: `${photos.length} added`, s: "photos" },
                  {
                    k: "Specs",
                    val: [
                      v.condition && titleCase(v.condition),
                      v.mileage ? `${Number(v.mileage).toLocaleString()} ${v.mileage_unit}` : "",
                      v.transmission && titleCase(v.transmission),
                      v.fuel_type && titleCase(v.fuel_type),
                      v.body_type && titleCase(v.body_type),
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    s: "details",
                  },
                  {
                    k: "Description",
                    val: descLength ? `${descLength} characters` : "",
                    s: "description",
                  },
                  {
                    k: "Price",
                    val: [priceLabel, [v.city, countryInfo?.name ?? v.country].filter(Boolean).join(", ")]
                      .filter(Boolean)
                      .join(" · "),
                    s: "price",
                  },
                  { k: "Export", val: v.available_for_export ? "Available" : "Local only", s: "export" },
                  {
                    k: "Payments",
                    val: [
                      v.pay_full && "Full",
                      v.pay_deposit && `Deposit ${v.deposit_percent ?? 20}%`,
                      v.pay_installments && `${v.installment_months ?? 12} months`,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    s: "payments",
                  },
                ].map((row) => (
                  <div key={row.k} className="flex items-center gap-3 px-4 py-2 sm:px-5">
                    <dt className="w-24 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {row.k}
                    </dt>
                    <dd className="min-w-0 flex-1 truncate text-sm">
                      {row.val || <span className="text-muted-foreground">Not added</span>}
                    </dd>
                    <button
                      type="button"
                      onClick={() => goTo(STEPS.findIndex((s) => s.id === row.s))}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${row.k}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </dl>
            </>
          )}

          {/* ---------------- Footer nav ---------------- */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-5">
            {step > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => goTo(step - 1)}
                className="h-12 rounded-full px-4 font-semibold underline-offset-4 hover:underline"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <Button type="button" variant="ghost" asChild className="h-12 rounded-full px-4">
                <Link to="/seller">Cancel</Link>
              </Button>
            )}
            <div className="flex items-center gap-2">
              {(stepId === "vin" || stepId === "export") && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => goTo(step + 1)}
                  className="h-12 rounded-full px-5"
                >
                  Skip
                </Button>
              )}
              {step < lastStep ? (
                <Button
                  type="button"
                  onClick={() => void next()}
                  className="h-12 rounded-full bg-ac-ink px-6 text-white hover:bg-ac-ink/90 dark:bg-white dark:text-ac-ink dark:hover:bg-white/90"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 rounded-full bg-ac-accent px-6 text-ac-ink hover:bg-ac-accent/90"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit for review
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- Aside: live preview ---------------- */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <p className="brand-kicker text-muted-foreground">Buyer preview</p>
          <ListingPreview
            coverUrl={cover?.url}
            title={(v.title ?? "").trim() || "Your listing title"}
            subtitle={[
              v.year,
              v.mileage ? `${Number(v.mileage).toLocaleString()} ${v.mileage_unit}` : "",
              v.transmission && titleCase(v.transmission),
              v.fuel_type && titleCase(v.fuel_type),
            ]
              .filter(Boolean)
              .join(" · ")}
            price={priceLabel}
            location={[v.city, countryInfo ? `${countryInfo.flag} ${countryInfo.name}` : ""]
              .filter(Boolean)
              .join(", ")}
            photoCount={photos.length}
          />
          <div className="hidden rounded-3xl border border-border bg-card p-4 lg:block">
            <p className="text-sm font-semibold">
              {localChecks.filter((c) => c.ok).length} of {localChecks.length} quality checks met
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-ac-accent transition-all"
                style={{
                  width: `${(localChecks.filter((c) => c.ok).length / localChecks.length) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Required photos: {REQUIRED_PHOTO_KINDS.length - missingPhotoKinds.length} /{" "}
              {REQUIRED_PHOTO_KINDS.length}
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

type ListingQuality = {
  readiness: "ready" | "needs_work" | "incomplete";
  warnings: string[];
  tips: string[];
};

const STEPS: WizardStep[] = [
  { id: "vin", label: "VIN quick start" },
  { id: "vehicle", label: "The car" },
  { id: "photos", label: "Photos" },
  { id: "details", label: "Specs" },
  { id: "description", label: "Description" },
  { id: "price", label: "Price & location" },
  { id: "export", label: "Export & shipping" },
  { id: "payments", label: "Payment options" },
  { id: "review", label: "Review & submit" },
];

const STEP_FIELDS: Record<string, (keyof FormValues)[]> = {
  vin: ["vin"],
  vehicle: ["make_name", "model_name", "year", "title"],
  photos: [],
  details: [
    "condition",
    "mileage",
    "mileage_unit",
    "transmission",
    "fuel_type",
    "body_type",
    "steering_side",
    "color",
    "engine_size",
  ],
  description: ["description"],
  price: ["price", "currency", "country", "city"],
  export: ["available_for_export", "shipping_info", "import_duties_note"],
  payments: [
    "pay_full",
    "pay_deposit",
    "pay_installments",
    "deposit_percent",
    "installment_months",
    "installment_interest_rate",
  ],
  review: [],
};

const BODY_TYPES = [
  "sedan",
  "suv",
  "hatchback",
  "pickup",
  "van",
  "coupe",
  "wagon",
  "convertible",
  "bus",
  "other",
] as const;

function PayOption({
  title,
  body,
  checked,
  input,
  children,
}: {
  title: string;
  body: string;
  checked: boolean;
  input: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
        checked
          ? "border-foreground ring-1 ring-foreground"
          : "border-border hover:border-foreground/40"
      }`}
    >
      {input}
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
        {children}
      </div>
    </label>
  );
}

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label className="text-sm font-semibold">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/[\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
