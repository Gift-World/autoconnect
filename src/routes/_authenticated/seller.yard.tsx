import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Store, Loader2, ExternalLink, ImagePlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { COUNTRIES } from "@/lib/countries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        seller: { id: "demo-seller-david", business_name: "Ngong Road Mega Car Hub", country: "KE", city: "Nairobi", is_approved: true },
        yard: {
          id: "demo-yard-ngong",
          slug: "nairobi-hub",
          name: "Ngong Road Mega Car Yard",
          tagline: "Premier East African Vehicle Hub with 24 Inspection Bays",
          description: "Secure, paved dealership facility with full NTSA diagnostic lanes and 24/7 security.",
          logo_url: null,
          cover_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&auto=format&fit=crop&q=80",
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
        const { error } = await supabase
          .from("car_yards")
          .update(payload)
          .eq("id", yard.id);
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
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!seller) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-semibold">Seller profile required</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete seller verification before opening a car yard.
        </p>
        <Button asChild className="mt-5">
          <Link to="/seller/verify">Verify account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Store className="h-5 w-5" /> My car yard
          </h1>
          <p className="text-sm text-muted-foreground">
            A public storefront buyers can browse — your branding, location and
            full inventory in one place.
          </p>
        </div>
        {yard && (
          <div className="flex items-center gap-2">
            {yard.is_suspended ? (
              <Badge variant="destructive">Suspended</Badge>
            ) : yard.is_approved ? (
              <Badge className="bg-success text-white hover:bg-success">Live</Badge>
            ) : (
              <Badge variant="secondary">Waiting for review</Badge>
            )}
            {yard.is_approved && (
              <Button asChild variant="outline" size="sm">
                <Link to="/yards/$slug" params={{ slug: yard.slug }}>
                  <ExternalLink className="mr-1.5 h-4 w-4" /> View public page
                </Link>
              </Button>
            )}
          </div>
        )}
      </header>

      {yard?.rejection_reason && !yard.is_approved && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <span className="font-medium">Changes requested: </span>
          {yard.rejection_reason}
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Yard profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Yard name">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Gift Car Yard"
            />
          </Field>
          <Field label="Tagline">
            <Input
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="Quality foreign-used cars since 2014"
            />
          </Field>
          <Field label="Country">
            <Select
              value={form.country}
              onValueChange={(v) => setForm({ ...form, country: v })}
            >
              <SelectTrigger>
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
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </Field>
          <Field label="Physical address">
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ngong Road, opposite Prestige Plaza"
            />
          </Field>
          <Field label="Opening hours">
            <Input
              value={form.opening_hours}
              onChange={(e) => setForm({ ...form, opening_hours: e.target.value })}
              placeholder="Mon–Sat 8:00–18:00"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Label className="text-sm">About the yard</Label>
          <Textarea
            className="mt-1.5"
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tell buyers who you are, what you specialise in, and how handover works."
          />
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

        <Button className="mt-6" onClick={() => void save()} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {yard ? "Save changes" : "Create yard"}
        </Button>
      </section>

      {yard && (
        <>
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Live Bay Allocation & Inventory Operations</h2>
              <p className="text-sm text-muted-foreground">
                Assign vehicles to physical yard bays, update inspection certifications, and issue digital gate passes.
              </p>
            </div>
            <YardInventoryManager yardName={yard.name} />
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold">Listing Storefront Sync</h2>
            <p className="text-sm text-muted-foreground">
              Choose which of your listings appear on the yard public page.
            </p>
            <div className="mt-4 divide-y divide-border">
            {(listings.data ?? []).length === 0 && (
              <p className="py-4 text-sm text-muted-foreground">
                No listings yet.{" "}
                <Link to="/seller/listings/new" className="underline">
                  Create one
                </Link>
                .
              </p>
            )}
            {(listings.data ?? []).map((c) => {
              const attached = c.yard_id === yard.id;
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {c.year} {c.title}
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {c.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant={attached ? "secondary" : "outline"}
                    onClick={() => void toggleListing(c.id, !attached)}
                  >
                    {attached ? (
                      <>
                        <Check className="mr-1.5 h-4 w-4" /> In yard
                      </>
                    ) : (
                      "Add to yard"
                    )}
                  </Button>
                </div>
              );
            })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
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
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5 flex items-center gap-3">
        <span className="grid h-16 w-24 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
          {url ? (
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <label className="cursor-pointer rounded-md border border-input px-3 py-2 text-sm hover:bg-muted">
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
