import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Compass, Sparkles, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

type TourStep = { kicker: string; title: string; body: string; to?: string; action?: string };

function stepsFor(pathname: string, role: string): TourStep[] {
  if (pathname.startsWith("/admin")) return [
    { kicker: "ADMIN TOUR", title: "Start with the queues", body: "Review listings, documents, provider claims and vehicle evidence before anything becomes public." },
    { kicker: "ADMIN TOUR", title: "Control the marketplace", body: "Auction review protects timed sales. Transactions and disputes are for recorded decisions, not guesses.", to: "/admin/auctions", action: "Open auction review" },
    { kicker: "ADMIN TOUR", title: "Leave a trail", body: "Use reasons and notes for approvals, rejections and cancellations. The audit log is your operational memory." },
  ];
  if (pathname.startsWith("/seller")) return [
    { kicker: "SELLER TOUR", title: "Your seller control room", body: "Create accurate listings, then follow the review status before promoting anything." },
    { kicker: "SELLER TOUR", title: "Evidence earns trust", body: "Upload documents and vehicle evidence. It stays private until an administrator verifies it.", to: "/seller/evidence", action: "Open evidence" },
    { kicker: "SELLER TOUR", title: "Use auctions carefully", body: "A timed auction or flash offer requires an approved vehicle and admin approval before it becomes public.", to: "/seller/auctions", action: "Open auctions" },
  ];
  if (pathname.startsWith("/service-bookings") || pathname.startsWith("/services")) return [
    { kicker: "CARE TOUR", title: "Choose the right kind of help", body: "A garage is a workshop, a mechanic is a specialist, and an inspection provider checks condition independently." },
    { kicker: "CARE TOUR", title: "Keep work connected", body: "Choose a vehicle from My Garage so the request, quote, receipt and future service history stay together.", to: "/garage", action: "Open My Garage" },
    { kicker: "CARE TOUR", title: "Follow the real status", body: "A request becomes a quote, then your approval, then completed work and a receipt. Nothing should jump ahead." },
  ];
  if (pathname.startsWith("/garage") || pathname.startsWith("/passport")) return [
    { kicker: "GARAGE TOUR", title: "Your vehicle home", body: "Add the real vehicle first. Mileage, receipts, parts and service records should all attach to it." },
    { kicker: "GARAGE TOUR", title: "Use reminders", body: "Record mileage and upcoming work. This makes the Garage useful after the day you buy the car." },
    { kicker: "GARAGE TOUR", title: "Check the passport", body: "Evidence is shown only when it exists. Missing evidence stays marked missing rather than being assumed." },
  ];
  if (pathname.startsWith("/auctions")) return [
    { kicker: "AUCTION TOUR", title: "Read before you bid", body: "Check the deadline, current price and evidence. Other bidders see a masked alias, never your full name." },
    { kicker: "AUCTION TOUR", title: "Bid with intention", body: "A valid bid is recorded against your account. Winning creates a short reservation, not a payment confirmation." },
    { kicker: "AUCTION TOUR", title: "Know the next step", body: "The reservation remains payment pending until real provider or bank evidence is verified." },
  ];
  if (pathname.startsWith("/import") || pathname.startsWith("/import-tracker")) return [
    { kicker: "IMPORT TOUR", title: "Start with an estimate", body: "Destination costs are estimates until a supplier and carrier confirm the actual order." },
    { kicker: "IMPORT TOUR", title: "Track what is real", body: "An order tracker shows only milestones, documents and dates attached to your purchase record." },
    { kicker: "IMPORT TOUR", title: "Ask before assuming", body: "If a carrier or clearing update is not present, the site should say it is missing." },
  ];
  return [
    { kicker: role === "buyer" ? "BUYER TOUR" : "WELCOME TOUR", title: "Find the right starting point", body: "Search real listings, compare the total picture, and look for evidence before you enquire." },
    { kicker: "BUYER TOUR", title: "Keep decisions connected", body: "Save a vehicle, send an enquiry, arrange viewing, then keep ownership records in My Garage.", to: "/garage", action: "Open My Garage" },
    { kicker: "BUYER TOUR", title: "Use status, not promises", body: "A reservation is not payment confirmation. Missing evidence is not a verified claim." },
  ];
}

export function AppTour() {
  const router = useRouter();
  const navigate = useNavigate();
  const { activeRole } = useAuth();
  const pathname = router.state.location.pathname;
  const steps = useMemo(() => stepsFor(pathname, activeRole), [pathname, activeRole]);
  const tourKey = `autoconnect-tour-seen:${activeRole}:${pathname.split("/").slice(1, 2).join("/") || "home"}`;
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
    try { setOpen(!sessionStorage.getItem(tourKey)); } catch { setOpen(false); }
  }, [tourKey]);

  const close = () => {
    try { sessionStorage.setItem(tourKey, "1"); } catch { /* no storage available */ }
    setOpen(false);
  };
  const step = steps[index];
  const next = () => index === steps.length - 1 ? close() : setIndex((value) => value + 1);
  const go = () => { if (step.to) void navigate({ to: step.to as never }); next(); };

  return <>
    <Button type="button" onClick={() => { setIndex(0); setOpen(true); }} className="fixed bottom-5 left-4 z-[70] h-11 rounded-full border border-teal-300 bg-white px-4 text-slate-900 shadow-lg shadow-teal-950/15 hover:bg-teal-50 dark:bg-card dark:text-foreground sm:left-6" variant="outline">
      <Compass className="mr-2 h-4 w-4 text-teal-600" /> Guide me
    </Button>
    {open && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/30 p-4 backdrop-blur-[2px] sm:items-center" role="dialog" aria-modal="true" aria-label="AutoConnect guided tour">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-teal-100 bg-card shadow-2xl dark:border-teal-500/25">
        <div className="bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-6 text-slate-950"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold tracking-[.18em]">{step.kicker}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight">{step.title}</h2></div><Button type="button" size="icon" variant="ghost" className="-mr-2 -mt-2 rounded-xl text-slate-950 hover:bg-white/20" onClick={close} aria-label="Skip tour"><X className="h-5 w-5" /></Button></div><div className="mt-5 flex gap-1.5">{steps.map((_, item) => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= index ? "bg-slate-950" : "bg-white/45"}`} />)}</div></div>
        <div className="p-6"><p className="leading-7 text-muted-foreground">{step.body}</p>{step.to && <Button type="button" variant="outline" onClick={go} className="mt-5 w-full rounded-xl"><Sparkles className="mr-2 h-4 w-4 text-teal-600" />{step.action}</Button>}<div className="mt-6 flex items-center justify-between gap-3"><Button type="button" variant="ghost" onClick={index ? () => setIndex((value) => value - 1) : close} className="rounded-xl">{index ? <><ArrowLeft className="mr-2 h-4 w-4"/>Back</> : "Skip tour"}</Button><Button type="button" onClick={next} className="rounded-xl">{index === steps.length - 1 ? "Finish" : <>Next<ArrowRight className="ml-2 h-4 w-4"/></>}</Button></div></div>
      </section>
    </div>}
  </>;
}
