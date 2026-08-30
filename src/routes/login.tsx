import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2, Eye, EyeOff, Mail, Smartphone } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { roleHomePath } from "@/contexts/AuthContext";
import { QuickDemoLogin } from "@/components/QuickDemoLogin";
import { PhoneAuthForm } from "@/components/auth/PhoneAuthForm";

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
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-[480px] flex-col gap-6 px-4 py-12">
      <QuickDemoLogin />

      <Card className="w-full shadow-lg border-border rounded-3xl">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Globe className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your vehicle inquiries and escrow orders
          </p>

          {/* Auth Method Switcher Tabs */}
          <div className="pt-2 flex items-center p-1 bg-muted/80 rounded-2xl border border-border">
            <button
              type="button"
              onClick={() => setAuthMethod("email")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMethod === "email"
                  ? "bg-card text-foreground shadow-sm font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Sign in with Email</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("phone")}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                authMethod === "phone"
                  ? "bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Sign in with Phone</span>
            </button>
          </div>
        </CardHeader>

        <CardContent>
          {authMethod === "email" ? (
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
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/support" className="text-xs text-primary hover:underline">
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
                    className="h-11 rounded-xl pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={submitting} className="w-full h-11 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in with Email
              </Button>
            </form>
          ) : (
            <PhoneAuthForm mode="login" />
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New to AutoConnect?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            <Link to="/admin/login" className="hover:underline">
              Admin login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
