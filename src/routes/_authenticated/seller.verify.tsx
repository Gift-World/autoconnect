import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ShieldCheck,
  Clock,
  XCircle,
  Upload,
  Check,
  Loader2,
  Building2,
  FileCheck2,
  LockKeyhole,
  UserRound,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/PageHeader";

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
    <div className="mx-auto max-w-[1180px] space-y-6">
      <PageHeader
        eyebrow="SELLER TRUST CENTRE"
        title="Verify your selling profile"
        description="Give buyers confidence in who they are dealing with. Your documents are private and reviewed only by AutoConnect."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-5">
          <StatusBanner
            status={status}
            notes={vQ.data?.identity_rejection_reason ?? vQ.data?.admin_notes ?? null}
          />

          <Tabs
            value={accountType}
            onValueChange={(v) => !readOnly && setAccountType(v as "private" | "dealer")}
            className="app-surface p-4 sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Choose your seller type</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  We only ask for the documents needed to review this profile.
                </p>
              </div>
              <TabsList>
                <TabsTrigger
                  value="private"
                  disabled={readOnly && accountType !== "private"}
                  className="gap-2"
                >
                  <UserRound className="h-3.5 w-3.5" /> Private seller
                </TabsTrigger>
                <TabsTrigger
                  value="dealer"
                  disabled={readOnly && accountType !== "dealer"}
                  className="gap-2"
                >
                  <Building2 className="h-3.5 w-3.5" /> Dealership
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="private" className="mt-4 space-y-4">
              <Section title="Identity">
                <TextField
                  label="ID / passport number"
                  value={form.national_id_number ?? ""}
                  onChange={(v) => setForm({ ...form, national_id_number: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="ID front photo"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.national_id_front_url ?? null}
                  onChange={(v) => setForm({ ...form, national_id_front_url: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="ID back photo (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.national_id_back_url ?? null}
                  onChange={(v) => setForm({ ...form, national_id_back_url: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="Selfie holding your ID (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.selfie_with_id_url ?? null}
                  onChange={(v) => setForm({ ...form, selfie_with_id_url: v })}
                  disabled={readOnly}
                />
              </Section>
              <Section title="Address">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="County / region"
                    value={form.address_county ?? ""}
                    onChange={(v) => setForm({ ...form, address_county: v })}
                    disabled={readOnly}
                  />
                  <TextField
                    label="Town / city"
                    value={form.address_town ?? ""}
                    onChange={(v) => setForm({ ...form, address_town: v })}
                    disabled={readOnly}
                  />
                </div>
                <TextField
                  label="Street / estate (optional)"
                  value={form.address_street ?? ""}
                  onChange={(v) => setForm({ ...form, address_street: v })}
                  disabled={readOnly}
                />
              </Section>
            </TabsContent>

            <TabsContent value="dealer" className="mt-4 space-y-4">
              <Section title="Business">
                <TextField
                  label="Business name"
                  value={form.business_name ?? ""}
                  onChange={(v) => setForm({ ...form, business_name: v })}
                  disabled={readOnly}
                />
                <TextField
                  label="Registration / KRA PIN"
                  value={form.business_reg_number ?? ""}
                  onChange={(v) => setForm({ ...form, business_reg_number: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="Certificate of incorporation (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.incorporation_cert_url ?? null}
                  onChange={(v) => setForm({ ...form, incorporation_cert_url: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="KRA PIN certificate (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.kra_pin_url ?? null}
                  onChange={(v) => setForm({ ...form, kra_pin_url: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="Business permit (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.business_permit_url ?? null}
                  onChange={(v) => setForm({ ...form, business_permit_url: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="Premises photo (optional)"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.premises_photo_url ?? null}
                  onChange={(v) => setForm({ ...form, premises_photo_url: v })}
                  disabled={readOnly}
                />
              </Section>
              <Section title="Owner / director ID">
                <TextField
                  label="Owner ID / passport number"
                  value={form.national_id_number ?? ""}
                  onChange={(v) => setForm({ ...form, national_id_number: v })}
                  disabled={readOnly}
                />
                <FileField
                  label="Owner ID photo"
                  bucket={BUCKET}
                  userId={user!.id}
                  value={form.national_id_front_url ?? null}
                  onChange={(v) => setForm({ ...form, national_id_front_url: v })}
                  disabled={readOnly}
                />
              </Section>
              <Section title="Address">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="County / region"
                    value={form.address_county ?? ""}
                    onChange={(v) => setForm({ ...form, address_county: v })}
                    disabled={readOnly}
                  />
                  <TextField
                    label="Town / city"
                    value={form.address_town ?? ""}
                    onChange={(v) => setForm({ ...form, address_town: v })}
                    disabled={readOnly}
                  />
                </div>
              </Section>
            </TabsContent>
            {!readOnly && (
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-muted-foreground">
                  By submitting, you confirm these documents are accurate and belong to you or your
                  business.
                </p>
                <Button size="lg" onClick={submit} disabled={saving} className="shrink-0">
                  {saving
                    ? "Submitting…"
                    : status === "rejected" || status === "more_info_needed"
                      ? "Resubmit for review"
                      : "Submit for review"}
                </Button>
              </div>
            )}
          </Tabs>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-[24px] bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
            <p className="text-[10px] font-bold tracking-[0.18em] text-teal-300">
              WHAT HAPPENS NEXT
            </p>
            <h2 className="mt-2 text-lg font-bold tracking-tight">
              A clear path to a trusted profile.
            </h2>
            <ol className="mt-5 space-y-4 text-sm">
              {[
                ["1", "Share your details", "Tell us whether you sell privately or as a business."],
                [
                  "2",
                  "Secure review",
                  "Our team checks your submission before any badge is shown.",
                ],
                ["3", "Badge on listings", "Once verified, buyers can see your verified status."],
              ].map(([number, title, copy]) => (
                <li key={number} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-400/15 text-xs font-bold text-teal-200">
                    {number}
                  </span>
                  <span>
                    <strong className="block font-semibold text-white">{title}</strong>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-300">
                      {copy}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="app-surface p-5">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <LockKeyhole className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Private by design</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  ID numbers, files and internal review notes are never displayed on your public
                  listings.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/70 bg-muted/20 p-4 shadow-none sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
          <FileCheck2 className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}

function FileField({
  label,
  bucket,
  userId,
  value,
  onChange,
  disabled,
}: {
  label: string;
  bucket: string;
  userId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  disabled?: boolean;
}) {
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => ref.current?.click()}
          disabled={disabled || busy}
        >
          {busy ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-1 h-4 w-4" />
          )}
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
      <div className="flex items-start gap-3 rounded-2xl border border-success/40 bg-success/5 p-4">
        <ShieldCheck className="h-5 w-5 text-success" />
        <div>
          <div className="font-medium">Verified</div>
          <div className="text-sm text-muted-foreground">
            Your trust badge is live on all your listings.
          </div>
        </div>
      </div>
    );
  if (status === "pending" || status === "under_review")
    return (
      <div className="flex items-start gap-3 rounded-2xl border bg-muted/40 p-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">Under review</div>
          <div className="text-sm text-muted-foreground">
            We'll notify you when review is complete.
          </div>
        </div>
      </div>
    );
  if (status === "rejected" || status === "more_info_needed")
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
        <XCircle className="h-5 w-5 text-destructive" />
        <div>
          <div className="font-medium">
            {status === "rejected" ? "Not approved" : "More info needed"}
          </div>
          {notes && <div className="text-sm text-muted-foreground">{notes}</div>}
        </div>
      </div>
    );
  return null;
}
