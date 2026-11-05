import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Lock,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Smartphone,
  Handshake,
  ArrowRight,
  CreditCard,
  Percent,
} from "lucide-react";
import { StackPanels, type StackPanel } from "@/components/motion/StackPanels";
import { InfoHero, SectionHeading, pillInk, pillOnDark, pillPrimary } from "@/components/info/InfoHero";
import { HelpLinks } from "@/components/info/HelpLinks";

export const Route = createFileRoute("/how-payments-work")({
  head: () => ({
    meta: [
      { title: "How Payments Work — AutoConnect" },
      {
        name: "description",
        content:
          "Payment protected: card, M-Pesa or bank transfer. Funds released after verification. See how AutoConnect handles payments, handover and disputes.",
      },
      { property: "og:title", content: "How Payments Work — AutoConnect" },
      {
        property: "og:description",
        content:
          "Payment protected, funds released after verification. Card, M-Pesa or bank transfer with admin review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowPaymentsWork,
});

type Step = { n: number; icon: ReactNode; title: string; body: ReactNode };

/** Six recorded milestones, grouped into four scroll panels. */
const milestones: {
  id: string;
  label: string;
  color: string;
  headline: string;
  steps: Step[];
}[] = [
  {
    id: "pay",
    label: "You pay",
    color: "var(--color-ac-cream)",
    headline: "Money is never sent straight to the seller.",
    steps: [
      {
        n: 1,
        icon: <Lock className="h-5 w-5" />,
        title: "Buyer pays or reserves",
        body: "Pay by card through Stripe, or reserve with M-Pesa or a bank transfer. The amount is the car price plus a 5% service fee. Money is never sent straight to the seller.",
      },
      {
        n: 2,
        icon: <Smartphone className="h-5 w-5" />,
        title: "Manual payment reviewed by admin",
        body: "M-Pesa and bank transfers are an MVP manual flow: you submit the payer name, phone and reference, and the transaction sits in review until AutoConnect confirms the funds landed. Card payments are confirmed automatically.",
      },
    ],
  },
  {
    id: "hold",
    label: "Car held",
    color: "var(--color-ac-powder)",
    headline: "The car is held for you.",
    steps: [
      {
        n: 3,
        icon: <ShieldCheck className="h-5 w-5" />,
        title: "Car moves to Under Transaction",
        body: "Once payment is confirmed the listing is marked Under Transaction so nobody else can buy it, and documents are reviewed by AutoConnect.",
      },
    ],
  },
  {
    id: "handover",
    label: "Handover",
    color: "var(--color-ac-apricot)",
    headline: "You get the car and papers first.",
    steps: [
      {
        n: 4,
        icon: <Handshake className="h-5 w-5" />,
        title: "Seller prepares handover",
        body: "The seller gets the car, keys and paperwork ready and marks the handover as ready. You arrange collection or delivery.",
      },
      {
        n: 5,
        icon: <CheckCircle2 className="h-5 w-5" />,
        title: "Buyer confirms receipt",
        body: "After you have the car and documents, you confirm receipt. This starts the final review.",
      },
    ],
  },
  {
    id: "release",
    label: "Release",
    color: "var(--color-ac-stone)",
    headline: "Funds released after verification.",
    steps: [
      {
        n: 6,
        icon: <Banknote className="h-5 w-5" />,
        title: "Funds released after verification",
        body: "AutoConnect releases the car price to the seller — via Stripe Connect (typically 2-5 business days) or a manual payout for M-Pesa and bank deals. The 5% service fee covers verification, payment handling and dispute support.",
      },
    ],
  },
];

function HowPaymentsWork() {
  const panels: StackPanel[] = milestones.map((m) => ({
    id: `pay-${m.id}`,
    label: m.label,
    color: m.color,
    content: (
      <div className="grid h-full content-start gap-5 overflow-y-auto lg:grid-cols-[1fr_1fr] lg:content-center lg:gap-12">
        <h3 className="font-brand text-3xl sm:text-5xl lg:text-7xl">{m.headline}</h3>
        <ol className="space-y-3 sm:space-y-4">
          {m.steps.map((step) => (
            <li key={step.n} className="rounded-2xl bg-white/55 p-4 sm:rounded-3xl sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-ink text-white">
                  {step.icon}
                </span>
                <div className="min-w-0">
                  <p className="brand-kicker text-ac-ink/55">Step {step.n} of 6</p>
                  <p className="text-base font-extrabold leading-tight sm:text-lg">{step.title}</p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ac-ink/75 sm:text-base sm:leading-7">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    ),
  }));

  return (
    <main className="bg-background text-foreground">
      <InfoHero
        kicker={
          <>
            <Lock className="h-4 w-4" /> Payment protected
          </>
        }
        title={
          <>
            How payments work on <span className="text-ac-accent">AutoConnect.</span>
          </>
        }
        intro="AutoConnect holds the payment while documents are reviewed and the car changes hands. Funds are released after verification."
        image="/images/hero-driving-sedan.jpg"
        imageAlt="A sedan driving on an open road"
        footer={
          <ul className="grid gap-4 text-sm sm:grid-cols-3">
            <HeroFact icon={<CreditCard className="h-4 w-4" />} title="Card, M-Pesa or bank transfer" />
            <HeroFact icon={<Percent className="h-4 w-4" />} title="Car price plus a 5% service fee" />
            <HeroFact icon={<ShieldCheck className="h-4 w-4" />} title="Released after verification" />
          </ul>
        }
      >
        <Link to="/cars" className={pillPrimary}>
          Browse cars <ArrowRight className="h-4 w-4" />
        </Link>
        <a href="#fee-example" className={pillOnDark}>
          See a fee example
        </a>
      </InfoHero>

      <section className="mx-auto max-w-[1360px] px-4 pb-8 pt-16 sm:px-6 sm:pt-24">
        <SectionHeading
          kicker="Six recorded milestones"
          title="From payment to release, one step at a time."
          lead="Every payment follows the same recorded path, so you always know what has been confirmed and what happens next."
        />
      </section>

      {/* Pinned milestone story — no overflow-hidden ancestors here. */}
      <StackPanels panels={panels} />

      {/* If something goes wrong */}
      <section className="mx-auto max-w-[1360px] px-4 pt-16 sm:px-6 sm:pt-24">
        <SectionHeading kicker="If something is not right" title="Your money stays held while we review." />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <SubtleStep n={7} icon={<AlertTriangle className="h-5 w-5" />} title="If there's a dispute…">
            You can raise a dispute before confirming receipt. Funds stay held while our team reviews
            the case.
            <Link
              to="/disputes"
              className="mt-4 inline-flex min-h-11 items-center gap-1 font-bold text-foreground underline-offset-4 hover:underline"
            >
              Read the dispute process <ArrowRight className="h-4 w-4" />
            </Link>
          </SubtleStep>
          <SubtleStep n={8} icon={<RotateCcw className="h-5 w-5" />} title="Refunds">
            If a case is decided in the buyer's favour, AutoConnect returns the payment — to the card
            for Stripe payments, or to the M-Pesa/bank account used for manual payments. Outcomes
            depend on the review.
          </SubtleStep>
        </div>
      </section>

      {/* Fee example */}
      <section
        id="fee-example"
        aria-labelledby="fee-example-title"
        className="mx-auto max-w-[1360px] scroll-mt-24 px-4 pt-16 sm:px-6 sm:pt-24"
      >
        <div className="grid gap-8 rounded-[28px] border border-border bg-card p-6 sm:rounded-[36px] sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:p-14">
          <div>
            <p className="brand-kicker text-muted-foreground">Worked example</p>
            <h2 id="fee-example-title" className="font-brand mt-4 text-3xl sm:text-5xl">
              Example: KES 3,850,000 car
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              The seller receives the full car price after release. The 5% service fee covers
              verification, payment handling and dispute support.
            </p>
          </div>
          <dl className="rounded-3xl bg-muted/60 p-5 text-sm sm:p-7 sm:text-base">
            <Row label="Car price" value="KES 3,850,000" />
            <Row label="Service fee (5%)" value="KES 192,500" />
            <div className="my-3 border-t border-dashed border-border" />
            <Row label="Buyer pays" value="KES 4,042,500" bold />
            <div className="my-3 border-t border-border" />
            <Row label="Seller receives (after release)" value="KES 3,850,000" />
            <Row label="AutoConnect keeps" value="KES 192,500" />
          </dl>
        </div>
      </section>

      <section className="mx-auto flex max-w-[1360px] flex-col items-start gap-4 px-4 pt-16 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-24">
        <h2 className="font-brand text-3xl sm:text-4xl">Ready to find your car?</h2>
        <Link to="/cars" className={pillInk}>
          Browse cars <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <HelpLinks current="payments" />
    </main>
  );
}

function HeroFact({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <li className="flex items-center gap-3 text-white/85">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-ac-accent">
        {icon}
      </span>
      <span className="font-semibold">{title}</span>
    </li>
  );
}

function SubtleStep({
  n,
  icon,
  title,
  children,
}: {
  n: number;
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex flex-col rounded-[28px] border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
          {icon}
        </span>
        <div>
          <p className="brand-kicker text-muted-foreground">Step {n}</p>
          <h3 className="text-lg font-extrabold sm:text-xl">{title}</h3>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-start text-base leading-7 text-muted-foreground">
        {children}
      </div>
    </article>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className={bold ? "font-bold text-foreground" : "text-muted-foreground"}>{label}</dt>
      <dd
        className={
          bold ? "font-brand text-right text-2xl text-foreground sm:text-3xl" : "text-right font-semibold"
        }
      >
        {value}
      </dd>
    </div>
  );
}
