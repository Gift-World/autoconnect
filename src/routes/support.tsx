import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Car,
  CreditCard,
  LifeBuoy,
  Search,
  ShieldAlert,
  UserRound,
  X,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpLinks } from "@/components/info/HelpLinks";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — AutoConnect" }] }),
  component: SupportPage,
});

/** Top questions — every answer restates copy published elsewhere on the site. */
const QUESTIONS: { q: string; a: string; to: string; cta: string }[] = [
  {
    q: "How do payments work?",
    a: "AutoConnect holds the payment while documents are reviewed and the car changes hands. Funds are released after verification. Pay by card through Stripe, or reserve with M-Pesa or a bank transfer.",
    to: "/how-payments-work",
    cta: "See the payment process",
  },
  {
    q: "How do I raise a dispute?",
    a: "Raise it before confirming handover if the vehicle, title, evidence, or agreed condition materially differs from the recorded transaction. Add clear photos, inspection notes and the exact part of the listing or agreement that does not match.",
    to: "/disputes",
    cta: "Read the dispute process",
  },
  {
    q: "Someone asked me to pay outside AutoConnect. What should I do?",
    a: "Do not send money outside the recorded transaction workflow. Report any request for an off-platform payment through the support path, and keep all messages and evidence.",
    to: "/trust",
    cta: "Visit the trust center",
  },
  {
    q: "What does a verified seller label mean?",
    a: "Seller profiles progress through account, business, and document review. A verified label should only be shown after that review is complete.",
    to: "/trust",
    cta: "How evidence is shown",
  },
  {
    q: "I can't sign in or forgot my password.",
    a: "Use the account sign-in and verification screens for profile and seller verification issues. You can also sign in with your phone number and a one-time code.",
    to: "/login",
    cta: "Go to sign in",
  },
  {
    q: "What does it cost to sell a car?",
    a: "Private sellers can start on the Free Tier with up to 3 active listings. Pro Dealer and Enterprise Yard plans add more listings and dealer tools.",
    to: "/pricing",
    cta: "Compare seller plans",
  },
];

/** Contact channels — the original support sections, verbatim. */
const CHANNELS: { title: string; body: string; Icon: LucideIcon; to: string; cta: string; urgent?: boolean }[] = [
  {
    title: "Vehicle and seller questions",
    body: "Use the listing inquiry form. Ask for the vehicle passport, inspection evidence, ownership information, and viewing arrangements before paying.",
    Icon: Car,
    to: "/cars",
    cta: "Find the listing",
  },
  {
    title: "Payment and handover",
    body: "Use the transaction workspace for payment references, handover steps, and disputes. Never share a payment reference or personal documents over an unverified channel.",
    Icon: CreditCard,
    to: "/account/purchases",
    cta: "Open my purchases",
  },
  {
    title: "Account access",
    body: "Use the account sign-in and verification screens for profile and seller verification issues.",
    Icon: UserRound,
    to: "/login",
    cta: "Sign in",
  },
  {
    title: "Urgent safety concern",
    body: "Stop the transaction, retain all messages and evidence, and use the dispute workflow before confirming vehicle receipt.",
    Icon: ShieldAlert,
    to: "/disputes",
    cta: "Dispute workflow",
    urgent: true,
  },
];

const matches = (needle: string, ...haystack: string[]) =>
  haystack.some((text) => text.toLowerCase().includes(needle));

function SupportPage() {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();

  const questions = useMemo(
    () => (needle ? QUESTIONS.filter((item) => matches(needle, item.q, item.a)) : QUESTIONS),
    [needle],
  );
  const channels = useMemo(
    () => (needle ? CHANNELS.filter((item) => matches(needle, item.title, item.body)) : CHANNELS),
    [needle],
  );
  const nothing = needle && questions.length === 0 && channels.length === 0;

  return (
    <main className="bg-background text-foreground">
      {/* Search first */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="rounded-[28px] bg-ac-ink px-6 py-12 text-white sm:rounded-[36px] sm:px-10 sm:py-20 lg:px-14">
          <div className="mx-auto max-w-3xl">
            <p className="brand-kicker flex items-center gap-2 text-ac-accent">
              <LifeBuoy className="h-4 w-4" /> Support
            </p>
            <h1 className="font-brand mt-5 text-4xl sm:text-6xl lg:text-7xl">How can we help?</h1>
            <p className="mt-6 text-base leading-7 text-white/75 sm:text-lg">
              <strong className="font-semibold text-white">Get help through the recorded workflow.</strong>{" "}
              For a vehicle question, use the inquiry form on that listing. For a live transaction,
              use the transaction workspace so the relevant evidence and history stay connected to
              your case.
            </p>
            <form
              role="search"
              onSubmit={(event) => event.preventDefault()}
              className="mt-8"
            >
              <label htmlFor="support-search" className="sr-only">
                Search help topics
              </label>
              <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 text-ac-ink shadow-lg">
                <Search className="h-5 w-5 shrink-0 text-ac-ink/50" />
                <input
                  id="support-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search payments, disputes, sign in…"
                  className="h-12 min-w-0 flex-1 bg-transparent text-base font-medium outline-none placeholder:text-ac-ink/45"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ac-ink/60 hover:bg-ac-ink/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-4 sm:px-6">
        {nothing && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-dashed border-border bg-card p-8 text-center">
            <p className="text-lg font-bold">No help topics match “{query.trim()}”.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a shorter word such as “payment”, “dispute” or “account”.
            </p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-5 inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-bold hover:border-foreground/40"
            >
              Show all topics
            </button>
          </div>
        )}

        {/* Top questions */}
        {questions.length > 0 && (
          <section aria-labelledby="top-questions" className="mx-auto max-w-3xl pt-12 sm:pt-16">
            <h2 id="top-questions" className="font-brand text-2xl sm:text-4xl">
              {needle ? "Matching questions" : "Top questions"}
            </h2>
            <Accordion type="single" collapsible className="mt-6 rounded-3xl border border-border bg-card px-5 sm:px-7">
              {questions.map((item, index) => (
                <AccordionItem
                  key={item.q}
                  value={`q-${index}`}
                  className={index === questions.length - 1 ? "border-b-0" : "border-border"}
                >
                  <AccordionTrigger className="min-h-14 gap-4 py-5 text-base font-bold hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-base leading-7 text-muted-foreground">{item.a}</p>
                    <Link
                      to={item.to as never}
                      className="mt-3 inline-flex min-h-11 items-center gap-1 font-bold text-foreground underline-offset-4 hover:underline"
                    >
                      {item.cta} <ArrowRight className="h-4 w-4" />
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* Contact channels */}
        {channels.length > 0 && (
          <section aria-labelledby="channels" className="pt-16 sm:pt-24">
            <div className="max-w-3xl">
              <p className="brand-kicker text-muted-foreground">Still need help?</p>
              <h2 id="channels" className="font-brand mt-4 text-3xl sm:text-5xl">
                Pick the right channel.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Using the channel linked to your car or transaction keeps the evidence and history
                together.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:gap-4 md:grid-cols-2">
              {channels.map(({ title, body, Icon, to, cta, urgent }) => (
                <article
                  key={title}
                  className={
                    urgent
                      ? "flex flex-col rounded-[28px] bg-ac-apricot p-6 text-ac-ink sm:p-8"
                      : "flex flex-col rounded-[28px] border border-border bg-card p-6 sm:p-8"
                  }
                >
                  <span
                    className={
                      urgent
                        ? "grid h-12 w-12 place-items-center rounded-2xl bg-ac-ink text-white"
                        : "grid h-12 w-12 place-items-center rounded-2xl bg-muted text-foreground"
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
                  <p className={urgent ? "mt-2 flex-1 text-base leading-7 text-ac-ink/75" : "mt-2 flex-1 text-base leading-7 text-muted-foreground"}>
                    {body}
                  </p>
                  <Link
                    to={to as never}
                    className={
                      urgent
                        ? "mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-ac-ink px-5 text-sm font-bold text-white"
                        : "mt-6 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-5 text-sm font-bold text-foreground hover:border-foreground/40"
                    }
                  >
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      <HelpLinks current="support" include={["trust", "payments", "disputes", "terms"]} />
    </main>
  );
}
