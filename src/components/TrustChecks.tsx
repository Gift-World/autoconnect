import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ShieldCheck,
  FileCheck2,
  BadgeCheck,
  Wrench,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  AlertCircle,
} from "lucide-react";

type State = "checked" | "pending" | "rejected" | "more_info" | "not_started";

interface CheckItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  state: State;
  hint: string;
}

interface Props {
  carId: string;
  carFlags: {
    documents_verified: boolean;
    ntsa_verified: boolean;
    inspection_verified: boolean;
  };
  sellerVerified: boolean;
}

const STATE_STYLE: Record<State, string> = {
  checked: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  more_info: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  not_started: "border-border bg-muted/40 text-muted-foreground",
};

const STATE_LABEL: Record<State, string> = {
  checked: "Checked",
  pending: "Pending review",
  rejected: "Rejected",
  more_info: "Needs more info",
  not_started: "Not started",
};

function StateIcon({ state }: { state: State }) {
  if (state === "checked") return <CheckCircle2 className="h-4 w-4" />;
  if (state === "pending") return <Clock className="h-4 w-4" />;
  if (state === "rejected") return <XCircle className="h-4 w-4" />;
  if (state === "more_info") return <AlertCircle className="h-4 w-4" />;
  return <Circle className="h-4 w-4" />;
}

export function TrustChecks({ carId, carFlags, sellerVerified }: Props) {
  // Optional: fetch car_verifications status to distinguish pending vs not-started.
  const [cv, setCv] = useState<{ status: string | null } | null>(null);
  const [inspection, setInspection] = useState<{
    status: string | null;
    admin_approved: boolean | null;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [v, i] = await Promise.all([
        supabase
          .from("car_verifications")
          .select("status")
          .eq("car_id", carId)
          .maybeSingle(),
        supabase
          .from("inspections")
          .select("status, admin_approved")
          .eq("car_id", carId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (!active) return;
      setCv(v.data ?? null);
      setInspection(i.data ?? null);
    })();
    return () => {
      active = false;
    };
  }, [carId]);

  const cvStatus = cv?.status ?? null;

  const docState: State = carFlags.documents_verified
    ? "checked"
    : cvStatus === "rejected"
      ? "rejected"
      : cvStatus === "more_info_needed"
        ? "more_info"
        : cvStatus === "pending" || cvStatus === "under_review"
          ? "pending"
          : "not_started";

  const ntsaState: State = carFlags.ntsa_verified
    ? "checked"
    : cvStatus === "pending" || cvStatus === "under_review"
      ? "pending"
      : "not_started";

  const inspectionState: State = carFlags.inspection_verified
    ? "checked"
    : inspection?.status === "completed" && !inspection.admin_approved
      ? "pending"
      : inspection?.status === "scheduled" || inspection?.status === "in_progress"
        ? "pending"
        : "not_started";

  const items: CheckItem[] = [
    {
      key: "seller",
      label: "Seller Verified",
      icon: <ShieldCheck className="h-4 w-4" />,
      state: sellerVerified ? "checked" : "not_started",
      hint: "Seller ID and contact confirmed by AutoConnect.",
    },
    {
      key: "logbook",
      label: "Logbook Checked",
      icon: <FileCheck2 className="h-4 w-4" />,
      state: docState,
      hint: "Ownership documents reviewed by our team.",
    },
    {
      key: "ntsa",
      label: "NTSA Checked",
      icon: <BadgeCheck className="h-4 w-4" />,
      state: ntsaState,
      hint: "Records confirmed via NTSA / eCitizen.",
    },
    {
      key: "inspection",
      label: "Inspection Done",
      icon: <Wrench className="h-4 w-4" />,
      state: inspectionState,
      hint: "Independent mechanic inspection completed and approved.",
    },
  ];

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Trust checks</h3>
        <span className="text-xs text-muted-foreground">
          {items.filter((i) => i.state === "checked").length}/4 complete
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((it) => (
          <li
            key={it.key}
            className={`flex items-start gap-2.5 rounded-lg border p-3 ${STATE_STYLE[it.state]}`}
          >
            <div className="mt-0.5 shrink-0">{it.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{it.label}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                  <StateIcon state={it.state} />
                  {STATE_LABEL[it.state]}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">{it.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
