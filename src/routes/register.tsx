import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Store, Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import {
  AuthDivider,
  AuthShell,
  authPrimaryButton,
  authSecondaryButton,
} from "@/components/auth/AuthShell";
import { Checkbox } from "@/components/ui/checkbox";
import { recordConsent, TERMS_VERSION } from "@/lib/consent";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, "Use full international format e.g. +254712345678"),
  country: z.string().min(2, "Select your country"),
  city: z.string().trim().min(2, "Enter your city"),
  role: z.enum(["buyer", "seller"]),
  business_name: z.string().trim().max(120).optional(),
});

type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — AutoConnect" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "buyer", country: "" },
  });

  const role = watch("role");
  const country = watch("country");

  const onSubmit = async (values: FormValues) => {
    if (!acceptedTerms) {
      toast.error("Please agree to the Terms and Privacy Notice before continuing.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: values.full_name, terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() },
      },
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    const userId = data.user?.id;
    if (!userId) {
      setSubmitting(false);
      toast.error("Could not create account. Please try again.");
      return;
    }

    // If "Confirm email" is OFF in Supabase, we get a session immediately and
    // can write profile/seller rows under the new user's RLS. Otherwise we
    // can't write yet — tell the user to confirm first.
    if (!data.session) {
      setSubmitting(false);
      toast.success("Account created. Check your email to confirm, then log in.");
      void navigate({ to: "/login" });
      return;
    }

    await Promise.all([recordConsent("terms"), recordConsent("privacy")]);

    // Update auto-created profile with the rest of the details
    const { error: profErr } = await supabase
      .from("profiles")
      .update({
        full_name: values.full_name,
        phone: values.phone,
        whatsapp_number: values.phone,
        country: values.country,
        city: values.city,
        role: values.role,
      })
      .eq("id", userId);
    if (profErr) console.error("[register] profile update", profErr);

    if (values.role === "seller") {
      const countryName = COUNTRIES.find((c) => c.code === values.country)?.name ?? values.country;
      const { error: sellerErr } = await supabase.from("sellers").upsert(
        {
          profile_id: userId,
          business_name: values.business_name?.trim() || null,
          country: values.country,
          city: values.city,
          location_display: `${values.city}, ${countryName}`,
          is_approved: false,
        },
        { onConflict: "profile_id" },
      );
      if (sellerErr) console.error("[register] seller insert", sellerErr);
    }

    setSubmitting(false);
    toast.success("Account created!");
    void navigate({ to: values.role === "seller" ? "/seller" : "/cars" });
  };

  return (
    <AuthShell
      kicker="Sign up"
      title="Create your account."
      subtitle="Create your account to start buying or selling."
      image="/images/hero-driving-suv.jpg"
      imageAlt="An SUV driving along a scenic road"
      asideKicker="Join AutoConnect"
      asideTitle={
        <>
          Buy or sell with <span className="text-ac-accent">the evidence in view.</span>
        </>
      }
      asidePoints={[
        "Buyers: save favorites, send inquiries, request imports.",
        "Sellers: list cars after admin approval.",
      ]}
      below={
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-foreground underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      }
    >
      {authMethod === "phone" ? (
        <>
          <PhoneAuthForm mode="register" defaultRole="buyer" />
          <AuthDivider />
          <button type="button" onClick={() => setAuthMethod("email")} className={authSecondaryButton}>
            <Mail className="h-4 w-4" />
            Register with Email
          </button>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">I want to…</legend>
              <div className="grid grid-cols-2 gap-2">
                <RoleCard
                  active={role === "buyer"}
                  onClick={() => setValue("role", "buyer", { shouldValidate: true })}
                  icon={<ShoppingCart className="h-5 w-5" />}
                  title="Buy a car"
                  subtitle="Save favorites, send inquiries, request imports."
                />
                <RoleCard
                  active={role === "seller"}
                  onClick={() => setValue("role", "seller", { shouldValidate: true })}
                  icon={<Store className="h-5 w-5" />}
                  title="Sell / Export"
                  subtitle="List cars after admin approval."
                />
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                autoComplete="name"
                className="h-12 rounded-xl"
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-xl"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="h-12 rounded-xl pr-12"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (international)</Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+254712345678"
                  className="h-12 rounded-xl"
                  {...register("phone")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={country}
                  onValueChange={(v) => setValue("country", v, { shouldValidate: true })}
                >
                  <SelectTrigger id="country" className="h-12 rounded-xl">
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
                {errors.country && (
                  <p className="text-xs text-destructive">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                autoComplete="address-level2"
                className="h-12 rounded-xl"
                {...register("city")}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            {role === "seller" && (
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business / Dealership name (optional)</Label>
                <Input id="business_name" className="h-12 rounded-xl" {...register("business_name")} />
                <p className="text-xs text-muted-foreground">
                  Seller accounts require admin approval before listings go live.
                </p>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5 h-5 w-5"
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-snug text-muted-foreground">
                I agree to the AutoConnect{" "}
                <Link to="/terms" className="font-semibold text-foreground underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="font-semibold text-foreground underline underline-offset-2">
                  Privacy Policy
                </Link>{" "}
                (version {TERMS_VERSION}).
              </Label>
            </div>

            <Button type="submit" disabled={submitting || !acceptedTerms} className={authPrimaryButton}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account with Email
            </Button>
          </form>
          <AuthDivider />
          <button type="button" onClick={() => setAuthMethod("phone")} className={authSecondaryButton}>
            <Smartphone className="h-4 w-4" />
            Register with Phone
          </button>
        </>
      )}
    </AuthShell>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border p-3 text-left transition-all sm:p-4 ${
        active
          ? "border-foreground bg-muted/60 ring-1 ring-foreground"
          : "border-border hover:border-foreground/40"
      }`}
    >
      <div
        className={`mb-2 grid h-9 w-9 place-items-center rounded-xl ${
          active ? "bg-ac-accent text-ac-ink" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}
