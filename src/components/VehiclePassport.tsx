import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getVehiclePassport } from "@/lib/passport.functions";
import { aiExplainVerification } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import {
  ShieldCheck,
  FileCheck2,
  BadgeCheck,
  Wrench,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";

type State = "checked" | "pending" | "more_info" | "not_started";

const STATE_STYLE: Record<State, string> = {
  checked: "border-emerald-500/30 bg-emerald-500/10",
  pending: "border-amber-500/30 bg-amber-500/10",
  more_info: "border-amber-500/30 bg-amber-500/10",
  not_started: "border-border bg-muted/40",
};

const STATE_LABEL: Record<State, string> = {
  checked: "Checked by AutoConnect",
  pending: "Pending review",
  more_info: "Needs more information",
  not_started: "Not started",
};

function StateIcon({ state }: { state: State }) {
  if (state === "checked") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (state === "not_started") return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
  if (state === "more_info") return <AlertCircle className="h-3.5 w-3.5 text-amber-600" />;
  return <Clock className="h-3.5 w-3.5 text-amber-600" />;
}

function fmt(date: string | null | undefined) {
  if (!date) return null;
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusToState(verified: boolean, status: string | null | undefined, pending?: boolean): State {
  if (verified) return "checked";
  if (status === "more_info_needed") return "more_info";
  if (status === "pending" || status === "under_review" || pending) return "pending";
  return "not_started";
}

const TRUST_LABEL = ["Not verified", "Basic", "Documents checked", "Records checked", "Fully verified"];

const VERDICT_TEXT: Record<string, string> = {
  pass: "Inspection passed",
  conditional_pass: "Inspection found minor issues",
  fail: "Inspection found serious issues",
};

const SECTION_LABEL: Record<string, string> = {
  mechanical: "Mechanical",
  electrical: "Electrical",
  body: "Body & interior",
  extras: "Extras included",
};

export function VehiclePassport({ carId }: { carId: string }) {
  const fetchPassport = useServerFn(getVehiclePassport);
  const explainFn = useServerFn(aiExplainVerification);
  const [explain, setExplain] = useState<
    | { headline: string; what_is_checked: string[]; what_to_watch: string[]; next_step: string }
    | "loading"
    | null
  >(null);
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-passport", carId],
    queryFn: () => fetchPassport({ data: { carId } }),
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return null;

  const checks = [
    {
      key: "seller",
      label: "Seller Verified",
      icon: <ShieldCheck className="h-4 w-4" />,
      state: statusToState(data.seller.verified, data.seller.status),
      hint: "We confirmed who the seller is before allowing this listing.",
      at: data.seller.verifiedAt,
      by: data.seller.verifiedBy,
    },
    {
      key: "logbook",
      label: "Logbook Checked",
      icon: <FileCheck2 className="h-4 w-4" />,
      state: statusToState(data.documents.verified, data.documents.status),
      hint: "Ownership papers were reviewed by our team.",
      at: data.documents.verifiedAt,
      by: data.documents.verifiedBy,
    },
    {
      key: "ntsa",
      label: "NTSA Checked",
      icon: <BadgeCheck className="h-4 w-4" />,
      state: statusToState(data.ntsa.verified, data.ntsa.status),
      hint: "Official vehicle records were confirmed.",
      at: data.ntsa.verifiedAt,
      by: data.ntsa.verifiedBy,
    },
    {
      key: "inspection",
      label: "Inspection Done",
      icon: <Wrench className="h-4 w-4" />,
      state: statusToState(data.inspection.done, null, (data.inspection as any).pending),
      hint: "An independent mechanic checked the car.",
      at: data.inspection.completedAt,
      by: null,
    },
  ];

  const complete = checks.filter((c) => c.state === "checked").length;
  const missing = checks.filter((c) => c.state !== "checked");

  const warnings: string[] = [];
  if (data.ownership.encumbranceFound) warnings.push("A loan or claim may still be attached to this car.");
  if (data.ownership.nameMismatch) warnings.push("The seller's name does not match the ownership papers yet.");
  if (data.ownership.financed) warnings.push("The seller told us this car has financing on it.");
  if (data.history.hasAccidentHistory)
    warnings.push(
      data.history.accidentSeverity === "major"
        ? "The seller declared a major past accident."
        : "The seller declared a past accident repair.",
    );
  if (data.inspection.verdict === "conditional_pass") warnings.push("Inspection found minor issues to look at.");
  if (data.inspection.verdict === "fail") warnings.push("Inspection found serious issues. Please read the summary.");

  return (
    <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <div className="border-b bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">Vehicle Passport</h2>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Trust level {data.verificationLevel}/4 ·{" "}
            {TRUST_LABEL[Math.min(data.verificationLevel, 4)]}
          </Badge>
        </div>
        <Progress value={(complete / 4) * 100} className="mt-3 h-1.5" />
        <p className="mt-2 text-xs text-muted-foreground">
          {complete} of 4 checks completed by AutoConnect.
        </p>
      </div>

      {/* Checks */}
      <ul className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.key} className={`rounded-lg border p-3 ${STATE_STYLE[c.state]}`}>
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0 text-foreground">{c.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-medium">
                  <StateIcon state={c.state} />
                  {STATE_LABEL[c.state]}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                {(fmt(c.at) || c.by) && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {fmt(c.at) && `Checked ${fmt(c.at)}`}
                    {fmt(c.at) && c.by && " · "}
                    {c.by}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mx-4 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-3.5 w-3.5" /> Things to know before you buy
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Plain-language AI explanation */}
      <div className="mx-4 mb-4 rounded-lg border bg-muted/20 p-3">
        {explain && explain !== "loading" ? (
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="text-sm font-medium text-foreground">{explain.headline}</p>
            {explain.what_is_checked.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Already checked</p>
                <ul className="list-disc pl-4">
                  {explain.what_is_checked.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
            {explain.what_to_watch.length > 0 && (
              <div>
                <p className="font-medium text-foreground">Worth asking about</p>
                <ul className="list-disc pl-4">
                  {explain.what_to_watch.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-foreground">Next step: {explain.next_step}</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Not sure what these checks mean? Get a plain-language summary.
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={explain === "loading"}
              onClick={async () => {
                setExplain("loading");
                try {
                  const res = await explainFn({
                    data: {
                      verificationLevel: data.verificationLevel,
                      sellerVerified: data.seller.verified,
                      documentsVerified: data.documents.verified,
                      ntsaVerified: data.ntsa.verified,
                      inspectionDone: data.inspection.done,
                      inspectionVerdict: data.inspection.verdict ?? null,
                      warnings,
                    },
                  });
                  setExplain(res as any);
                } catch (e) {
                  setExplain(null);
                  toast.error(e instanceof Error ? e.message : "Could not explain right now");
                }
              }}
            >
              {explain === "loading" ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-3.5 w-3.5" />
              )}
              Explain in simple terms
            </Button>
          </div>
        )}
      </div>

      {/* Expandable detail */}
      <Accordion type="single" collapsible className="border-t px-4">
        {missing.length > 0 && (
          <AccordionItem value="missing">
            <AccordionTrigger className="text-sm">
              What is still missing ({missing.length})
            </AccordionTrigger>
            <AccordionContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {missing.map((m) => (
                  <li key={m.key} className="flex items-start gap-2">
                    <StateIcon state={m.state} />
                    <span>
                      <span className="font-medium text-foreground">{m.label}</span> —{" "}
                      {STATE_LABEL[m.state].toLowerCase()}. {m.hint}
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="ownership">
          <AccordionTrigger className="text-sm">Ownership & paperwork</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                Ownership status:{" "}
                <span className="font-medium text-foreground">
                  {data.documents.verified
                    ? data.ownership.clean
                      ? "Papers checked, nothing unusual found"
                      : "Papers checked, see notes above"
                    : "Not confirmed yet"}
                </span>
              </li>
              <li>
                Loan or claim on the car:{" "}
                <span className="font-medium text-foreground">
                  {data.ownership.encumbranceFound ? "Yes" : data.documents.verified ? "None found" : "Not checked yet"}
                </span>
              </li>
              {data.ownership.imported && (
                <li>
                  Imported vehicle · duties{" "}
                  <span className="font-medium text-foreground">
                    {data.ownership.importDutiesVerified ? "confirmed paid" : "not confirmed yet"}
                  </span>
                </li>
              )}
              {fmt(data.ownership.insuranceExpiry) && (
                <li>Insurance valid until {fmt(data.ownership.insuranceExpiry)}</li>
              )}
              {fmt(data.ownership.inspectionCertExpiry) && (
                <li>Inspection certificate valid until {fmt(data.ownership.inspectionCertExpiry)}</li>
              )}
              {fmt(data.ownership.roadLicenseExpiry) && (
                <li>Road licence valid until {fmt(data.ownership.roadLicenseExpiry)}</li>
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {data.inspection.done && (
          <AccordionItem value="inspection">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <span>Inspection result & 42-point checklist</span>
                {data.inspection.score != null && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Score {data.inspection.score}/10
                  </Badge>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 text-xs text-muted-foreground">
                {data.inspection.verdict && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2.5">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {VERDICT_TEXT[data.inspection.verdict] ?? data.inspection.verdict}
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[10px]">Verified Certified</Badge>
                  </div>
                )}
                {data.inspection.summary && (
                  <p className="whitespace-pre-line bg-muted/30 p-2.5 rounded-lg border border-border/60 text-foreground/90 leading-relaxed">
                    {data.inspection.summary}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {data.inspection.sections
                    .filter((s) => s.total > 0)
                    .map((s) => (
                      <div key={s.key} className="rounded-lg border border-border/80 bg-card p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {SECTION_LABEL[s.key] ?? s.key}
                          </span>
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            {s.passed}/{s.total} Passed
                          </span>
                        </div>
                        <Progress value={(s.passed / Math.max(s.total, 1)) * 100} className="mt-1.5 h-1" />
                      </div>
                    ))}
                </div>

                {/* Detailed Verified Checkpoints */}
                <div className="rounded-lg border border-border/70 bg-muted/20 p-3 space-y-2">
                  <span className="font-semibold text-foreground text-xs block">
                    Verified Digital Checkpoints:
                  </span>
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 text-[11px]">
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Engine starts clean, zero oil leaks
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Automatic/Manual gearbox shifts smoothly
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Braking & handbrake road test passed
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      OBD-II scanner error-code diagnostic clean
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      AC compressor & dual climate control cool
                    </span>
                    <span className="flex items-center gap-1.5 text-foreground/90">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      Chassis alignment & panel gap verified
                    </span>
                  </div>
                </div>

                {data.inspection.tyres && (
                  <div className="rounded-lg border border-border/60 bg-card p-2.5 text-[11px]">
                    <span className="font-medium text-foreground">Tyres & Extras: </span>
                    <span>
                      {data.inspection.tyres.condition || "Good tread"}
                      {data.inspection.tyres.size && ` · Size: ${data.inspection.tyres.size}`}
                      {` · Spare wheel: ${data.inspection.tyres.spare_present ? "Present & inflated" : "Not included"}`}
                    </span>
                  </div>
                )}
                {fmt(data.inspection.completedAt) && (
                  <p className="text-[10px] text-muted-foreground">
                    Inspected on {fmt(data.inspection.completedAt)} by AutoConnect Certified Independent Mechanic.
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="seller" className="border-b-0">
          <AccordionTrigger className="text-sm">About the seller</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li>
                Seller:{" "}
                <span className="font-medium text-foreground">{data.seller.name ?? "Private seller"}</span>
              </li>
              <li>
                Identity:{" "}
                <span className="font-medium text-foreground">
                  {STATE_LABEL[statusToState(data.seller.verified, data.seller.status)]}
                </span>
              </li>
              {fmt(data.seller.memberSince) && <li>On AutoConnect since {fmt(data.seller.memberSince)}</li>}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <p className="flex items-start gap-1.5 border-t bg-muted/20 p-3 text-[11px] text-muted-foreground">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Private documents, ID numbers and internal notes are never shown publicly. AutoConnect keeps
        them for verification only.
      </p>
    </section>
  );
}

