import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CarFront, FileCheck2, Gavel, Wrench } from "lucide-react";

const chapters = [
  {
    number: "01",
    title: "Find the fit",
    body: "Start with the car and the constraints that matter to you—not a maze of filters.",
    to: "/cars",
    action: "Browse vehicles",
    Icon: CarFront,
    accent: "from-teal-400 to-cyan-300",
  },
  {
    number: "02",
    title: "See the proof",
    body: "Read seller-supplied facts and only the evidence actually attached to that listing.",
    to: "/trust",
    action: "Explore trust",
    Icon: FileCheck2,
    accent: "from-sky-400 to-indigo-300",
  },
  {
    number: "03",
    title: "Move with clarity",
    body: "Compare, arrange a viewing, reserve, or bid with the next step clearly shown.",
    to: "/auctions",
    action: "See auctions",
    Icon: Gavel,
    accent: "from-amber-300 to-orange-300",
  },
  {
    number: "04",
    title: "Keep the story",
    body: "When it becomes your car, services, parts and receipts stay connected in My Garage.",
    to: "/garage",
    action: "Open My Garage",
    Icon: Wrench,
    accent: "from-emerald-400 to-teal-300",
  },
] as const;

/**
 * A product story that uses depth to show the relationship between journeys.
 * It is deliberately CSS-first: motion is optional, readable and does not hide actions.
 */
export function ConnectedJourney() {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const onScroll = () => {
      const rect = node.getBoundingClientRect();
      const progress = Math.min(0.999, Math.max(0, (window.innerHeight * 0.72 - rect.top) / Math.max(rect.height, 1)));
      setActive(Math.min(chapters.length - 1, Math.floor(progress * chapters.length)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeChapter = chapters[active];

  return (
    <section ref={section} className="relative overflow-hidden bg-[#f7faf9] py-20 text-slate-950 sm:py-28 dark:bg-slate-950 dark:text-slate-50">
      <div className="world-grid pointer-events-none absolute inset-0 opacity-60 dark:opacity-20" />
      <div className="pointer-events-none absolute left-[-10rem] top-1/3 h-80 w-80 rounded-full bg-teal-200/45 blur-3xl dark:bg-teal-800/20" />
      <div className="pointer-events-none absolute bottom-0 right-[-8rem] h-80 w-80 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-800/20" />

      <div className="container-page relative grid gap-12 lg:grid-cols-[.82fr_1.18fr] lg:items-start">
        <div className="lg:sticky lg:top-28">
          <p className="world-kicker">One connected car life</p>
          <h2 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-[.98] tracking-[-0.055em] sm:text-6xl">
            The car is only the beginning.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-600 dark:text-slate-300">
            AutoConnect should feel like one calm system around a major decision—not seven separate tools stitched together.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Scroll to follow the journey
          </div>
        </div>

        <div className="space-y-5">
          <div className="world-orbit-stage relative min-h-[360px] sm:min-h-[410px]">
            <div className="world-orbit-card absolute inset-0 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 shadow-[0_34px_80px_-38px_rgba(15,23,42,.7)] dark:border-slate-700">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,.42),transparent_20rem),linear-gradient(135deg,#101c2e,#0c1220_54%,#183c42)]" />
              <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="fintech-orb pointer-events-none -right-14 top-10 h-40 w-40 opacity-90" />
              <div className="fintech-orb pointer-events-none bottom-[-1.5rem] left-[40%] h-16 w-16 opacity-70" />
              <div className="relative flex h-full flex-col justify-between p-6 text-white sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.18em] backdrop-blur">AUTOCONNECT FLOW</span>
                  <span className="font-mono text-xs text-teal-100">{activeChapter.number} / 04</span>
                </div>
                <div>
                  <div className={`mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${activeChapter.accent} text-slate-950 shadow-xl`}>
                    <activeChapter.Icon className="h-6 w-6" />
                  </div>
                  <p className="text-[11px] font-bold tracking-[.17em] text-teal-200">CURRENT CHAPTER</p>
                  <h3 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.05em] sm:text-5xl">{activeChapter.title}</h3>
                  <p className="mt-4 max-w-md text-sm leading-6 text-slate-200 sm:text-base">{activeChapter.body}</p>
                </div>
                <div className="flex items-center gap-2">
                  {chapters.map((chapter, index) => (
                    <span key={chapter.number} className={`h-1.5 rounded-full transition-all duration-500 ${index === active ? "w-12 bg-teal-300" : "w-5 bg-white/25"}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -right-2 rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:right-6">
              <p className="text-[10px] font-bold tracking-[.14em] text-slate-400">STATUS</p>
              <p className="mt-1 text-xs font-extrabold text-slate-800 dark:text-white">One vehicle. One record.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {chapters.map((chapter, index) => {
              const Icon = chapter.Icon;
              const selected = index === active;
              return (
                <Link
                  key={chapter.number}
                  to={chapter.to}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  className={`world-card group p-5 outline-none dark:bg-slate-900 ${selected ? "ring-2 ring-teal-400/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300">{chapter.number}</span>
                    <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-teal-600" />
                  </div>
                  <h3 className="mt-7 text-lg font-extrabold tracking-[-0.03em]">{chapter.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{chapter.body}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">{chapter.action}<ArrowUpRight className="h-3.5 w-3.5" /></span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
