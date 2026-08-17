import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShoppingCart, Store, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      setRole(profile.role === "admin" ? null : profile.role);
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
      const countryName =
        COUNTRIES.find((c) => c.code === country)?.name ?? country;
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
      <div className="mx-auto flex w-full max-w-[420px] items-center px-4 py-12">
        <Card className="w-full shadow-lg">
          <CardContent className="flex items-center justify-center gap-3 p-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your profile…
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[420px] items-center px-4 py-12">
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tell us a bit about you to get started.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone (international)</Label>
              <Input
                id="phone"
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
                placeholder="+254712345678"
                value={whatsappSame ? phone : whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                disabled={whatsappSame}
              />
              <label className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
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
                  <SelectTrigger id="country">
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
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">I want to…</Label>
              <div className="grid gap-3 sm:grid-cols-2">
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
              <div className="space-y-1.5">
                <Label htmlFor="biz">Business / Dealership name (optional)</Label>
                <Input
                  id="biz"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Seller accounts require admin approval before listings go live.
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full"
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {profile?.full_name ? "Save Profile" : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
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
      className={`relative rounded-lg border p-4 text-left transition-all ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {active && (
        <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div
        className={`mb-2 grid h-9 w-9 place-items-center rounded-md ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
    </button>
  );
}
