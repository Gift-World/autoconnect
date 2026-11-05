import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { roleHomePath } from "@/contexts/AuthContext";
import { QuickDemoLogin } from "@/components/QuickDemoLogin";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";
import {
  AuthDivider,
  AuthShell,
  authPrimaryButton,
  authSecondaryButton,
} from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — AutoConnect" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error || !data.user) {
      setSubmitting(false);
      toast.error(error?.message ?? "Login failed");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();
    const role = (profile as { role?: string } | null)?.role;
    setSubmitting(false);
    toast.success("Welcome back!");
    void navigate({
      to: roleHomePath(role as "admin" | "seller" | "buyer"),
    });
  };

  return (
    <AuthShell
      kicker="Log in"
      title="Welcome back."
      subtitle="Sign in to manage your vehicle inquiries and escrow orders."
      image="/images/hero-driving-sedan.jpg"
      imageAlt="A sedan driving on an open road at dusk"
      asideKicker="AutoConnect"
      asideTitle={
        <>
          Pick up right <span className="text-ac-accent">where you left off.</span>
        </>
      }
      asidePoints={["Saved cars and vehicle inquiries", "Escrow orders and payment milestones"]}
      below={
        <>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to AutoConnect?{" "}
            <Link to="/register" className="font-bold text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link
              to="/admin/login"
              className="inline-flex min-h-11 items-center px-2 underline-offset-4 hover:underline"
            >
              Admin login
            </Link>
          </p>
          <div className="mt-6">
            <QuickDemoLogin />
          </div>
        </>
      }
    >
      {authMethod === "email" ? (
        <>
          <form onSubmit={onSubmit} className="space-y-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="h-12 rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/support"
                  className="-my-3 inline-flex min-h-11 items-center text-xs font-semibold text-foreground underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl pr-12"
                  required
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
            </div>
            <Button type="submit" disabled={submitting} className={authPrimaryButton}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in with Email
            </Button>
          </form>
          <AuthDivider />
          <button type="button" onClick={() => setAuthMethod("phone")} className={authSecondaryButton}>
            <Smartphone className="h-4 w-4" />
            Sign in with Phone
          </button>
        </>
      ) : (
        <>
          <PhoneAuthForm mode="login" />
          <AuthDivider />
          <button type="button" onClick={() => setAuthMethod("email")} className={authSecondaryButton}>
            <Mail className="h-4 w-4" />
            Sign in with Email
          </button>
        </>
      )}
    </AuthShell>
  );
}
