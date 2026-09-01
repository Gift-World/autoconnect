import { CheckCircle2, CircleAlert, FileSearch, MessageSquareText, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

type BuyWithConfidencePlanProps = {
  title: string;
  imageCount: number;
  documentsVerified: boolean;
  titleVerified: boolean;
  inspectionVerified: boolean;
  availableForExport: boolean;
  onAskSeller: () => void;
};

type Evidence = {
  label: string;
  detail: string;
  ready: boolean;
};

/**
 * A concise, evidence-led buying plan. It intentionally reports only values
 * supplied by the live listing rather than inferring a verification result.
 */
export function BuyWithConfidencePlan({
  title,
  imageCount,
  documentsVerified,
  titleVerified,
  inspectionVerified,
  availableForExport,
  onAskSeller,
}: BuyWithConfidencePlanProps) {
  const evidence: Evidence[] = [
    {
      label: "Original listing photos",
      detail: imageCount > 0 ? `${imageCount} photo${imageCount === 1 ? "" : "s"} attached` : "No photos attached yet",
      ready: imageCount >= 3,
    },
    {
      label: "Ownership evidence",
      detail: documentsVerified ? "Documents reviewed" : "Ask the seller to provide documents",
      ready: documentsVerified,
    },
    {
      label: "Title / vehicle record",
      detail: titleVerified ? "Record verified" : "Verification has not been recorded",
      ready: titleVerified,
    },
    {
      label: "Independent inspection",
      detail: inspectionVerified ? "Inspection completed" : "Book or request an inspection",
      ready: inspectionVerified,
    },
  ];
  const readyCount = evidence.filter((item) => item.ready).length;
  const canProceed = readyCount === evidence.length;

  return (
    <section className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Buyer confidence plan</p>
          <h2 className="mt-1 text-lg font-bold">Know what to verify before you buy</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            A plain-language checklist for {title}. AutoConnect only marks evidence complete when it exists on the listing.
          </p>
        </div>
        <div className="rounded-full border border-primary/25 bg-background px-3 py-1.5 text-xs font-semibold text-primary">
          {readyCount} of {evidence.length} checks recorded
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {evidence.map((item) => (
          <div key={item.label} className="flex items-start gap-2.5 rounded-xl border border-border/70 bg-background/70 p-3">
            {item.ready ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            )}
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onAskSeller} className="gap-1.5">
          <MessageSquareText className="h-3.5 w-3.5" /> Ask for missing evidence
        </Button>
        {availableForExport && (
          <Button asChild type="button" size="sm" variant="outline" className="gap-1.5">
            <Link to="/import">
              <Truck className="h-3.5 w-3.5" /> Estimate import costs
            </Link>
          </Button>
        )}
        <Button asChild type="button" size="sm" variant="ghost" className="gap-1.5">
          <Link to="/trust">
            <ShieldCheck className="h-3.5 w-3.5" /> How verification works
          </Link>
        </Button>
      </div>

      {!canProceed && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileSearch className="h-3.5 w-3.5" /> Do not release funds until the missing evidence is reviewed.
        </p>
      )}
    </section>
  );
}
