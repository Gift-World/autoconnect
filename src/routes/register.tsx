import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2, ShoppingCart, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use full international format e.g. +254712345678"),
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
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: { full_name: values.full_name },
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
      const countryName =
        COUNTRIES.find((c) => c.code === values.country)?.name ?? values.country;
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
    <div className="mx-auto flex max-w-xl items-center px-4 py-12">
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Globe className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Just an email and password — no confirmation needed.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="mb-2 block">I want to…</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" {...register("full_name")} />
              {errors.full_name && (
                <p className="text-xs text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone (international)</Label>
                <Input id="phone" placeholder="+254712345678" {...register("phone")} />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={country}
                  onValueChange={(v) => setValue("country", v, { shouldValidate: true })}
                >
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
                {errors.country && (
                  <p className="text-xs text-destructive">{errors.country.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>

            {role === "seller" && (
              <div className="space-y-1.5">
                <Label htmlFor="business_name">Business / Dealership name (optional)</Label>
                <Input id="business_name" {...register("business_name")} />
                <p className="text-xs text-muted-foreground">
                  Seller accounts require admin approval before listings go live.
                </p>
              </div>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
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
      className={`rounded-lg border p-3 text-left transition-all ${
        active
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div
        className={`mb-2 grid h-8 w-8 place-items-center rounded-md ${
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
    </button>
  );
}
