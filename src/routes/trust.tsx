import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Car, FileCheck2, ShieldCheck, UserRoundCheck } from "lucide-react";
import { RevealText } from "@/components/motion/RevealText";
import { InfoHero, SectionHeading, pillOnDark, pillPrimary } from "@/components/info/InfoHero";
import { HelpLinks } from "@/components/info/HelpLinks";

const checks = [
  {
    icon: UserRoundCheck,
    title: "Seller verification",
    body: "Seller profiles progress through account, business, and document review. A verified label should only be shown after that review is complete.",
    color: "bg-ac-cream",
  },
  {
    icon: Car,
    title: "Vehicle evidence",
    body: "Each listing should show its own photos, VIN or chassis evidence where available, condition information, and documents. Missing evidence is shown as pending—not assumed complete.",
    color: "bg-ac-powder",
  },
  {
    icon: FileCheck2,
    title: "Inspection and title checks",
    body: "Inspection, title, and import-duty statuses are recorded per vehicle. Review the vehicle passport and ask questions before reserving a car.",
    color: "bg-ac-apricot",
  },
  {
    icon: ShieldCheck,
    title: "Protected payment workflow",
    body: "Card, bank-transfer, and M-Pesa requests follow recorded transaction milestones. Funds must not be released until payment, handover, and buyer confirmation requirements are met.",
    color: "bg-ac-stone",
  },
];

export const Route = createFileRoute("/trust")({
  head: () => ({
    meta: [
      { title: "Trust Center — AutoConnect" },
      {
        name: "description",
        content:
          "Understand the seller, vehicle, inspection, and payment evidence available on AutoConnect.",
      },
    ],
  }),
  component: TrustPage,
});

function TrustPage() {
  return (
    <main className="bg-background text-foreground">
      <InfoHero
        kicker={
          <>
            <ShieldCheck className="h-4 w-4" /> Trust center
          </>
        }
        title={
          <>
            Evidence before <span className="text-ac-accent">a decision.</span>
          </>
        }
        intro="AutoConnect is designed to make the information behind a vehicle visible."
        image="/images/providers/nairobi-vehicle-inspection.jpg"
        imageAlt="A technician inspecting a vehicle in a Nairobi workshop"
      >
        <Link to="/cars" className={pillPrimary}>
          Browse live listings <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/how-payments-work" className={pillOnDark}>
          Read payment and dispute process
        </Link>
      </InfoHero>

      {/* The one promise, revealed on scroll */}
      <section className="mx-auto max-w-[1360px] px-4 py-16 sm:px-6 sm:py-28">
        <p className="brand-kicker text-muted-foreground">How to read every status</p>
        <RevealText
          text="Treat every status as evidence to review — not a substitute for your own inspection or professional advice."
          className="font-brand mt-6 max-w-5xl text-3xl text-foreground sm:text-5xl lg:text-6xl"
        />
      </section>

      {/* Four checks */}
      <section
        aria-labelledby="checks-title"
        className="mx-auto max-w-[1360px] px-4 pb-4 sm:px-6"
      >
        <SectionHeading
          id="checks-title"
          kicker="What we record"
          title="Four layers of evidence, shown as they are."
        />
        <div className="mt-10 grid gap-3 sm:gap-4 md:grid-cols-2">
          {checks.map(({ icon: Icon, title, body, color }, index) => (
            <article
              key={title}
              className={`${color} flex min-h-[280px] flex-col justify-between rounded-[28px] p-6 text-ac-ink sm:rounded-[36px] sm:p-10`}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-ac-ink text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="font-brand text-4xl text-ac-ink/20 sm:text-6xl">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="mt-10">
                <h3 className="font-brand text-2xl sm:text-4xl">{title}</h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-ac-ink/75">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Off-platform payment warning */}
      <section className="px-3 pt-12 sm:px-5 sm:pt-16">
        <div className="mx-auto grid max-w-[1360px] gap-8 rounded-[28px] bg-ac-ink p-6 text-white sm:rounded-[36px] sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-end lg:p-14">
          <div>
            <p className="brand-kicker flex items-center gap-2 text-ac-accent">
              <BadgeCheck className="h-4 w-4" /> Stay protected
            </p>
            <h2 className="font-brand mt-5 text-3xl sm:text-5xl">
              Keep every payment inside the recorded workflow.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Do not send money outside the recorded transaction workflow. Report any request for an
              off-platform payment through the support path.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link to="/support" className={pillPrimary}>
              Report a payment request <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/how-payments-work" className={pillOnDark}>
              How payments work
            </Link>
          </div>
        </div>
      </section>

      <HelpLinks current="trust" />
    </main>
  );
}
