import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { ShieldCheck, Clock, XCircle, Upload, Check, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/seller/verify")({
  head: () => ({ meta: [{ title: "Verify seller — AutoConnect" }] }),
  component: SellerVerifyPage,
});

type SV = {
  id: string;
  seller_id: string;
  is_dealer: boolean;
  national_id_number: string | null;
  national_id_front_url: string | null;
  national_id_back_url: string | null;
  selfie_with_id_url: string | null;
  address_county: string | null;
  address_town: string | null;
  address_street: string | null;
  business_name: string | null;
  business_reg_number: string | null;
  incorporation_cert_url: string | null;
  kra_pin_url: string | null;
  business_permit_url: string | null;
  premises_photo_url: string | null;
  status: string;
  admin_notes: string | null;
  identity_rejection_reason: string | null;
};

const BUCKET = "seller-identity-docs";

function SellerVerifyPage() {
  const { user, loading: authLoading } = useAuth();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);

  const sellerQ = useQuery({
    queryKey: ["my-seller", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sellers")
        .select("id, is_dealer, is_verified, is_approved, business_name, phone, email")
        .eq("profile_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const profileQ = useQuery({
    queryKey: ["my-profile-basic", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, country, city, role")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  async function createSellerProfile() {
    if (!user || !profileQ.data) return;
    if (!profileQ.data.country || !profileQ.data.city) {
      toast.error("Add country and city on your profile first");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("sellers").upsert(
      {
        profile_id: user.id,
        country: profileQ.data.country,
        city: profileQ.data.city,
        location_display: `${profileQ.data.city}, ${profileQ.data.country}`,
        phone: profileQ.data.phone ?? null,
      },
      { onConflict: "profile_id" },
    );
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Seller profile created");
    qc.invalidateQueries({ queryKey: ["my-seller", user.id] });
  }

  const vQ = useQuery({
    queryKey: ["my-seller-verification", sellerQ.data?.id],
    enabled: !!sellerQ.data?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_verifications")
        .select("*")
        .eq("seller_id", sellerQ.data!.id)
        .maybeSingle();
      if (error) throw error;
      return data as SV | null;
    },
  });

  const [accountType, setAccountType] = useState<"private" | "dealer">("private");
  const [form, setForm] = useState<Partial<SV>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vQ.data) {
      setAccountType(vQ.data.is_dealer ? "dealer" : "private");
      setForm(vQ.data);
    } else if (sellerQ.data) {
      setAccountType(sellerQ.data.is_dealer ? "dealer" : "private");
      setForm({ business_name: sellerQ.data.business_name });
    }
  }, [vQ.data, sellerQ.data]);

  if (authLoading || !user || sellerQ.isLoading || profileQ.isLoading) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Loading your seller profile…</p>
      </div>
    );
  }

  if (!sellerQ.data) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center space-y-3">
        <h2 className="text-lg font-semibold">Create your seller profile</h2>
        <p className="text-sm text-muted-foreground">
          {profileQ.data?.country && profileQ.data?.city
            ? "We have your basic details — set up your seller profile in one click."
            : "Finish the quick setup (name, phone, country) to unlock seller verification and listings."}
        </p>
        {profileQ.data?.country && profileQ.data?.city ? (
          <Button onClick={createSellerProfile} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create seller profile
          </Button>
        ) : (
          <Button asChild>
            <Link to="/complete-profile">Complete profile</Link>
          </Button>
        )}
      </div>
    );
  }

  const status = vQ.data?.status ?? "not_started";
  const readOnly = status === "under_review" || status === "verified" || status === "pending";

  async function submit() {
    if (!user || !sellerQ.data) return;
    // Basic validation
    const req: (keyof SV)[] =
      accountType === "private"
        ? ["national_id_number", "national_id_front_url", "address_county", "address_town"]
        : ["business_name", "business_reg_number", "national_id_number", "national_id_front_url"];
    for (const k of req) {
      if (!form[k]) {
        toast.error(`Missing: ${k.replace(/_/g, " ")}`);
        return;
      }
    }
    setSaving(true);
    const payload = {
      seller_id: sellerQ.data.id,
      is_dealer: accountType === "dealer",
      national_id_number: form.national_id_number ?? null,
      national_id_front_url: form.national_id_front_url ?? null,
      national_id_back_url: form.national_id_back_url ?? null,
      selfie_with_id_url: form.selfie_with_id_url ?? null,
      address_county: form.address_county ?? null,
      address_town: form.address_town ?? null,
      address_street: form.address_street ?? null,
      business_name: form.business_name ?? null,
      business_reg_number: form.business_reg_number ?? null,
      incorporation_cert_url: form.incorporation_cert_url ?? null,
      kra_pin_url: form.kra_pin_url ?? null,
      business_permit_url: form.business_permit_url ?? null,
      premises_photo_url: form.premises_photo_url ?? null,
      status: "pending",
    };
    const { error } = await supabase
      .from("seller_verifications")
      .upsert(payload, { onConflict: "seller_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review");
    qc.invalidateQueries({ queryKey: ["my-seller-verification", sellerQ.data.id] });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Seller verification</h1>
        <p className="text-sm text-muted-foreground">
          Verify to earn a trust badge on all your listings. Documents remain private.
        </p>
      </header>

      <StatusBanner status={status} notes={vQ.data?.identity_rejection_reason ?? vQ.data?.admin_notes ?? null} />

      <Tabs value={accountType} onValueChange={(v) => !readOnly && setAccountType(v as "private" | "dealer")}>
        <TabsList>
          <TabsTrigger value="private" disabled={readOnly && accountType !== "private"}>Private seller</TabsTrigger>
          <TabsTrigger value="dealer" disabled={readOnly && accountType !== "dealer"}>Dealership</TabsTrigger>
        </TabsList>

        <TabsContent value="private" className="mt-4 space-y-4">
          <Section title="Identity">
            <TextField label="ID / passport number" value={form.national_id_number ?? ""} onChange={(v) => setForm({ ...form, national_id_number: v })} disabled={readOnly} />
            <FileField label="ID front photo" bucket={BUCKET} userId={user!.id} value={form.national_id_front_url ?? null} onChange={(v) => setForm({ ...form, national_id_front_url: v })} disabled={readOnly} />
            <FileField label="ID back photo (optional)" bucket={BUCKET} userId={user!.id} value={form.national_id_back_url ?? null} onChange={(v) => setForm({ ...form, national_id_back_url: v })} disabled={readOnly} />
            <FileField label="Selfie holding your ID (optional)" bucket={BUCKET} userId={user!.id} value={form.selfie_with_id_url ?? null} onChange={(v) => setForm({ ...form, selfie_with_id_url: v })} disabled={readOnly} />
          </Section>
          <Section title="Address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="County / region" value={form.address_county ?? ""} onChange={(v) => setForm({ ...form, address_county: v })} disabled={readOnly} />
              <TextField label="Town / city" value={form.address_town ?? ""} onChange={(v) => setForm({ ...form, address_town: v })} disabled={readOnly} />
            </div>
            <TextField label="Street / estate (optional)" value={form.address_street ?? ""} onChange={(v) => setForm({ ...form, address_street: v })} disabled={readOnly} />
          </Section>
        </TabsContent>

        <TabsContent value="dealer" className="mt-4 space-y-4">
          <Section title="Business">
            <TextField label="Business name" value={form.business_name ?? ""} onChange={(v) => setForm({ ...form, business_name: v })} disabled={readOnly} />
            <TextField label="Registration / KRA PIN" value={form.business_reg_number ?? ""} onChange={(v) => setForm({ ...form, business_reg_number: v })} disabled={readOnly} />
            <FileField label="Certificate of incorporation (optional)" bucket={BUCKET} userId={user!.id} value={form.incorporation_cert_url ?? null} onChange={(v) => setForm({ ...form, incorporation_cert_url: v })} disabled={readOnly} />
            <FileField label="KRA PIN certificate (optional)" bucket={BUCKET} userId={user!.id} value={form.kra_pin_url ?? null} onChange={(v) => setForm({ ...form, kra_pin_url: v })} disabled={readOnly} />
            <FileField label="Business permit (optional)" bucket={BUCKET} userId={user!.id} value={form.business_permit_url ?? null} onChange={(v) => setForm({ ...form, business_permit_url: v })} disabled={readOnly} />
            <FileField label="Premises photo (optional)" bucket={BUCKET} userId={user!.id} value={form.premises_photo_url ?? null} onChange={(v) => setForm({ ...form, premises_photo_url: v })} disabled={readOnly} />
          </Section>
          <Section title="Owner / director ID">
            <TextField label="Owner ID / passport number" value={form.national_id_number ?? ""} onChange={(v) => setForm({ ...form, national_id_number: v })} disabled={readOnly} />
            <FileField label="Owner ID photo" bucket={BUCKET} userId={user!.id} value={form.national_id_front_url ?? null} onChange={(v) => setForm({ ...form, national_id_front_url: v })} disabled={readOnly} />
          </Section>
          <Section title="Address">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="County / region" value={form.address_county ?? ""} onChange={(v) => setForm({ ...form, address_county: v })} disabled={readOnly} />
              <TextField label="Town / city" value={form.address_town ?? ""} onChange={(v) => setForm({ ...form, address_town: v })} disabled={readOnly} />
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      {!readOnly && (
        <div className="flex justify-end">
          <Button size="lg" onClick={submit} disabled={saving}>
            {saving ? "Submitting…" : status === "rejected" || status === "more_info_needed" ? "Resubmit" : "Submit for review"}
          </Button>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function TextField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}

function FileField({ label, bucket, userId, value, onChange, disabled }: { label: string; bucket: string; userId: string; value: string | null; onChange: (path: string | null) => void; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    if (file.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    setBusy(false);
    if (error) return toast.error(error.message);
    onChange(path);
    toast.success("Uploaded");
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          ref={ref}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => ref.current?.click()} disabled={disabled || busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
          {value ? "Replace" : "Upload"}
        </Button>
        {value && (
          <span className="inline-flex items-center gap-1 text-xs text-success">
            <Check className="h-3.5 w-3.5" /> Uploaded
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBanner({ status, notes }: { status: string; notes: string | null }) {
  if (status === "verified")
    return (
      <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
        <ShieldCheck className="h-5 w-5 text-success" />
        <div>
          <div className="font-medium">Verified</div>
          <div className="text-sm text-muted-foreground">Your trust badge is live on all your listings.</div>
        </div>
      </div>
    );
  if (status === "pending" || status === "under_review")
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">Under review</div>
          <div className="text-sm text-muted-foreground">We'll notify you when review is complete.</div>
        </div>
      </div>
    );
  if (status === "rejected" || status === "more_info_needed")
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <XCircle className="h-5 w-5 text-destructive" />
        <div>
          <div className="font-medium">{status === "rejected" ? "Not approved" : "More info needed"}</div>
          {notes && <div className="text-sm text-muted-foreground">{notes}</div>}
        </div>
      </div>
    );
  return null;
}
