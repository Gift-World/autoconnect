import React, { useEffect, useState } from "react";
import {
  Bell,
  Mail,
  Smartphone,
  Check,
  TrendingDown,
  Ship,
  Lock,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // In-app switches
  const [savedSearchAlerts, setSavedSearchAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [importUpdates, setImportUpdates] = useState(true);
  const [escrowMilestones, setEscrowMilestones] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("saved_search_alerts,price_drop_alerts,import_updates,transaction_milestones,in_app_enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) {
        toast.error("Could not load your alert preferences.");
      } else if (data) {
        setSavedSearchAlerts(data.saved_search_alerts);
        setPriceDropAlerts(data.price_drop_alerts);
        setImportUpdates(data.import_updates);
        setEscrowMilestones(data.transaction_milestones);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Sign in to save alert preferences.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      saved_search_alerts: savedSearchAlerts,
      price_drop_alerts: priceDropAlerts,
      import_updates: importUpdates,
      transaction_milestones: escrowMilestones,
      in_app_enabled: true,
      email_enabled: false,
      whatsapp_enabled: false,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      toast.error("Could not save your alert preferences.", { description: error.message });
      return;
    }
    toast.success("Notification Preferences Saved", {
      description: "Your in-app alert choices are now saved to your account.",
      icon: <Bell className="h-4 w-4 text-ac-accent" />,
    });
  };

  const triggers = [
    {
      key: "saved",
      icon: <Search className="h-4 w-4" />,
      title: "Saved Search Matches",
      body: "Get notified when a new vehicle matches your criteria",
      checked: savedSearchAlerts,
      onChange: setSavedSearchAlerts,
    },
    {
      key: "price",
      icon: <TrendingDown className="h-4 w-4" />,
      title: "Price Drop Alerts",
      body: "Instant notification when a favorited car reduces in price",
      checked: priceDropAlerts,
      onChange: setPriceDropAlerts,
    },
    {
      key: "import",
      icon: <Ship className="h-4 w-4" />,
      title: "Japan Import Shipping Stage Updates",
      body: "Vessel loading, Indian Ocean transit, and Mombasa clearance",
      checked: importUpdates,
      onChange: setImportUpdates,
    },
    {
      key: "escrow",
      icon: <Lock className="h-4 w-4" />,
      title: "Transaction & Title Milestones",
      body: "Saved now; sent only after payment and NTSA services are connected",
      checked: escrowMilestones,
      onChange: setEscrowMilestones,
    },
  ];

  return (
    <form
      onSubmit={handleSave}
      className="space-y-6 rounded-3xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-ac-ink text-ac-accent">
          <Bell className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-foreground">Smart Alert Preferences</h3>
          <p className="text-xs text-muted-foreground">
            Configure vehicle notifications and tracking alerts
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved preferences…
        </div>
      ) : (
        <>
          {/* Alert Triggers */}
          <div className="space-y-3">
            <h4 className="brand-kicker text-muted-foreground">Alert Triggers</h4>
            <div className="space-y-2.5">
              {triggers.map((t) => (
                <div
                  key={t.key}
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 p-3 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-card text-ac-accent">
                      {t.icon}
                    </span>
                    <div className="min-w-0">
                      <Label htmlFor={`pref-${t.key}`} className="text-sm font-bold text-foreground">
                        {t.title}
                      </Label>
                      <p className="text-xs text-muted-foreground">{t.body}</p>
                    </div>
                  </div>
                  <Switch id={`pref-${t.key}`} checked={t.checked} onCheckedChange={t.onChange} />
                </div>
              ))}
            </div>
          </div>

          {/* Notification Delivery Channels */}
          <div className="space-y-3 pt-2">
            <h4 className="brand-kicker text-muted-foreground">Delivery Channels</h4>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="space-y-1.5 rounded-2xl border border-ac-accent/50 bg-ac-accent/10 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                    <Bell className="h-3.5 w-3.5 text-ac-accent" /> In-App Bell
                  </span>
                  <Badge className="bg-ac-accent text-[10px] font-bold text-ac-ink hover:bg-ac-accent">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Instant header badge notification</p>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> Email Digest
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Provider required
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires an email delivery provider before it can be enabled.
                </p>
              </div>

              <div className="space-y-1.5 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                    <Smartphone className="h-3.5 w-3.5" /> WhatsApp Bot
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    Provider required
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires an approved WhatsApp Business provider before it can be enabled.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="h-11 w-full gap-2 rounded-full bg-ac-ink px-6 font-bold text-white hover:bg-ac-ink-soft sm:w-auto dark:bg-white dark:text-ac-ink dark:hover:bg-white/90"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{" "}
              {saving ? "Saving…" : "Save Alert Preferences"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
