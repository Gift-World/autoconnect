import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Clock, XCircle, CheckCircle2, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ErrorNotice,
} from "@/components/account/DashboardKit";
import { primaryButton } from "@/components/account/dashboard-utils";
import { cn } from "@/lib/utils";

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
        .select(
          "full_name, phone, id_type, id_number, payment_contact, kyc_status, kyc_notes, kyc_submitted_at, kyc_reviewed_at",
        )
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
    if (
      !form.full_name.trim() ||
      !form.phone.trim() ||
      !form.id_number.trim() ||
      !form.payment_contact.trim()
    ) {
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
  const stepIndex = status === "approved" ? 2 : status === "submitted" ? 1 : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Trust & safety"
        title="Verify your identity"
        description="Required before you can reserve a car or pay. Your documents stay private."
      />

      {q.isLoading ? (
        <Skeleton className="h-36 w-full rounded-[28px]" />
      ) : (
        <StatusCard
          status={status}
          notes={q.data?.kyc_notes ?? null}
          submittedAt={q.data?.kyc_submitted_at ?? null}
          reviewedAt={q.data?.kyc_reviewed_at ?? null}
        />
      )}

      {q.isError && <ErrorNotice onRetry={() => void q.refetch()} />}

      {/* Three-step progress */}
      <ol className="grid grid-cols-3 gap-2" aria-label="Verification progress">
        {["Your details", "AutoConnect review", "Verified buyer"].map((label, i) => {
          const reached = i <= stepIndex;
          return (
            <li key={label} className="min-w-0">
              <div className={cn("h-1.5 rounded-full", reached ? "bg-ac-accent" : "bg-muted")} />
              <p
                className={cn(
                  "mt-2 truncate text-xs font-semibold",
                  reached ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {String(i + 1).padStart(2, "0")} · {label}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="space-y-4 rounded-3xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <Lock className="h-4 w-4 text-ac-accent" />
          <h2 className="text-base font-bold">Your details</h2>
          {readOnly && (
            <span className="ml-auto rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              Locked while {status === "approved" ? "verified" : "under review"}
            </span>
          )}
        </div>
        <Field label="Full name (as on ID)">
          <Input
            className="h-11"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            disabled={readOnly}
          />
        </Field>
        <Field label="Phone number">
          <Input
            className="h-11"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+254…"
            disabled={readOnly}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="ID type">
            <Select
              value={form.id_type}
              onValueChange={(v) => setForm({ ...form, id_type: v as "national_id" | "passport" })}
              disabled={readOnly}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="national_id">National ID</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="ID / passport number">
            <Input
              className="h-11"
              value={form.id_number}
              onChange={(e) => setForm({ ...form, id_number: e.target.value })}
              disabled={readOnly}
            />
          </Field>
        </div>
        <Field label="Payment contact (M-Pesa number or bank name)">
          <Input
            className="h-11"
            value={form.payment_contact}
            onChange={(e) => setForm({ ...form, payment_contact: e.target.value })}
            disabled={readOnly}
          />
        </Field>

        {!readOnly && (
          <div className="flex justify-end border-t border-border pt-4">
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className={`${primaryButton} w-full sm:w-auto`}
            >
              {saving ? "Submitting…" : status === "rejected" ? "Resubmit" : "Submit for review"}
            </button>
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

function StatusCard({
  status,
  notes,
  submittedAt,
  reviewedAt,
}: {
  status: string;
  notes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}) {
  const shell = "flex items-start gap-4 rounded-[28px] p-5 sm:p-7";
  const iconBox = "grid h-12 w-12 shrink-0 place-items-center rounded-2xl";
  if (status === "approved")
    return (
      <div className={cn(shell, "border border-emerald-500/30 bg-emerald-500/10")}>
        <span className={cn(iconBox, "bg-emerald-600 text-white")}>
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <p className="brand-kicker text-emerald-700 dark:text-emerald-400">Status</p>
          <div className="font-brand mt-1.5 text-2xl">Verified buyer</div>
          <div className="mt-1 text-sm text-muted-foreground">
            You can reserve cars and complete payments.
          </div>
          {reviewedAt && (
            <div className="mt-1 text-xs text-muted-foreground">
              Approved {new Date(reviewedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    );
  if (status === "submitted")
    return (
      <div className={cn(shell, "bg-ac-cream text-ac-ink")}>
        <span className={cn(iconBox, "bg-ac-ink text-ac-accent")}>
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="brand-kicker text-ac-ink/60">Status</p>
          <div className="font-brand mt-1.5 text-2xl">Under review</div>
          <div className="mt-1 text-sm text-ac-ink/70">Usually within 24 hours.</div>
          {submittedAt && (
            <div className="mt-1 text-xs text-ac-ink/60">
              Submitted {new Date(submittedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    );
  if (status === "rejected")
    return (
      <div className={cn(shell, "border border-destructive/40 bg-destructive/5")}>
        <span className={cn(iconBox, "bg-destructive text-white")}>
          <XCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="brand-kicker text-destructive">Status</p>
          <div className="font-brand mt-1.5 text-2xl">Not approved</div>
          {notes && <div className="mt-1 text-sm text-foreground">Reason: {notes}</div>}
          <div className="mt-1 text-sm text-muted-foreground">
            Please update your details and resubmit.
          </div>
        </div>
      </div>
    );
  return (
    <div className={cn(shell, "bg-ac-ink text-white")}>
      <span className={cn(iconBox, "bg-ac-accent text-ac-ink")}>
        <CheckCircle2 className="h-5 w-5" />
      </span>
      <div>
        <p className="brand-kicker text-ac-accent">Next step</p>
        <div className="font-brand mt-1.5 text-2xl">Not started</div>
        <div className="mt-1 text-sm text-white/70">Complete KYC to reserve cars and pay.</div>
      </div>
    </div>
  );
}
