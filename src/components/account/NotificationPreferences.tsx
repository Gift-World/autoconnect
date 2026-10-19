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
      icon: <Bell className="h-4 w-4 text-teal-400" />,
    });
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Smart Alert Preferences</h3>
            <p className="text-xs text-muted-foreground">
              Configure vehicle notifications and tracking alerts
            </p>
          </div>
        </div>
      </div>

      {/* Alert Triggers */}
      {loading ? <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading saved preferences…</div> : <><div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Alert Triggers
        </h4>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 text-teal-400 shrink-0" />
              <div>
                <Label className="text-xs font-bold text-foreground">Saved Search Matches</Label>
                <p className="text-[11px] text-muted-foreground">
                  Get notified when a new vehicle matches your criteria
                </p>
              </div>
            </div>
            <Switch checked={savedSearchAlerts} onCheckedChange={setSavedSearchAlerts} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <Label className="text-xs font-bold text-foreground">Price Drop Alerts</Label>
                <p className="text-[11px] text-muted-foreground">
                  Instant notification when a favorited car reduces in price
                </p>
              </div>
            </div>
            <Switch checked={priceDropAlerts} onCheckedChange={setPriceDropAlerts} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3">
              <Ship className="h-4 w-4 text-blue-400 shrink-0" />
              <div>
                <Label className="text-xs font-bold text-foreground">
                  Japan Import Shipping Stage Updates
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Vessel loading, Indian Ocean transit, and Mombasa clearance
                </p>
              </div>
            </div>
            <Switch checked={importUpdates} onCheckedChange={setImportUpdates} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl border border-border/80 bg-muted/20">
            <div className="flex items-center gap-3">
              <Lock className="h-4 w-4 text-amber-400 shrink-0" />
              <div>
                <Label className="text-xs font-bold text-foreground">
                  Transaction & Title Milestones
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Saved now; sent only after payment and NTSA services are connected
                </p>
              </div>
            </div>
            <Switch checked={escrowMilestones} onCheckedChange={setEscrowMilestones} />
          </div>
        </div>
      </div>

      {/* Notification Delivery Channels */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Delivery Channels
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3.5 rounded-2xl border border-teal-500/40 bg-teal-500/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5" /> In-App Bell
              </span>
              <Badge className="bg-teal-500 text-slate-950 font-bold text-[9px]">Active</Badge>
            </div>
            <p className="text-[10px] text-slate-300">Instant header badge notification</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1.5 opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> Email Digest
              </span>
              <Badge variant="outline" className="text-[9px]">
                Provider required
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Requires an email delivery provider before it can be enabled.</p>
          </div>

          <div className="p-3.5 rounded-2xl border border-border bg-muted/20 space-y-1.5 opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Smartphone className="h-3.5 w-3.5" /> WhatsApp Bot
              </span>
              <Badge variant="outline" className="text-[9px]">
                Provider required
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Requires an approved WhatsApp Business provider before it can be enabled.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={saving}
          className="h-11 px-6 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {saving ? "Saving…" : "Save Alert Preferences"}
        </Button>
      </div>
      </>}
    </form>
  );
}
