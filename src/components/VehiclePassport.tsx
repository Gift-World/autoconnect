import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getVehiclePassport } from "@/lib/passport.functions";
import { getPublicRecallNotices } from "@/lib/public-vehicle-data.functions";
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
  Car,
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

function statusToState(
  verified: boolean,
  status: string | null | undefined,
  pending?: boolean,
): State {
  if (verified) return "checked";
  if (status === "more_info_needed") return "more_info";
  if (status === "pending" || status === "under_review" || pending) return "pending";
  return "not_started";
}

const TRUST_LABEL = [
  "Not verified",
  "Basic",
  "Documents checked",
  "Records checked",
  "Fully verified",
];

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
  const [explain, setExplain] = useState<
    | { headline: string; what_is_checked: string[]; what_to_watch: string[]; next_step: string }
    | "loading"
    | null
  >(null);
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-passport", carId],
    queryFn: () => getVehiclePassport({ data: { carId } }),
  });
  const recalls = useQuery({
    queryKey: ["public-recalls", data?.vehicle.make, data?.vehicle.model, data?.vehicle.year],
    enabled: !!data?.vehicle.make && !!data?.vehicle.model && !!data?.vehicle.year,
    queryFn: () =>
      getPublicRecallNotices({
        data: {
          make: data!.vehicle.make!,
          model: data!.vehicle.model!,
          year: data!.vehicle.year!,
        },
      }),
    staleTime: 1000 * 60 * 60 * 12,
  });

  if (isLoading) {
    return (
      <div className="mt-8 rounded-3xl border bg-card p-8 text-center shadow-sm">
        <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data) return null;

  const unverifiedBanner = data.isManualGarageVehicle ? (
    <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-amber-500/25 bg-amber-500/5 p-5 animate-in fade-in sm:flex-row sm:items-center sm:p-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10">
        <AlertCircle className="h-5 w-5 text-amber-600" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-[.14em] text-amber-700">
          Ownership record
        </p>
        <h3 className="mt-1 text-base font-bold text-foreground">
          This vehicle has not been verified yet
        </h3>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          You can keep mileage, service and document records here now. Ownership and other checks
          remain unconfirmed until supporting evidence is reviewed.
        </p>
      </div>
      <Button className="bg-amber-600 text-white hover:bg-amber-700" size="sm">
        Start ownership review
      </Button>
    </div>
  ) : null;

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
  if (data.ownership.encumbranceFound)
    warnings.push("A loan or claim may still be attached to this car.");
  if (data.ownership.nameMismatch)
    warnings.push("The seller's name does not match the ownership papers yet.");
  if (data.ownership.financed) warnings.push("The seller told us this car has financing on it.");
  if (data.history.hasAccidentHistory)
    warnings.push(
      data.history.accidentSeverity === "major"
        ? "The seller declared a major past accident."
        : "The seller declared a past accident repair.",
    );
  if (data.inspection.verdict === "conditional_pass")
    warnings.push("Inspection found minor issues to look at.");
  if (data.inspection.verdict === "fail")
    warnings.push("Inspection found serious issues. Please read the summary.");

  return (
    <div className="mt-8 space-y-6">
      {unverifiedBanner}

      <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        {/* Header */}
        <div className="border-b bg-gradient-to-br from-slate-950 to-slate-900 p-5 text-white sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-400/15 text-teal-300">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.14em] text-teal-300">
                  Evidence overview
                </p>
                <h2 className="mt-0.5 text-lg font-bold">What we can confirm today</h2>
              </div>
            </div>
            <Badge className="border border-white/15 bg-white/10 text-[11px] text-white hover:bg-white/10">
              Level {data.verificationLevel}/4 · {TRUST_LABEL[Math.min(data.verificationLevel, 4)]}
            </Badge>
          </div>
          <Progress value={(complete / 4) * 100} className="mt-5 h-2 bg-white/10" />
          <p className="mt-2 text-sm text-slate-300">
            {complete} of 4 evidence checks are complete.
          </p>
        </div>

        {/* Checks */}
        <ul className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
          {checks.map((c) => (
            <li key={c.key} className={`rounded-2xl border p-4 ${STATE_STYLE[c.state]}`}>
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0 text-foreground">{c.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{c.label}</p>
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
          <div className="mx-5 mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:mx-6 sm:mb-6">
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
        <div className="mx-5 mb-5 rounded-2xl border bg-muted/20 p-4 sm:mx-6 sm:mb-6">
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
                    const res = await aiExplainVerification({
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

        {/* Verified History Timeline */}
        {data.events && data.events.length > 0 && (
          <div className="border-t bg-muted/10 p-4">
            <h3 className="mb-3 text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Verified History Timeline
            </h3>
            <div className="relative border-l-2 border-primary/20 ml-2 space-y-4 pb-2">
              {data.events.map((ev: any, idx: number) => (
                <div key={idx} className="relative pl-4">
                  <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></div>
                  <p className="text-xs font-semibold text-foreground">
                    {ev.event_type.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{ev.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/80">{fmt(ev.timestamp)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expandable detail */}
        <Accordion type="single" collapsible className="border-t px-5 sm:px-6">
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
                    {data.ownership.encumbranceFound
                      ? "Yes"
                      : data.documents.verified
                        ? "None found"
                        : "Not checked yet"}
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
                  <li>
                    Inspection certificate valid until {fmt(data.ownership.inspectionCertExpiry)}
                  </li>
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
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    >
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
                      <Badge className="bg-emerald-600 text-white text-[10px]">
                        Verified Certified
                      </Badge>
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
                        <div
                          key={s.key}
                          className="rounded-lg border border-border/80 bg-card p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {SECTION_LABEL[s.key] ?? s.key}
                            </span>
                            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              {s.passed}/{s.total} Passed
                            </span>
                          </div>
                          <Progress
                            value={(s.passed / Math.max(s.total, 1)) * 100}
                            className="mt-1.5 h-1"
                          />
                        </div>
                      ))}
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
                      Inspection completed on {fmt(data.inspection.completedAt)}. See the supplied
                      checklist and summary above for the evidence available for this vehicle.
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
                  <span className="font-medium text-foreground">
                    {data.seller.name ?? "Private seller"}
                  </span>
                </li>
                <li>
                  Identity:{" "}
                  <span className="font-medium text-foreground">
                    {STATE_LABEL[statusToState(data.seller.verified, data.seller.status)]}
                  </span>
                </li>
                {fmt(data.seller.memberSince) && (
                  <li>On AutoConnect since {fmt(data.seller.memberSince)}</li>
                )}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <p className="flex items-start gap-1.5 border-t bg-muted/20 p-4 text-[11px] text-muted-foreground sm:px-6">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Private documents, ID numbers and internal notes are never shown publicly. AutoConnect
          keeps them for verification only.
        </p>
      </section>
      {data.vehicle.make && data.vehicle.model && data.vehicle.year && (
        <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Public manufacturer recall notices</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                NHTSA public data for {data.vehicle.year} {data.vehicle.make} {data.vehicle.model}.
                It is not an AutoConnect inspection, proof of ownership, NTSA clearance, or proof
                that a recall was repaired.
              </p>
            </div>
          </div>
          {recalls.isLoading ? (
            <p className="mt-3 text-xs text-muted-foreground">Checking public notices…</p>
          ) : recalls.isError ? (
            <p className="mt-3 text-xs text-amber-700">
              Public recall notices are unavailable right now. This does not mean there are no
              recalls.
            </p>
          ) : recalls.data?.length ? (
            <Accordion type="single" collapsible className="mt-3">
              {recalls.data.slice(0, 5).map((recall) => (
                <AccordionItem key={recall.campaignNumber} value={recall.campaignNumber}>
                  <AccordionTrigger className="py-2 text-left text-xs">
                    {recall.component} · {recall.campaignNumber}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-xs text-muted-foreground">
                    <p>{recall.summary}</p>
                    {recall.remedy && (
                      <p>
                        <strong className="text-foreground">Remedy:</strong> {recall.remedy}
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No matching public NHTSA notices were returned. This only covers the US public
              database.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
