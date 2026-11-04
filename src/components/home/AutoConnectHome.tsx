import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CarFront, CirclePlay, ClipboardCheck, Gavel, HeartPulse, Import, MapPin, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductDemoReel } from "@/components/home/ProductDemoReel";
import { FeaturedShowroom } from "@/components/home/FeaturedShowroom";

const journey = [
  { id: "find", label: "Step 01: Find your fit", eyebrow: "SEARCH WITH CONTEXT", title: "Find the car that fits your life.", body: "Start with make, budget, driving needs and location. Then compare the facts each seller has supplied.", Icon: CarFront, cta: "Browse vehicles", to: "/cars" },
  { id: "evidence", label: "Step 02: See the proof", eyebrow: "EVIDENCE, NOT NOISE", title: "Know what is known before you decide.", body: "Each vehicle can show seller information, documents, inspection evidence and history records only where they are truly available.", Icon: ClipboardCheck, cta: "Explore trust", to: "/trust" },
  { id: "move", label: "Step 03: Take the next step", eyebrow: "VIEWING, RESERVATION OR BID", title: "Move forward without losing context.", body: "Arrange a viewing, discuss a vehicle with the seller, follow an import request or take part in an approved auction.", Icon: Gavel, cta: "View auctions", to: "/auctions" },
  { id: "own", label: "Step 04: Keep the story", eyebrow: "OWNERSHIP, CONNECTED", title: "Keep every important car record together.", body: "After purchase, service work, fitted parts, receipts and reminders can stay with the vehicle in My Garage.", Icon: Wrench, cta: "Open My Garage", to: "/garage" },
] as const;

const pillars = [
  { number: "01", title: "Find & compare", body: "Search local stock, explore import routes and line up options without losing the details that matter.", items: ["Vehicle discovery", "Compare side by side"], to: "/cars", Icon: Sparkles },
  { number: "02", title: "Decide with evidence", body: "Clear language separates seller-provided details from documents and evidence reviewed on the platform.", items: ["Vehicle Passport", "Viewing and enquiry"], to: "/trust", Icon: ShieldCheck },
  { number: "03", title: "Own with memory", body: "A vehicle is more useful when its maintenance and ownership trail remains easy to understand.", items: ["Service bookings", "Parts, receipts & reminders"], to: "/garage", Icon: HeartPulse },
] as const;

const questions = [
  ["Is AutoConnect a car dealer?", "No. AutoConnect is a marketplace and connected ownership workspace. Each listing identifies its seller or dealership, and you should review the listing evidence and seller terms before committing."],
  ["What does “evidence shown” mean?", "It means the listing can show documents or evidence that has been attached and, where applicable, reviewed. It never means a missing provider connection has been replaced with a made-up result."],
  ["Can I import a car through AutoConnect?", "You can start an import journey, estimate costs and follow the steps in one place. Quotes, shipping, documents and payment must reflect the real partner and transaction involved."],
  ["Can I book service or buy parts?", "Yes. My Garage connects you to service requests, parts orders, receipts and reminders for the vehicle you own."],
] as const;

/** The public home follows the user's Calm Campus design language using AutoConnect content and routes. */
export function AutoConnectHome() {
  const [active, setActive] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const step = journey[active];
  const StepIcon = step.Icon;

  return (
    <main className="overflow-hidden bg-[#fcfdfc] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="relative isolate overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_20%,rgba(45,212,191,.22),transparent_26rem),radial-gradient(circle_at_10%_65%,rgba(186,230,253,.3),transparent_30rem)]" />
        <div className="mx-auto max-w-4xl text-center">
          <p className="fintech-hero-chip mx-auto w-fit"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />AUTOMOTIVE, MADE CERTAIN</p>
          <h1 className="fintech-display mx-auto mt-7 max-w-4xl text-5xl text-slate-950 sm:text-7xl lg:text-[86px] dark:text-white">A calmer way to find, buy and look after your car.</h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8 dark:text-slate-300">AutoConnect brings the car, its available evidence, the next step and its ongoing care into one clear place.</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full bg-slate-950 px-6 font-bold text-white hover:bg-slate-800 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"><Link to="/cars">Explore vehicles <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button type="button" size="lg" variant="outline" onClick={() => setDemoOpen(true)} className="h-12 rounded-full border-slate-200 bg-white px-6 font-bold hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900"><CirclePlay className="h-4 w-4 text-teal-600" />Watch the product tour</Button>
          </div>
          <p className="mt-6 text-xs font-medium text-slate-500 dark:text-slate-400">Seller evidence shown per listing · Clear import steps · Ownership records connected to your vehicle</p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); navigate({ to: "/cars", search: { q: query } as never }); }} className="world-panel mx-auto mt-12 flex max-w-3xl flex-col gap-2 p-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3 px-3"><MapPin className="h-4 w-4 text-teal-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-400" placeholder="Describe the car you need — family SUV, hybrid, budget…" /></div>
          <Button type="submit" className="h-11 rounded-xl bg-teal-500 px-5 font-bold text-slate-950 hover:bg-teal-400">Find a car <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </section>

      <section className="border-y border-slate-100 bg-white px-4 py-20 sm:px-6 sm:py-28 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-3xl text-center"><p className="world-kicker">WHY AUTOCONNECT</p><p className="mt-6 font-serif-display text-3xl leading-tight text-slate-700 sm:text-5xl dark:text-slate-200">Every car decision has a story: the listing, the evidence, the people involved and everything that happens after the keys change hands.</p><p className="mt-7 text-base leading-7 text-slate-600 dark:text-slate-300">AutoConnect keeps that story clearer—from the first search and import calculation to service receipts in My Garage.</p></div>
      </section>

      <FeaturedShowroom />

      <section className="bg-[#f5faf9] px-4 py-20 sm:px-6 sm:py-28 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl"><div className="mx-auto max-w-2xl text-center"><p className="world-kicker">HOW IT WORKS</p><h2 className="fintech-display mt-4 text-4xl sm:text-6xl">Four clear steps. One connected car life.</h2></div>
          <div className="mt-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-stretch">
            <div className="space-y-2">{journey.map((item, index) => <button key={item.id} type="button" onClick={() => setActive(index)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${active === index ? "border-teal-300 bg-white shadow-sm dark:bg-slate-950" : "border-transparent hover:bg-white/70 dark:hover:bg-slate-800"}`}><span className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-extrabold ${active === index ? "bg-teal-500 text-slate-950" : "bg-slate-200 text-slate-500 dark:bg-slate-800"}`}>{String(index + 1).padStart(2, "0")}</span><span className="text-sm font-bold">{item.label}</span></button>)}</div>
            <div className="world-panel min-h-[360px] p-6 sm:p-9"><div className="flex items-center justify-between"><span className="world-kicker">{step.eyebrow}</span><span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">0{active + 1} / 04</span></div><div className="mt-10 grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-teal-300 shadow-xl dark:bg-teal-400 dark:text-slate-950"><StepIcon className="h-6 w-6" /></div><h3 className="fintech-display mt-7 text-4xl sm:text-5xl">{step.title}</h3><p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">{step.body}</p><Link to={step.to} className="mt-8 inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-teal-400">{step.cta}<ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 dark:bg-slate-950"><div className="mx-auto max-w-6xl"><div className="max-w-2xl"><p className="world-kicker">EVERYTHING CONNECTED</p><h2 className="fintech-display mt-4 text-4xl sm:text-6xl">The AutoConnect difference.</h2><p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">One system built around the way people really discover, decide on and own vehicles.</p></div><div className="mt-12 grid gap-4 lg:grid-cols-3">{pillars.map(({ number, title, body, items, to, Icon }) => <Link key={number} to={to} className="world-card group min-h-[300px] p-6 sm:p-7"><div className="flex items-start justify-between"><span className="font-mono text-sm font-bold text-teal-700 dark:text-teal-300">{number}</span><Icon className="h-5 w-5 text-slate-400 transition group-hover:text-teal-600" /></div><h3 className="mt-16 text-2xl font-extrabold tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p><ul className="mt-6 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">{items.map((item) => <li key={item} className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />{item}</li>)}</ul><span className="mt-7 inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">Explore <ArrowRight className="h-3.5 w-3.5" /></span></Link>)}</div></div></section>

      <section className="bg-slate-950 px-4 py-20 text-white sm:px-6 sm:py-28"><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_.85fr] lg:items-center"><div><p className="text-[11px] font-extrabold tracking-[.18em] text-teal-300">IMPORT WITH CLARITY</p><h2 className="fintech-display mt-4 text-4xl sm:text-6xl">Know the next step before you commit.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Explore import routes, estimates, requests and tracking in one place. Real quotes, documents and carrier milestones should always come from the actual partner involved.</p><Button asChild className="mt-8 h-11 rounded-full bg-teal-400 px-5 font-bold text-slate-950 hover:bg-teal-300"><Link to="/import">Explore import support <Import className="h-4 w-4" /></Link></Button></div><div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur sm:p-7"><p className="text-[10px] font-extrabold tracking-[.16em] text-teal-200">YOUR IMPORT JOURNEY</p><div className="mt-6 space-y-3">{["Choose a vehicle and destination", "Understand the estimated landed cost", "Review a real quote and documents", "Follow shipping and clearing updates"].map((item, index) => <div key={item} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-teal-400 text-xs font-extrabold text-slate-950">{index + 1}</span><span className="text-sm font-semibold text-slate-100">{item}</span></div>)}</div></div></div></section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 dark:bg-slate-950"><div className="mx-auto max-w-3xl"><p className="world-kicker text-center">GOOD QUESTIONS, HONEST ANSWERS</p><h2 className="fintech-display mt-4 text-center text-4xl sm:text-6xl">Everything should be easy to understand.</h2><Accordion type="single" collapsible className="mt-10 border-t border-slate-200 dark:border-slate-800">{questions.map(([question, answer], index) => <AccordionItem key={question} value={`question-${index}`}><AccordionTrigger className="py-5 text-base font-bold hover:no-underline">{question}</AccordionTrigger><AccordionContent className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{answer}</AccordionContent></AccordionItem>)}</Accordion></div></section>

      <section className="relative overflow-hidden bg-teal-100 px-4 py-20 sm:px-6 sm:py-28 dark:bg-teal-950"><div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-teal-300/60 blur-3xl dark:bg-teal-600/20" /><div className="relative mx-auto max-w-3xl text-center"><p className="world-kicker">READY WHEN YOU ARE</p><h2 className="fintech-display mt-4 text-4xl sm:text-6xl">Find the next car with more clarity.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-700 dark:text-slate-200">Browse local inventory, compare your options, or begin an import journey. The next step should always be understandable.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild className="h-12 rounded-full bg-slate-950 px-6 font-bold text-white hover:bg-slate-800"><Link to="/cars">Explore cars <ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline" className="h-12 rounded-full border-slate-300 bg-white px-6 font-bold text-slate-900 hover:bg-slate-50"><Link to="/seller">List a vehicle</Link></Button></div></div></section>
      <ProductDemoReel open={demoOpen} onOpenChange={setDemoOpen} />
    </main>
  );
}
