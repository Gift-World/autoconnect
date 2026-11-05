import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CirclePlay,
  ClipboardCheck,
  FileClock,
  Import,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductDemoReel } from "@/components/home/ProductDemoReel";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";
import { RevealText } from "@/components/motion/RevealText";
import { StackPanels, type StackPanel } from "@/components/motion/StackPanels";
import { ScrollCar3D, type CarCallout } from "@/components/motion/ScrollCar3D";
import { FloatingStack, type FloatingCard } from "@/components/motion/FloatingStack";
import { EvidenceMock, GarageMock, PaymentMock, SearchMock } from "@/components/home/ProductMocks";

const MOCKS = { find: SearchMock, evidence: EvidenceMock, move: PaymentMock, own: GarageMock } as const;

const journey = [
  {
    id: "find",
    label: "Find your fit",
    color: "var(--color-ac-cream)",
    title: "Find the car that fits your life.",
    body: "Start with make, budget, driving needs and location. Then compare the facts each seller has supplied.",
    cta: "Browse vehicles",
    to: "/cars",
  },
  {
    id: "evidence",
    label: "See the proof",
    color: "var(--color-ac-powder)",
    title: "Know what is known before you decide.",
    body: "Each vehicle can show seller information, documents, inspection evidence and history records only where they are truly available.",
    cta: "Explore trust",
    to: "/trust",
  },
  {
    id: "move",
    label: "Take the next step",
    color: "var(--color-ac-apricot)",
    title: "Move forward without losing context.",
    body: "Arrange a viewing, discuss a vehicle with the seller, follow an import request or take part in an approved auction.",
    cta: "View auctions",
    to: "/auctions",
  },
  {
    id: "own",
    label: "Keep the story",
    color: "var(--color-ac-stone)",
    title: "Keep every important car record together.",
    body: "After purchase, service work, fitted parts, receipts and reminders can stay with the vehicle in My Garage.",
    cta: "Open My Garage",
    to: "/garage",
  },
] as const;

const callouts: CarCallout[] = [
  { title: "Vehicle Passport", body: "Ownership, service and history records that travel with the car.", Icon: FileClock },
  { title: "Inspection evidence", body: "Checklists and reports shown only when they have really been attached.", Icon: ClipboardCheck },
  { title: "Seller identity", body: "Every listing names its seller or dealership, with verification status.", Icon: ShieldCheck },
  { title: "Clear payment steps", body: "See how reservations, deposits and payments work before you commit.", Icon: Landmark },
];

const difference: FloatingCard[] = [
  {
    eyebrow: "Find & compare",
    title: "Search with context.",
    body: "Search local stock, explore import routes and line up options side by side without losing the details that matter.",
    color: "var(--color-ac-apricot)",
    to: "/compare",
  },
  {
    eyebrow: "Decide with evidence",
    title: "Proof, not promises.",
    body: "Clear language separates seller-provided details from documents and evidence reviewed on the platform.",
    color: "var(--color-ac-powder)",
    to: "/trust",
  },
  {
    eyebrow: "Pay with clarity",
    title: "Know where your money is.",
    body: "Follow each payment step, see what has been confirmed and raise a dispute if something is not right.",
    color: "var(--color-ac-cream)",
    to: "/how-payments-work",
  },
  {
    eyebrow: "Own with memory",
    title: "Care that stays connected.",
    body: "Service bookings, parts, receipts and reminders stay with the vehicle you own.",
    color: "var(--color-ac-stone)",
    to: "/services",
  },
];

const questions = [
  ["Is AutoConnect a car dealer?", "No. AutoConnect is a marketplace and connected ownership workspace. Each listing identifies its seller or dealership, and you should review the listing evidence and seller terms before committing."],
  ["What does “evidence shown” mean?", "It means the listing can show documents or evidence that has been attached and, where applicable, reviewed. It never means a missing provider connection has been replaced with a made-up result."],
  ["Can I import a car through AutoConnect?", "You can start an import journey, estimate costs and follow the steps in one place. Quotes, shipping, documents and payment must reflect the real partner and transaction involved."],
  ["Can I book service or buy parts?", "Yes. My Garage connects you to service requests, parts orders, receipts and reminders for the vehicle you own."],
] as const;

const searchIdeas = ["Family SUV under 4M", "Hybrid for city driving", "7-seater with low mileage"];

/** Public home: one story, told in scroll — find, verify, move forward, own. */
export function AutoConnectHome() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [playVideo, setPlayVideo] = useState(false);

  // Phones and data-saver users get the still poster instead of a 1.6 MB video.
  useEffect(() => {
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPlayVideo(window.matchMedia("(min-width: 768px)").matches && !saveData && !reduceMotion);
  }, []);
  const navigate = useNavigate();

  const search = (q: string) => navigate({ to: "/cars", search: { q } as never });

  const panels: StackPanel[] = journey.map((step) => {
    const Mock = MOCKS[step.id];
    return {
      id: step.id,
      label: step.label,
      color: step.color,
      content: (
        <div className="flex h-full flex-col gap-4 lg:grid lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-10">
          <div>
            <h3 className="font-brand text-3xl sm:text-5xl lg:text-7xl">{step.title}</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-ac-ink/75 sm:mt-5 sm:text-lg sm:leading-7">{step.body}</p>
            <Link
              to={step.to}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-ac-ink px-5 text-sm font-bold text-white transition hover:gap-3 sm:mt-7"
            >
              {step.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden [mask-image:linear-gradient(to_bottom,black_75%,transparent)] lg:h-full lg:flex-none lg:overflow-visible lg:[mask-image:none]">
            <div className="origin-top scale-[.82] sm:scale-90 lg:flex lg:h-full lg:scale-100 lg:items-center">
              <Mock />
            </div>
          </div>
        </div>
      ),
    };
  });

  return (
    <main className="bg-background text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate min-h-[calc(100svh-6rem)] overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          {playVideo ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/hero-driving-suv.jpg"
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            >
              <source src="/videos/hero-driving-car.mp4" type="video/mp4" />
            </video>
          ) : (
            <img
              src="/images/hero-driving-suv.jpg"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(10,15,14,.88),rgba(10,15,14,.35)_60%,rgba(10,15,14,.55))]" />

          <div className="flex min-h-[calc(100svh-6rem)] flex-col justify-end gap-10 p-6 sm:p-10 lg:p-14">
            <div className="max-w-4xl">
              <p className="brand-kicker text-ac-accent">Automotive, made certain</p>
              <h1 className="font-brand mt-5 text-5xl sm:text-7xl lg:text-[104px]">
                What if your next car came with <span className="text-ac-accent">its whole story?</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                AutoConnect brings the car, its available evidence, the next step and its ongoing care into one clear place.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  search(query);
                }}
                className="w-full max-w-2xl"
              >
                <label htmlFor="hero-search" className="mb-2 flex items-center gap-2 text-xs font-bold text-white/70">
                  <Sparkles className="h-3.5 w-3.5 text-ac-accent" /> Describe it in your own words. AI does the filtering.
                </label>
                <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur-xl sm:flex-row">
                  <input
                    id="hero-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="h-12 min-w-0 flex-1 bg-transparent px-3 text-base font-medium text-white outline-none placeholder:text-white/50"
                    placeholder="Family SUV, hybrid, budget…"
                  />
                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
                  >
                    Find a car <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {searchIdeas.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => search(idea)}
                      className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-ac-accent hover:text-white"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </form>

              <button
                type="button"
                onClick={() => setDemoOpen(true)}
                className="group flex items-center gap-4 rounded-2xl bg-ac-accent p-2 pr-5 text-left text-ac-ink transition hover:brightness-110"
              >
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-ac-ink text-ac-accent transition group-hover:scale-105">
                  <CirclePlay className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold">Watch the product tour</span>
                  <span className="block text-xs font-semibold text-ac-ink/70">AutoConnect in 42 seconds</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section className="px-4 py-24 sm:px-6 sm:py-36">
        <div className="mx-auto max-w-5xl text-center">
          <RevealText
            className="justify-center font-brand text-3xl leading-[1.08] sm:text-5xl lg:text-6xl"
            text="Every car decision has a story. The listing, the evidence, the people involved and everything that happens after the keys change hands. AutoConnect keeps that story clear."
          />
        </div>
      </section>

      {/* 3D evidence stage */}
      <ScrollCar3D
        kicker="Evidence, not noise"
        title="Every car, seen from every side."
        callouts={callouts}
        images={[
          { src: "/images/hero-driving-suv.jpg", alt: "An SUV on the road" },
          { src: "/images/providers/nairobi-vehicle-inspection.jpg", alt: "A vehicle being inspected" },
          { src: "/images/hero-driving-sedan.jpg", alt: "A sedan on the road" },
          { src: "/images/providers/nairobi-hybrid-workshop.jpg", alt: "A hybrid vehicle in a workshop" },
        ]}
      />

      {/* Journey */}
      <section className="pt-24 sm:pt-32">
        <div className="mx-auto mb-10 max-w-[1360px] px-4 sm:px-6">
          <p className="brand-kicker text-muted-foreground">How it works</p>
          <h2 className="font-brand mt-4 max-w-3xl text-4xl sm:text-6xl">Four clear steps. One connected car life.</h2>
        </div>
        <StackPanels panels={panels} />
      </section>

      {/* Live inventory */}
      <FeaturedShowroom />

      {/* The difference */}
      <FloatingStack
        image="/images/hero-driving-crossover.jpg"
        imageAlt="A crossover driving on an open road"
        heading={
          <>
            The AutoConnect <span className="text-ac-accent">difference.</span>
          </>
        }
        cards={difference}
      />

      {/* Import */}
      <section className="px-3 py-3 sm:px-5 sm:py-5">
        <div className="grid gap-10 rounded-[28px] bg-ac-ink p-6 text-white sm:rounded-[36px] sm:p-10 lg:grid-cols-[1fr_.85fr] lg:items-center lg:p-14">
          <div>
            <p className="brand-kicker text-ac-accent">Import with clarity</p>
            <h2 className="font-brand mt-4 text-4xl sm:text-6xl">Know the next step before you commit.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70">
              Explore import routes, estimates, requests and tracking in one place. Real quotes, documents and carrier milestones should always come from the actual partner involved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/import" className="inline-flex h-12 items-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:brightness-110">
                Explore import support <Import className="h-4 w-4" />
              </Link>
              <Link to="/import-tracker" className="inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-sm font-bold text-white transition hover:border-ac-accent">
                Track an import
              </Link>
            </div>
          </div>
          <ol className="space-y-3">
            {["Choose a vehicle and destination", "Understand the estimated landed cost", "Review a real quote and documents", "Follow shipping and clearing updates"].map((item, index) => (
              <li key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <span className="font-brand grid h-10 w-10 place-items-center rounded-full bg-ac-accent text-sm text-ac-ink">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-semibold text-white/90">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-24 sm:px-6 sm:py-32">
        <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="brand-kicker text-muted-foreground">Good questions, honest answers</p>
            <h2 className="font-brand mt-4 text-4xl sm:text-6xl">Everything should be easy to understand.</h2>
          </div>
          <Accordion type="single" collapsible className="border-t border-border">
            {questions.map(([question, answer], index) => (
              <AccordionItem key={question} value={`question-${index}`}>
                <AccordionTrigger className="py-6 text-left text-lg font-bold hover:no-underline">{question}</AccordionTrigger>
                <AccordionContent className="max-w-2xl text-base leading-7 text-muted-foreground">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-3 pb-3 sm:px-5 sm:pb-5">
        <div className="rounded-[28px] bg-ac-accent p-8 text-ac-ink sm:rounded-[36px] sm:p-14 lg:p-20">
          <h2 className="font-brand max-w-4xl text-5xl sm:text-7xl lg:text-8xl">Start where you are. Drive where you're going.</h2>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/cars" className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ac-ink px-6 text-sm font-extrabold text-white transition hover:gap-3">
              Explore cars <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/seller" className="inline-flex h-12 items-center justify-center rounded-full border-2 border-ac-ink px-6 text-sm font-extrabold transition hover:bg-ac-ink hover:text-white">
              List a vehicle
            </Link>
          </div>
        </div>
      </section>

      <ProductDemoReel open={demoOpen} onOpenChange={setDemoOpen} />
    </main>
  );
}
