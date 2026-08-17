import { Badge } from "@/components/ui/badge";

type Tone = "success" | "warning" | "danger" | "muted" | "info";

const TONE: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-primary/30 bg-primary/10 text-primary",
  muted: "border-border bg-muted text-muted-foreground",
};

/** Plain-language labels shared by admin, seller and buyer surfaces. */
const MAP: Record<string, { label: string; tone: Tone }> = {
  // listings
  draft: { label: "Draft", tone: "muted" },
  pending: { label: "Waiting for review", tone: "warning" },
  under_review: { label: "Under review", tone: "warning" },
  more_info_needed: { label: "Needs more information", tone: "warning" },
  approved: { label: "Live", tone: "success" },
  verified: { label: "Checked by AutoConnect", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  sold: { label: "Sold", tone: "muted" },
  under_transaction: { label: "Under transaction", tone: "info" },
  suspended: { label: "Suspended", tone: "danger" },
  // transactions
  awaiting_manual_payment: { label: "Manual payment under review", tone: "warning" },
  payment_pending: { label: "Payment pending", tone: "warning" },
  payment_received: { label: "Payment protected", tone: "info" },
  handover_ready: { label: "Ready for handover", tone: "info" },
  completed: { label: "Completed", tone: "success" },
  released: { label: "Funds released", tone: "success" },
  refunded: { label: "Refunded", tone: "muted" },
  disputed: { label: "Dispute open", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "muted" },
  // inspections
  requested: { label: "Inspection requested", tone: "warning" },
  scheduled: { label: "Inspection scheduled", tone: "info" },
  in_progress: { label: "Inspection in progress", tone: "info" },
  pass: { label: "Inspection passed", tone: "success" },
  conditional_pass: { label: "Minor issues found", tone: "warning" },
  fail: { label: "Serious issues found", tone: "danger" },
};

export function statusMeta(status: string | null | undefined) {
  if (!status) return { label: "Not started", tone: "muted" as Tone };
  return MAP[status] ?? { label: status.replace(/_/g, " "), tone: "muted" as Tone };
}

export function StatusPill({
  status,
  label,
  className = "",
}: {
  status: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const meta = statusMeta(status);
  return (
    <Badge variant="outline" className={`${TONE[meta.tone]} ${className}`}>
      {label ?? meta.label}
    </Badge>
  );
}
