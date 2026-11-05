import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { PageHeader } from "@/components/layout/PageHeader";
import { Bell, Check, Circle, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import {
  ShortcutLink,
} from "@/components/account/DashboardKit";
import { primaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/account/")({
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().min(2, "Required"),
  phone: z.string().optional(),
  whatsapp_number: z.string().optional(),
  country: z.string().min(2, "Select your country"),
  city: z.string().optional(),
});
type Values = z.infer<typeof schema>;

function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      phone: "",
      whatsapp_number: "",
      country: "",
      city: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        whatsapp_number: profile.whatsapp_number ?? "",
        country: profile.country ?? "",
        city: profile.city ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const mutation = useMutation({
    mutationFn: async (values: Values) => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          phone: values.phone || null,
          whatsapp_number: values.whatsapp_number || null,
          country: values.country,
          city: values.city || null,
        })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refreshProfile();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const watched = form.watch();
  const checklist = [
    { key: "full_name", label: "Full name", done: (watched.full_name ?? "").trim().length >= 2 },
    { key: "phone", label: "Phone", done: !!watched.phone?.trim() },
    { key: "whatsapp_number", label: "WhatsApp", done: !!watched.whatsapp_number?.trim() },
    { key: "country", label: "Country", done: !!watched.country },
    { key: "city", label: "City", done: !!watched.city?.trim() },
  ];
  const missing = checklist.filter((c) => !c.done);
  const percent = Math.round(((checklist.length - missing.length) / checklist.length) * 100);

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading your profile">
        <Skeleton className="h-28 w-full rounded-[28px]" />
        <Skeleton className="h-28 w-full rounded-3xl" />
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ACCOUNT SETTINGS"
        title="Your AutoConnect profile"
        description="Keep your contact details current so conversations, bookings and account updates reach the right person."
      />

      {/* What matters now: how complete the profile is */}
      <section className="rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className="grid h-16 w-16 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(var(--color-ac-accent) ${percent * 3.6}deg, var(--border) 0deg)`,
              }}
              aria-hidden
            >
              <span className="font-brand grid h-12 w-12 place-items-center rounded-full bg-card text-base">
                {percent}%
              </span>
            </div>
            <div className="min-w-0">
              <p className="brand-kicker text-muted-foreground">Profile strength</p>
              <h2 className="font-brand mt-1.5 text-2xl">
                {missing.length === 0
                  ? "Your profile is complete"
                  : `${missing.length} detail${missing.length === 1 ? "" : "s"} left`}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {missing.length === 0
                  ? "Sellers and service providers can reach you without delays."
                  : `Add ${missing.map((m) => m.label.toLowerCase()).join(", ")} below, then save.`}
              </p>
            </div>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Profile checklist">
            {checklist.map((c) => (
              <li
                key={c.key}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  c.done
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border-border bg-muted text-muted-foreground"
                }`}
              >
                {c.done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ac-ink text-ac-accent">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="font-brand text-xl">Personal details</h2>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:inline">Active mode</span>
              <RoleSwitcher />
            </div>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input className="h-11" placeholder="+1 555 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsapp_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp</FormLabel>
                      <FormControl>
                        <Input className="h-11" placeholder="+1 555 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.flag} {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input className="h-11" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end border-t border-border pt-5">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className={`${primaryButton} w-full sm:w-auto`}
                >
                  {mutation.isPending ? "Saving…" : "Save profile changes"}
                </button>
              </div>
            </form>
          </Form>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-ac-cream p-5 text-ac-ink">
            <p className="brand-kicker text-ac-ink/60">Your contacts</p>
            <h2 className="font-brand mt-2 text-xl">
              Small details keep your ownership journey moving.
            </h2>
            <div className="mt-5 space-y-4 text-sm text-ac-ink/75">
              <div className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-ac-ink" />
                <p>
                  <strong className="font-semibold text-ac-ink">WhatsApp is optional.</strong>
                  <br />
                  Add it if you want sellers and service providers to have a convenient reply
                  channel.
                </p>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ac-ink" />
                <p>
                  <strong className="font-semibold text-ac-ink">Your account stays yours.</strong>
                  <br />
                  Changing these details never changes a completed purchase or service record.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-card p-5">
            <p className="text-sm font-bold">Why we ask for location</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              It helps tailor vehicle availability, delivery conversations and service-provider
              options. We do not publish your full address.
            </p>
          </div>
          <div className="space-y-2">
            <ShortcutLink
              to="/account/verify"
              icon={<ShieldCheck />}
              title="Verify identity"
              description="Needed before you reserve or pay"
            />
            <ShortcutLink
              to="/account/notifications"
              icon={<Bell />}
              title="Notifications"
              description="Alerts and delivery preferences"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
