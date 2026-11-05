import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { QuickDemoLogin } from "@/components/QuickDemoLogin";
import { AuthShell, authPrimaryButton } from "@/components/auth/AuthShell";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password is required"),
});

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login — AutoConnect" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (role !== "admin") {
      await supabase.auth.signOut();
      toast.error("This account is not an admin.");
      return;
    }
    toast.success("Welcome, admin.");
    void navigate({ to: "/admin" });
  };

  return (
    <AuthShell
      kicker="Staff only"
      title="Standard Admin Login"
      subtitle="Staff access only. Use your admin email and password."
      image="/images/hero-driving-crossover.jpg"
      imageAlt="A crossover driving on a highway"
      asideKicker="AutoConnect admin"
      asideTitle={
        <>
          Moderation, verification <span className="text-ac-accent">and disputes.</span>
        </>
      }
      asidePoints={["Escrow approvals", "Dealer KYC verification", "Dispute console"]}
      below={
        <>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not staff?{" "}
            <Link to="/login" className="font-bold text-foreground underline-offset-4 hover:underline">
              Go to the regular log in
            </Link>
          </p>
          <div className="mt-6">
            <QuickDemoLogin
              title="1-Click Admin & Dev Access"
              subtitle="Select Sarah Kimani (Super Admin) for immediate access to admin moderation."
            />
          </div>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ac-ink text-white">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="text-sm font-semibold text-foreground">Admin sign in</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="admin-email">Email</Label>
          <Input
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-password">Password</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl"
            required
          />
        </div>
        <Button type="submit" disabled={submitting} className={authPrimaryButton}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
