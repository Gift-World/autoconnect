import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Store, Check, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { primaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/complete-profile")({
  head: () => ({ meta: [{ title: "Complete your profile — AutoConnect" }] }),
  component: CompleteProfilePage,
});

function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsapp, setWhatsapp] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState<"buyer" | "seller" | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const hydratedFromProfile = useRef(false);

  useEffect(() => {
    if (!profile) return;

    if (!hydratedFromProfile.current) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setWhatsapp(profile.whatsapp_number ?? "");
      setWhatsappSame(!profile.whatsapp_number || profile.whatsapp_number === profile.phone);
      setCountry(profile.country ?? "");
      setCity(profile.city ?? "");
      setRole(profile.role === "buyer" || profile.role === "seller" ? profile.role : null);
      hydratedFromProfile.current = true;
    }
  }, [profile, navigate]);

  const finalWhatsapp = whatsappSame ? phone : whatsapp;

  const canSubmit =
    fullName.trim().length >= 2 &&
    /^\+[1-9]\d{6,14}$/.test(phone) &&
    country &&
    city.trim().length >= 2 &&
    role !== null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!canSubmit) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSubmitting(true);

    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone,
        whatsapp_number: finalWhatsapp || null,
        country,
        city: city.trim(),
        role,
      })
      .eq("id", user.id);

    if (profErr) {
      setSubmitting(false);
      toast.error(profErr.message);
      return;
    }

    if (role === "seller") {
      const countryName = COUNTRIES.find((c) => c.code === country)?.name ?? country;
      const { error: sellerErr } = await supabase.from("sellers").upsert(
        {
          profile_id: user.id,
          business_name: businessName.trim() || null,
          country,
          city: city.trim(),
          location_display: `${city.trim()}, ${countryName}`,
        },
        { onConflict: "profile_id" },
      );
      if (sellerErr) {
        setSubmitting(false);
        toast.error(sellerErr.message);
        return;
      }
    }

    await refreshProfile();
    setSubmitting(false);
    toast.success("Profile complete!");
    void navigate({ to: role === "seller" ? "/seller" : "/cars" });
  };

  if (authLoading || !user) {
    return (
      <div className="mx-auto flex w-full max-w-[520px] items-center px-4 py-12">
        <div className="w-full rounded-[28px] border border-border bg-card">
          <div className="flex items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your profile…
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    fullName.trim().length >= 2,
    /^\+[1-9]\d{6,14}$/.test(phone),
    !!country && city.trim().length >= 2,
    role !== null,
  ];
  const doneSteps = steps.filter(Boolean).length;

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-8 sm:py-12">
      <div className="overflow-hidden rounded-[28px] border border-border bg-card sm:rounded-[36px]">
        <div className="relative overflow-hidden bg-ac-ink p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-ac-accent/25 blur-3xl" />
          <p className="brand-kicker relative text-ac-accent">Welcome to AutoConnect</p>
          <h1 className="font-brand relative mt-3 text-3xl sm:text-4xl">Complete your profile</h1>
          <p className="relative mt-2 text-sm text-white/70">Tell us a bit about you to get started.</p>
          <div className="relative mt-5 grid grid-cols-4 gap-1.5" aria-label={`${doneSteps} of 4 done`}>
            {steps.map((done, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-colors ${done ? "bg-ac-accent" : "bg-white/15"}`}
              />
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                className="h-11"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (international)</Label>
              <Input
                id="phone"
                className="h-11"
                placeholder="+254712345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp (optional)</Label>
              <Input
                id="whatsapp"
                className="h-11"
                placeholder="+254712345678"
                value={whatsappSame ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={whatsappSame}
              />
              <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={whatsappSame}
                  onCheckedChange={(v) => setWhatsappSame(Boolean(v))}
                />
                Same as phone
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger id="country" className="h-11">
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  className="h-11"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">I want to…</Label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  active={role === "buyer"}
                  onClick={() => setRole("buyer")}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  title="Buy a car"
                />
                <RoleCard
                  active={role === "seller"}
                  onClick={() => setRole("seller")}
                  icon={<Store className="h-5 w-5" />}
                  title="Sell a car"
                />
              </div>
            </div>

            {role === "seller" && (
              <div className="space-y-1.5 rounded-2xl bg-muted/50 p-4">
                <Label htmlFor="biz">Business / Dealership name (optional)</Label>
                <Input
                  id="biz"
                  className="h-11 bg-background"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Seller accounts require admin approval before listings go live.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className={`${primaryButton} h-12 w-full`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {profile?.full_name ? "Save Profile" : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative min-h-[96px] rounded-2xl border p-4 text-left transition ${
        active
          ? "border-ac-accent bg-ac-accent/10 ring-2 ring-ac-accent/25"
          : "border-border bg-card hover:border-ac-accent/50"
      }`}
    >
      {active && (
        <span className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-ac-accent text-ac-ink">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div
        className={`mb-2 grid h-10 w-10 place-items-center rounded-xl ${
          active ? "bg-ac-ink text-ac-accent" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold">{title}</p>
    </button>
  );
}
