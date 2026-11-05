import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Camera, ClipboardList, RotateCcw, Scale, SearchCheck } from "lucide-react";
import { StackPanels, type StackPanel } from "@/components/motion/StackPanels";
import { InfoHero, SectionHeading, pillOnDark, pillPrimary } from "@/components/info/InfoHero";
import { HelpLinks } from "@/components/info/HelpLinks";

export const Route = createFileRoute("/disputes")({
  head: () => ({ meta: [{ title: "Buyer Dispute Process — AutoConnect" }] }),
  component: DisputesPage,
});

const steps: { id: string; label: string; color: string; title: string; body: string; icon: ReactNode }[] = [
  {
    id: "when",
    label: "When to raise",
    color: "var(--color-ac-apricot)",
    title: "When to raise a dispute",
    body: "Raise it before confirming handover if the vehicle, title, evidence, or agreed condition materially differs from the recorded transaction.",
    icon: <AlertTriangle className="h-6 w-6" />,
  },
  {
    id: "provide",
    label: "What to provide",
    color: "var(--color-ac-cream)",
    title: "What to provide",
    body: "Add clear photos, inspection notes, title or registration concerns, and the exact part of the listing or agreement that does not match.",
    icon: <Camera className="h-6 w-6" />,
  },
  {
    id: "next",
    label: "What happens next",
    color: "var(--color-ac-powder)",
    title: "What happens next",
    body: "The transaction is marked for review. Keep communication and evidence in the platform so an administrator can assess the case.",
    icon: <SearchCheck className="h-6 w-6" />,
  },
];

function DisputesPage() {
  const panels: StackPanel[] = steps.map((step, index) => ({
    id: `dispute-${step.id}`,
    label: step.label,
    color: step.color,
    content: (
      <div className="flex h-full flex-col justify-between gap-6 overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-ac-ink text-white">
            {step.icon}
          </span>
          <span className="font-brand text-6xl text-ac-ink/15 sm:text-8xl lg:text-9xl">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="max-w-4xl">
          <h3 className="font-brand text-4xl sm:text-6xl lg:text-7xl">{step.title}</h3>
          <p className="mt-5 max-w-2xl text-base leading-7 text-ac-ink/75 sm:text-xl sm:leading-8">
            {step.body}
          </p>
        </div>
      </div>
    ),
  }));

  return (
    <main className="bg-background text-foreground">
      <InfoHero
        kicker={
          <>
            <Scale className="h-4 w-4" /> Buyer protection
          </>
        }
        title={
          <>
            Raise concerns <span className="text-ac-accent">before confirming receipt.</span>
          </>
        }
        intro="A dispute is part of the recorded transaction workflow. It is not a guarantee of an outcome; review the vehicle and its documentation before release."
        image="/images/hero-driving-suv.jpg"
        imageAlt="An SUV on the road"
      >
        <Link to="/support" className={pillPrimary}>
          Get support <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/how-payments-work" className={pillOnDark}>
          How payments work
        </Link>
      </InfoHero>

      <section className="mx-auto max-w-[1360px] px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <SectionHeading
          kicker="Three steps"
          title="If something does not match, say so before you confirm."
        />
      </section>

      {/* Pinned dispute story — no overflow-hidden ancestors here. */}
      <StackPanels panels={panels} />

      {/* While the case is reviewed — restated from the payment process */}
      <section className="mx-auto max-w-[1360px] px-4 pt-16 sm:px-6 sm:pt-24">
        <SectionHeading kicker="While your case is reviewed" title="What the payment process says." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Fact icon={<ClipboardList className="h-5 w-5" />} title="Funds stay held">
            You can raise a dispute before confirming receipt. Funds stay held while our team reviews
            the case.
          </Fact>
          <Fact icon={<RotateCcw className="h-5 w-5" />} title="Refunds">
            If a case is decided in the buyer's favour, AutoConnect returns the payment — to the card
            for Stripe payments, or to the M-Pesa/bank account used for manual payments. Outcomes
            depend on the review.
          </Fact>
        </div>
      </section>

      <HelpLinks current="disputes" include={["payments", "trust", "support", "terms"]} />
    </main>
  );
}

function Fact({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="rounded-[28px] border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
          {icon}
        </span>
        <h3 className="text-lg font-extrabold sm:text-xl">{title}</h3>
      </div>
      <p className="mt-4 text-base leading-7 text-muted-foreground">{children}</p>
    </article>
  );
}
