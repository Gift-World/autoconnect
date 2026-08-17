import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Clock, XCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/verify")({
  head: () => ({ meta: [{ title: "Verify identity — AutoConnect" }] }),
  component: BuyerVerifyPage,
});

function BuyerVerifyPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    id_type: "national_id" as "national_id" | "passport",
    id_number: "",
    payment_contact: "",
  });

  const q = useQuery({
    queryKey: ["buyer-kyc", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, id_type, id_number, payment_contact, kyc_status, kyc_notes, kyc_submitted_at, kyc_reviewed_at")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (q.data) {
      setForm({
        full_name: q.data.full_name ?? "",
        phone: q.data.phone ?? "",
        id_type: (q.data.id_type as "national_id" | "passport") ?? "national_id",
        id_number: q.data.id_number ?? "",
        payment_contact: q.data.payment_contact ?? "",
      });
    }
  }, [q.data]);

  const status = q.data?.kyc_status ?? "none";

  async function submit() {
    if (!user) return;
    if (!form.full_name.trim() || !form.phone.trim() || !form.id_number.trim() || !form.payment_contact.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        id_type: form.id_type,
        id_number: form.id_number.trim(),
        payment_contact: form.payment_contact.trim(),
        kyc_status: "submitted",
        kyc_submitted_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted for review");
    qc.invalidateQueries({ queryKey: ["buyer-kyc", user.id] });
  }

  const readOnly = status === "submitted" || status === "approved";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Verify your identity</h1>
        <p className="text-sm text-muted-foreground">
          Required before you can reserve a car or pay. Your documents stay private.
        </p>
      </header>

      <StatusCard status={status} notes={q.data?.kyc_notes ?? null} />

      <div className="rounded-lg border bg-card p-5 shadow-sm space-y-4">
        <Field label="Full name (as on ID)">
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} disabled={readOnly} />
        </Field>
        <Field label="Phone number">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+254…" disabled={readOnly} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ID type">
            <Select value={form.id_type} onValueChange={(v) => setForm({ ...form, id_type: v as "national_id" | "passport" })} disabled={readOnly}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="ID / passport number">
            <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} disabled={readOnly} />
          </Field>
        </div>
        <Field label="Payment contact (M-Pesa number or bank name)">
          <Input value={form.payment_contact} onChange={(e) => setForm({ ...form, payment_contact: e.target.value })} disabled={readOnly} />
        </Field>

        {!readOnly && (
          <div className="flex justify-end pt-2">
            <Button onClick={submit} disabled={saving}>
              {saving ? "Submitting…" : status === "rejected" ? "Resubmit" : "Submit for review"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function StatusCard({ status, notes }: { status: string; notes: string | null }) {
  if (status === "approved")
    return (
      <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/5 p-4">
        <ShieldCheck className="h-5 w-5 text-success" />
        <div>
          <div className="font-medium">Verified buyer</div>
          <div className="text-sm text-muted-foreground">You can reserve cars and complete payments.</div>
        </div>
      </div>
    );
  if (status === "submitted")
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="font-medium">Under review</div>
          <div className="text-sm text-muted-foreground">Usually within 24 hours.</div>
        </div>
      </div>
    );
  if (status === "rejected")
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <XCircle className="h-5 w-5 text-destructive" />
        <div>
          <div className="font-medium">Not approved</div>
          {notes && <div className="text-sm text-muted-foreground">Reason: {notes}</div>}
          <div className="text-sm text-muted-foreground">Please update your details and resubmit.</div>
        </div>
      </div>
    );
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
      <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
      <div>
        <div className="font-medium">Not started</div>
        <div className="text-sm text-muted-foreground">Complete KYC to reserve cars and pay.</div>
      </div>
    </div>
  );
}
