import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
import { MessageCircle, ShieldCheck, UserRound } from "lucide-react";

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
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
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="app-surface p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">Personal details</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
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
                      <Input {...field} />
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
                        <Input placeholder="+1 555 123 4567" {...field} />
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
                        <Input placeholder="+1 555 123 4567" {...field} />
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
                          <SelectTrigger>
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end border-t border-border pt-5">
                <Button type="submit" disabled={mutation.isPending} size="lg">
                  {mutation.isPending ? "Saving…" : "Save profile changes"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="app-surface overflow-hidden bg-gradient-to-br from-teal-50 to-white p-5">
            <p className="text-[10px] font-bold tracking-[0.18em] text-teal-700">YOUR CONTACTS</p>
            <h2 className="mt-2 text-lg font-bold tracking-tight">
              Small details keep your ownership journey moving.
            </h2>
            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  <strong className="font-semibold text-foreground">WhatsApp is optional.</strong>
                  <br />
                  Add it if you want sellers and service providers to have a convenient reply
                  channel.
                </p>
              </div>
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>
                  <strong className="font-semibold text-foreground">
                    Your account stays yours.
                  </strong>
                  <br />
                  Changing these details never changes a completed purchase or service record.
                </p>
              </div>
            </div>
          </div>
          <div className="app-surface p-5">
            <p className="text-sm font-semibold">Why we ask for location</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              It helps tailor vehicle availability, delivery conversations and service-provider
              options. We do not publish your full address.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
