import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
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
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-[420px] items-center px-4 py-12">
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-foreground text-background">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            Staff access only. Use your admin email and password.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
