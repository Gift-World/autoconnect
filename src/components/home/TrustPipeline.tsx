import { useState } from "react";
import {
  FileCheck,
  ShieldCheck,
  History,
  Wrench,
  Lock,
  Handshake,
  CheckCircle2,
} from "lucide-react";

const VERIFICATION_STEPS = [
  {
    step: "01",
    icon: FileCheck,
    title: "Vehicle evidence review",
    desc: "Seller documents and vehicle evidence can be submitted for review. Only reviewed evidence is marked as verified.",
    tag: "Evidence shown per listing",
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Seller & document review",
    desc: "Seller identity and documents are shown as reviewed only when AutoConnect has recorded a completed review.",
    tag: "Review status visible",
  },
  {
    step: "03",
    icon: History,
    title: "History evidence",
    desc: "Mileage, inspection and history claims require a supporting report. Missing evidence is shown as missing, not assumed.",
    tag: "No unsupported claims",
  },
  {
    step: "04",
    icon: Wrench,
    title: "Inspection evidence",
    desc: "Inspection results appear only when a provider or reviewer attaches an actual report to the vehicle.",
    tag: "Report required",
  },
  {
    step: "05",
    icon: Lock,
    title: "Verified payment status",
    desc: "A reservation does not mean payment is complete. Payment status changes only after provider or bank evidence is verified.",
    tag: "Evidence before release",
  },
  {
    step: "06",
    icon: Handshake,
    title: "Documented handover",
    desc: "The buyer, seller and AutoConnect record the handover steps. Any future payout automation depends on a contracted payment partner.",
    tag: "Handover recorded",
  },
];

export function TrustPipeline() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="bg-background py-20 lg:py-28 border-t border-border/80">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
            <ShieldCheck className="h-4 w-4" /> Comprehensive Trust Infrastructure
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Every vehicle has a story.
            <br />
            <span className="text-teal-600 dark:text-teal-400">We help you verify it.</span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
            AutoConnect is built to show evidence, transaction status and the next accountable step.
            We do not present unreviewed claims as verified facts.
          </p>
        </div>

        {/* 6-Stage Process Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VERIFICATION_STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isHovered = activeStep === idx;

            return (
              <div
                key={s.step}
                onMouseEnter={() => setActiveStep(idx)}
                onClick={() => setActiveStep(idx)}
                className={`relative flex flex-col justify-between rounded-3xl border p-7 transition-all duration-300 ${
                  isHovered
                    ? "border-teal-500/50 bg-card shadow-xl -translate-y-1"
                    : "border-border/80 bg-secondary/30 hover:border-border"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="font-display text-2xl font-black text-muted-foreground/40">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="font-display mt-6 text-lg font-bold tracking-tight text-foreground">
                    {s.title}
                  </h3>

                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {s.tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Stage {s.step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
