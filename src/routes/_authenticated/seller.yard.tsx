import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Store,
  Loader2,
  ExternalLink,
  ImagePlus,
  Check,
  AlertTriangle,
  Car as CarIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import {
  EmptyPanel,
  ListSkeleton,
  Notice,
  Panel,
  StatTile,
} from "@/components/seller/SellerUI";

import { YardInventoryManager } from "@/components/yard/YardInventoryManager";

export const Route = createFileRoute("/_authenticated/seller/yard")({
  head: () => ({ meta: [{ title: "My car yard — Seller — AutoConnect" }] }),
  component: SellerYardPage,
});

type Yard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  country: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  opening_hours: string | null;
  is_approved: boolean;
  is_suspended: boolean;
  is_featured: boolean;
  rejection_reason: string | null;
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const BUCKET = "car-images";

function SellerYardPage() {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);
  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    opening_hours: "",
    logo_url: "",
    cover_url: "",
  });

  const ctx = useQuery({
    queryKey: ["seller-yard"],
    queryFn: async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u.user && !u.user.id.startsWith("demo-")) {
          const { data: seller } = await supabase
            .from("sellers")
            .select("id, business_name, country, city, is_approved")
            .eq("profile_id", u.user.id)
            .maybeSingle();
          if (seller) {
            const { data: yard } = await supabase
              .from("car_yards")
              .select("*")
              .eq("seller_id", seller.id)
              .maybeSingle();
            return { seller, yard: (yard ?? null) as Yard | null };
          }
        }
      } catch {
        // fallback
      }

      // Demo fallback for Yard Manager exploration
      return {
        seller: {
          id: "demo-seller-david",
          business_name: "Ngong Road Mega Car Hub",
          country: "KE",
          city: "Nairobi",
          is_approved: true,
        },
        yard: {
          id: "demo-yard-ngong",
          slug: "nairobi-hub",
          name: "Ngong Road Mega Car Yard",
          tagline: "Premier East African Vehicle Hub with 24 Inspection Bays",
          description:
            "Secure, paved dealership facility with full NTSA diagnostic lanes and 24/7 security.",
          logo_url: null,
          cover_url:
            "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80",
          country: "KE",
          city: "Nairobi",
          address: "Ngong Road, Junction 4, Nairobi",
          phone: "+254 722 987 654",
          whatsapp: "+254 722 987 654",
          email: "david@megayard.co.ke",
          opening_hours: "Mon-Sat: 8:00 AM - 6:30 PM",
          is_approved: true,
          is_suspended: false,
          is_featured: true,
          rejection_reason: null,
        } as Yard,
      };
    },
  });

  const yard = ctx.data?.yard ?? null;
  const seller = ctx.data?.seller ?? null;

  useEffect(() => {
    if (yard) {
      setForm({
        name: yard.name,
        tagline: yard.tagline ?? "",
        description: yard.description ?? "",
        country: yard.country,
        city: yard.city ?? "",
        address: yard.address ?? "",
        phone: yard.phone ?? "",
        whatsapp: yard.whatsapp ?? "",
        email: yard.email ?? "",
        opening_hours: yard.opening_hours ?? "",
        logo_url: yard.logo_url ?? "",
        cover_url: yard.cover_url ?? "",
      });
    } else if (seller) {
      setForm((f) => ({
        ...f,
        name: f.name || seller.business_name || "",
        country: f.country || seller.country || "",
        city: f.city || seller.city || "",
      }));
    }
  }, [yard, seller]);

  const listings = useQuery({
    queryKey: ["seller-yard-listings", seller?.id],
    enabled: Boolean(seller?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cars")
        .select("id,title,year,status,yard_id")
        .eq("seller_id", seller!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        title: string;
        year: number;
        status: string;
        yard_id: string | null;
      }[];
    },
  });

  async function uploadImage(kind: "logo" | "cover", file: File) {
    setUploading(kind);
    try {
      const { data: u } = await supabase.auth.getUser();
      const path = `yards/${u.user?.id}/${kind}-${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setForm((f) => ({
        ...f,
        [kind === "logo" ? "logo_url" : "cover_url"]: pub.publicUrl,
      }));
      toast.success(`${kind === "logo" ? "Logo" : "Cover"} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    if (!seller) {
      toast.error("Complete your seller profile first");
      return;
    }
    if (!form.name.trim() || !form.country) {
      toast.error("Yard name and country are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline || null,
        description: form.description || null,
        country: form.country,
        city: form.city || null,
        address: form.address || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        email: form.email || null,
        opening_hours: form.opening_hours || null,
        logo_url: form.logo_url || null,
        cover_url: form.cover_url || null,
      };
      if (yard) {
        const { error } = await supabase.from("car_yards").update(payload).eq("id", yard.id);
        if (error) throw error;
        toast.success("Yard updated");
      } else {
        const base = slugify(form.name) || "car-yard";
        const slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
        const { error } = await supabase
          .from("car_yards")
          .insert({ ...payload, slug, seller_id: seller.id });
        if (error) throw error;
        toast.success("Yard submitted for admin review");
      }
      await qc.invalidateQueries({ queryKey: ["seller-yard"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleListing(carId: string, attach: boolean) {
    if (!yard) return;
    const { error } = await supabase
      .from("cars")
      .update({ yard_id: attach ? yard.id : null })
      .eq("id", carId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(attach ? "Added to your yard" : "Removed from your yard");
    await qc.invalidateQueries({ queryKey: ["seller-yard-listings", seller?.id] });
  }


  if (ctx.isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6" aria-busy="true">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader eyebrow="Seller workspace" title="My car yard" />
        <EmptyPanel
          icon={<Store />}
          title="Seller profile required"
          description="Complete seller verification before opening a car yard."
          action={
            <Button asChild className="h-11 rounded-full">
              <Link to="/seller/verify">Verify account</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const allListings = listings.data ?? [];
  const inYard = yard ? allListings.filter((c) => c.yard_id === yard.id).length : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Seller workspace"
        title="My car yard"
        description="A public storefront buyers can browse — your branding, location and full inventory in one place."
        actions={
          yard ? (
            <>
              {yard.is_suspended ? (
                <Badge variant="destructive">Suspended</Badge>
              ) : yard.is_approved ? (
                <Badge className="bg-success text-white hover:bg-success">Live</Badge>
              ) : (
                <Badge variant="secondary">Waiting for review</Badge>
              )}
              {yard.is_approved && (
                <Button asChild variant="outline" className="h-11 rounded-full">
                  <Link to="/yards/$slug" params={{ slug: yard.slug }}>
                    <ExternalLink className="h-4 w-4" /> View public page
                  </Link>
                </Button>
              )}
            </>
          ) : undefined
        }
      />

      {yard?.rejection_reason && !yard.is_approved && (
        <Notice tone="danger" icon={<AlertTriangle />} title="Changes requested">
          {yard.rejection_reason}
        </Notice>
      )}

      {yard && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <StatTile
            featured
            icon={<Store />}
            label="Cars in your yard"
            value={inYard}
            sub={`of ${allListings.length} listings`}
            loading={listings.isLoading}
          />
          <StatTile
            icon={<Check />}
            tone={yard.is_approved && !yard.is_suspended ? "success" : "warning"}
            label="Storefront"
            value={yard.is_suspended ? "Paused" : yard.is_approved ? "Live" : "In review"}
            sub={yard.is_featured ? "Featured yard" : "Standard listing"}
          />
          <div className="col-span-2 lg:col-span-1">
            <StatTile
              icon={<ImagePlus />}
              label="Branding"
              value={`${[form.logo_url, form.cover_url].filter(Boolean).length}/2`}
              sub="Logo and cover photo"
            />
          </div>
        </div>
      )}

      {!yard && (
        <Notice tone="warning" icon={<Store />} title="Open your storefront">
          Fill in the profile below and press Create yard. Our team reviews it before it goes
          public.
        </Notice>
      )}

      {/* Storefront preview + branding */}
      <Panel
        kicker="Yard profile"
        title="How buyers see you"
        description="Name, tagline, cover photo and logo appear at the top of your public page."
      >
        <div className="overflow-hidden rounded-3xl border border-border">
          <div className="relative aspect-[16/10] bg-muted sm:aspect-[16/6]">
            {form.cover_url ? (
              <img src={form.cover_url} alt="Yard cover" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImagePlus className="h-8 w-8" />
                <span className="text-xs">Add a cover photo of your yard</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ac-ink/85 to-transparent p-4 text-white sm:p-6">
              <div className="flex items-end gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-white/80 bg-white/10">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Yard logo" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="font-brand truncate text-2xl leading-tight sm:text-3xl">
                    {form.name || "Your yard name"}
                  </p>
                  {form.tagline && (
                    <p className="truncate text-sm text-white/80">{form.tagline}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <ImageField
            label="Logo"
            url={form.logo_url}
            busy={uploading === "logo"}
            onFile={(f) => uploadImage("logo", f)}
          />
          <ImageField
            label="Cover photo"
            url={form.cover_url}
            busy={uploading === "cover"}
            onFile={(f) => uploadImage("cover", f)}
          />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Yard name">
            <Input
              className="h-11 rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Gift Car Yard"
            />
          </Field>
          <Field label="Tagline">
            <Input
              className="h-11 rounded-xl"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Quality foreign-used cars since 2014"
            />
          </Field>
        </div>

        <div className="mt-4">
          <Label className="text-sm font-semibold">About the yard</Label>
          <Textarea
            className="mt-1.5 rounded-2xl"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tell buyers who you are, what you specialise in, and how handover works."
          />
        </div>

        <h3 className="font-brand mt-8 text-lg">Location &amp; contact</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="City">
            <Input
              className="h-11 rounded-xl"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <Field label="Physical address">
            <Input
              className="h-11 rounded-xl"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ngong Road, opposite Prestige Plaza"
            />
          </Field>
          <Field label="Opening hours">
            <Input
              className="h-11 rounded-xl"
              value={form.opening_hours}
              onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
              placeholder="Mon–Sat 8:00–18:00"
            />
          </Field>
          <Field label="Phone">
            <Input
              className="h-11 rounded-xl"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              className="h-11 rounded-xl"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              className="h-11 rounded-xl"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end border-t border-border pt-5">
          <Button
            className="h-11 rounded-full bg-ac-accent px-6 text-ac-ink hover:bg-ac-accent/90"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {yard ? "Save changes" : "Create yard"}
          </Button>
        </div>
      </Panel>

      {yard && (
        <>
          <Panel
            kicker="Storefront"
            title="Listing storefront sync"
            description="Choose which of your listings appear on the yard public page."
          >
            {listings.isLoading ? (
              <ListSkeleton rows={3} />
            ) : allListings.length === 0 ? (
              <EmptyPanel
                icon={<CarIcon />}
                title="No listings yet"
                description="Create a listing, then add it to your yard here."
                action={
                  <Button asChild className="h-11 rounded-full">
                    <Link to="/seller/listings/new" search={{ edit: undefined }}>
                      Create one
                    </Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {allListings.map((c) => {
                  const attached = c.yard_id === yard.id;
                  return (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {c.year} {c.title}
                        </p>
                        <div className="mt-1">
                          <StatusPill status={c.status} />
                        </div>
                      </div>
                      <Button
                        variant={attached ? "secondary" : "outline"}
                        className="h-11 rounded-full"
                        onClick={() => void toggleListing(c.id, !attached)}
                      >
                        {attached ? (
                          <>
                            <Check className="h-4 w-4" /> In yard
                          </>
                        ) : (
                          "Add to yard"
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel
            kicker="Operations"
            title="Live bay allocation & inventory"
            description="Assign vehicles to physical yard bays, update inspection certifications, and issue digital gate passes."
            bodyClassName="overflow-x-auto"
          >
            <YardInventoryManager yardName={yard.name} />
          </Panel>
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ImageField({
  label,
  url,
  busy,
  onFile,
}: {
  label: string;
  url: string;
  busy: boolean;
  onFile: (f: File) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
      <span className="grid aspect-[4/3] w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
        {url ? (
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className="h-5 w-5 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{url ? "Uploaded" : "Not added yet"}</p>
      </div>
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-input px-4 text-sm font-semibold transition hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
        {busy ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…
          </>
        ) : url ? (
          "Replace"
        ) : (
          "Upload"
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
