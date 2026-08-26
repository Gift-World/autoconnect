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
    title: "Vehicle Identity Verification",
    desc: "Digital chassis & VIN matching with structured verification protocols and export documentation cross-checks.",
    tag: "Chassis & VIN Cleared",
  },
  {
    step: "02",
    icon: ShieldCheck,
    title: "Ownership & Seller KYC",
    desc: "Verification of official logbook title, import entry declarations, and verified seller identity protocols.",
    tag: "Clean Title Guaranteed",
  },
  {
    step: "03",
    icon: History,
    title: "Odometer & History Audit",
    desc: "Comprehensive mileage rollback detection through auction house history and pre-export inspection reports.",
    tag: "Authentic Mileage",
  },
  {
    step: "04",
    icon: Wrench,
    title: "150-Point Mechanical Scan",
    desc: "On-site ECU computer diagnostics, transmission compression tests, structural frame checks, and flood damage analysis.",
    tag: "Diagnostic Report Ready",
  },
  {
    step: "05",
    icon: Lock,
    title: "Regulated Bank Escrow",
    desc: "Your purchase funds are held securely in a ring-fenced bank escrow account. Zero money reaches the seller upfront.",
    tag: "Escrow Protected Funds",
  },
  {
    step: "06",
    icon: Handshake,
    title: "6-Digit Release Handover",
    desc: "You test drive and inspect the car in person. Funds disburse only when you input your private 6-digit release PIN.",
    tag: "Buyer Authorizes Payout",
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
            AutoConnect is not a passive classifieds board. We are a strict trust infrastructure ensuring zero broker scams, zero tampered odometers, and guaranteed escrow protection.
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
                  <span className="text-[11px] text-muted-foreground font-medium">Stage {s.step}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
