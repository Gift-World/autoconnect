import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft } from "lucide-react";
import { aiGenerateDescription } from "@/lib/ai.functions";
import { COUNTRIES, CURRENCIES } from "@/lib/countries";
import {
  getAllMakes,
  getModelsForMake,
  decodeVin,
  normalizeBody,
  normalizeFuel,
  normalizeTransmission,
  type NhtsaMake,
  type NhtsaModel,
} from "@/lib/nhtsa";
import {
  GuidedPhotoUploader,
  type UploadedPhoto,
} from "@/components/seller/GuidedPhotoUploader";
import { REQUIRED_PHOTO_KINDS, PHOTO_LABELS } from "@/lib/listing-checklist";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/seller/listings/new")({
  component: NewListing,
});

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  make_name: z.string().trim().min(1, "Make is required"),
  model_name: z.string().trim().min(1, "Model is required"),
  year: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().min(3).max(3),
  country: z.string().length(2, "Country is required"),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  mileage: z.coerce.number().int().min(0).optional(),
  mileage_unit: z.enum(["km", "miles"]),
  transmission: z.enum(["automatic", "manual", "semi-automatic"]).optional().or(z.literal("")),
  fuel_type: z.enum(["petrol", "diesel", "electric", "hybrid", "other"]).optional().or(z.literal("")),
  body_type: z
    .enum(["sedan", "suv", "hatchback", "pickup", "van", "coupe", "wagon", "convertible", "bus", "other"])
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
}).refine((v) => v.pay_full || v.pay_deposit || v.pay_installments, {
  message: "Enable at least one payment option",
  path: ["pay_full"],
});

type FormValues = z.infer<typeof schema>;

function NewListing() {
  const navigate = useNavigate();
  const [makes, setMakes] = useState<NhtsaMake[]>([]);
  const [models, setModels] = useState<NhtsaModel[]>([]);
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
      }
      try {
        setMakes(await getAllMakes());
      } catch (e) {
        console.error(e);
      }
    })();
  }, [setValue]);

  // Load models when make changes
  useEffect(() => {
    if (!watchMake) {
      setModels([]);
      return;
    }
    setLoadingModels(true);
    getModelsForMake(watchMake)
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
      if (decoded.displacementL)
        setValue("engine_size", `${decoded.displacementL}L`);
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
    if (photos.length === 0) {
      toast.error("Add at least one photo");
      return;
    }
    const missing = REQUIRED_PHOTO_KINDS.filter(
      (k) => !photos.some((p) => p.kind === k),
    );
    if (missing.length > 0) {
      toast.error(
        `Missing required photos: ${missing.map((k) => PHOTO_LABELS[k]).join(", ")}`,
      );
      return;
    }
    setSubmitting(true);
    try {
      const primary = photos.find((p) => p.isPrimary) ?? photos[0];
      const insertPayload = {
        seller_id: sellerId,
        title: values.title,
        make_name: values.make_name,
        model_name: values.model_name,
        year: values.year,
        price: values.price,
        currency: values.currency,
        country: values.country,
        city: values.city || null,
        location_display: values.city
          ? `${values.city}, ${values.country}`
          : values.country,
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
        shipping_info: values.available_for_export
          ? values.shipping_info || null
          : null,
        import_duties_note: values.available_for_export
          ? values.import_duties_note || null
          : null,
        vin: values.vin || null,
        api_source: values.vin ? "nhtsa_vpic" : null,
        status: "pending" as const,
        yard_id: yardId,
        pay_full: values.pay_full,
        pay_deposit: values.pay_deposit,
        pay_installments: values.pay_installments,
        deposit_percent: values.pay_deposit ? values.deposit_percent ?? 20 : null,
        installment_months: values.pay_installments ? values.installment_months ?? 12 : null,
        installment_interest_rate: values.pay_installments ? values.installment_interest_rate ?? 0 : null,
        installment_monthly: values.pay_installments
          ? Math.round(monthlyPreview * 100) / 100
          : null,
      };

      const { data: car, error: carErr } = await supabase
        .from("cars")
        .insert(insertPayload)
        .select("id")
        .single();
      if (carErr) throw carErr;

      const imageRows = photos.map((p, idx) => ({
        car_id: car.id,
        image_url: p.url,
        is_primary: p.path === primary.path,
        sort_order: idx,
        photo_kind: p.kind === "extra" ? null : p.kind,
      }));
      const { error: imgErr } = await supabase
        .from("car_images")
        .insert(imageRows);
      if (imgErr) throw imgErr;

      toast.success("Listing submitted for review");
      navigate({ to: "/seller" });
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to create listing",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const years = useMemo(() => {
    const now = new Date().getFullYear() + 1;
    return Array.from({ length: now - 1950 + 1 }, (_, i) => now - i);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/seller">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New listing</h1>
            <p className="text-sm text-muted-foreground">
              Listings are reviewed before they appear in the public marketplace.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* VIN decoder */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick start — VIN decode (optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="17-character VIN (e.g. 1HGCM82633A004352)"
                maxLength={17}
                {...register("vin")}
                className="font-mono uppercase"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleDecodeVin}
                disabled={decodingVin}
              >
                {decodingVin ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Decode VIN
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Powered by NHTSA vPIC — free, no API key. Best results for US-market vehicles.
            </p>
          </CardContent>
        </Card>

        {/* Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vehicle details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Listing title" error={errors.title?.message} className="md:col-span-2">
              <Input
                placeholder="e.g. 2018 Toyota Land Cruiser V8 — Low Mileage"
                {...register("title")}
              />
            </Field>

            <Field label="Make" error={errors.make_name?.message}>
              <Select
                value={watch("make_name")}
                onValueChange={(v) => {
                  setValue("make_name", v);
                  setValue("model_name", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {makes.map((m) => (
                    <SelectItem key={m.Make_ID} value={m.Make_Name}>
                      {titleCase(m.Make_Name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Model" error={errors.model_name?.message}>
              <Select
                value={watch("model_name")}
                onValueChange={(v) => setValue("model_name", v)}
                disabled={!watchMake || loadingModels}
              >
                <SelectTrigger>
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
                    <SelectItem key={m.Model_ID} value={m.Model_Name}>
                      {m.Model_Name}
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
                className="mt-2"
                placeholder="Or type model manually"
                {...register("model_name")}
              />
            </Field>

            <Field label="Year" error={errors.year?.message}>
              <Select
                value={String(watch("year"))}
                onValueChange={(v) => setValue("year", Number(v))}
              >
                <SelectTrigger>
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

            <Field label="Condition" error={errors.condition?.message}>
              <Select
                value={watch("condition")}
                onValueChange={(v) => setValue("condition", v as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="foreign-used">Foreign used</SelectItem>
                  <SelectItem value="locally-used">Locally used</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Body type">
              <Select
                value={watch("body_type") || ""}
                onValueChange={(v) => setValue("body_type", v as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {["sedan","suv","hatchback","pickup","van","coupe","wagon","convertible","bus","other"].map((b) => (
                    <SelectItem key={b} value={b}>{titleCase(b)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Transmission">
              <Select
                value={watch("transmission") || ""}
                onValueChange={(v) => setValue("transmission", v as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="semi-automatic">Semi-automatic</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Fuel type">
              <Select
                value={watch("fuel_type") || ""}
                onValueChange={(v) => setValue("fuel_type", v as never)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Color">
              <Input placeholder="e.g. Pearl White" {...register("color")} />
            </Field>

            <Field label="Engine size">
              <Input placeholder="e.g. 2.0L, 4.6L V8" {...register("engine_size")} />
            </Field>

            <Field label="Steering side" error={errors.steering_side?.message}>
              <Select
                value={watch("steering_side")}
                onValueChange={(v) => setValue("steering_side", v as never)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left-hand drive (LHD)</SelectItem>
                  <SelectItem value="right">Right-hand drive (RHD)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Mileage" error={errors.mileage?.message}>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register("mileage")}
                />
                <Select
                  value={watch("mileage_unit")}
                  onValueChange={(v) => setValue("mileage_unit", v as never)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="miles">miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Field>
          </CardContent>
        </Card>

        {/* Price & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price &amp; location</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Price" error={errors.price?.message} className="md:col-span-2">
              <Input
                type="number"
                min={0}
                step="any"
                placeholder="25000"
                {...register("price")}
              />
            </Field>
            <Field label="Currency" error={errors.currency?.message}>
              <Select
                value={watch("currency")}
                onValueChange={(v) => setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Country" error={errors.country?.message} className="md:col-span-2">
              <Select
                value={watch("country")}
                onValueChange={(v) => setValue("country", v)}
              >
                <SelectTrigger>
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
            <Field label="City">
              <Input placeholder="e.g. Nairobi" {...register("city")} />
            </Field>
          </CardContent>
        </Card>

        {/* Export & shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Export &amp; shipping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <Label htmlFor="exp" className="font-medium">
                  Available for international export
                </Label>
                <p className="text-xs text-muted-foreground">
                  Buyers from any country can request a shipping quote.
                </p>
              </div>
              <Switch
                id="exp"
                checked={watchExport}
                onCheckedChange={(v) => setValue("available_for_export", v)}
              />
            </div>
            {watchExport && (
              <div className="grid gap-4">
                <Field label="Shipping info / supported ports">
                  <Textarea
                    rows={3}
                    placeholder="e.g. RoRo or container from Mombasa to Lagos, Dar, Apapa…"
                    {...register("shipping_info")}
                  />
                </Field>
                <Field label="Import duties / paperwork note">
                  <Textarea
                    rows={3}
                    placeholder="e.g. Buyer is responsible for destination duties. We provide bill of lading + export certificate."
                    {...register("import_duties_note")}
                  />
                </Field>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Choose how buyers may pay for this car. Pick at least one.
            </p>
            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-lg border p-3">
                <input type="checkbox" className="mt-1" {...register("pay_full")} />
                <div>
                  <div className="text-sm font-medium">Full payment</div>
                  <div className="text-xs text-muted-foreground">Buyer pays the full price up front through escrow.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3">
                <input type="checkbox" className="mt-1" {...register("pay_deposit")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">Deposit / reservation</div>
                  <div className="text-xs text-muted-foreground">Buyer pays a deposit to reserve; balance settled later.</div>
                  {watchDeposit && (
                    <div className="mt-2 flex items-center gap-2">
                      <Label className="text-xs">Deposit %</Label>
                      <Input type="number" min={1} max={100} className="h-8 w-24" {...register("deposit_percent")} />
                    </div>
                  )}
                </div>
              </label>
              <label className="flex items-start gap-3 rounded-lg border p-3">
                <input type="checkbox" className="mt-1" {...register("pay_installments")} />
                <div className="flex-1">
                  <div className="text-sm font-medium">Monthly installments</div>
                  <div className="text-xs text-muted-foreground">Buyer pays over time. You set the term & rate.</div>
                  {watchInstall && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Months</Label>
                        <Input type="number" min={1} max={120} className="h-8 w-24" {...register("installment_months")} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Interest %/yr</Label>
                        <Input type="number" min={0} max={100} step="0.1" className="h-8 w-24" {...register("installment_interest_rate")} />
                      </div>
                      {monthlyPreview > 0 && (
                        <p className="sm:col-span-2 text-xs text-muted-foreground">
                          Estimated monthly ≈ <span className="font-semibold text-foreground">{monthlyPreview.toFixed(2)} {watch("currency")}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
            {errors.pay_full && (
              <p className="text-xs text-destructive">{errors.pay_full.message as string}</p>
            )}
            {!watchFull && !watchDeposit && !watchInstall && (
              <p className="text-xs text-destructive">Enable at least one option</p>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Description</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={genDesc}
                onClick={async () => {
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
                }}
              >
                {genDesc ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5 text-accent" />
                )}
                Generate with AI
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={6}
              placeholder="Service history, accessories, why you're selling, etc. — or click Generate with AI."
              {...register("description")}
            />
          </CardContent>
        </Card>

        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            {userId ? (
              <GuidedPhotoUploader
                userId={userId}
                value={photos}
                onChange={setPhotos}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/seller">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for review
          </Button>
        </div>
      </form>
    </div>
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
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-sm">{label}</Label>
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
