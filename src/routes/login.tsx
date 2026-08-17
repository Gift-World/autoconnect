import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";
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
    toast.success("Welcome back!");
    void navigate({
      to: roleHomePath(role as "admin" | "seller" | "buyer"),
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-[420px] items-center px-4 py-12">
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Globe className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to your AutoConnect account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
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
