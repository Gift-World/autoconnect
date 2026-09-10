import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, CirclePlay, ClipboardCheck, Gavel, Pause, Play, Search, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Scene = { eyebrow: string; title: string; body: string; action: string; to: string; icon: typeof Search; preview: "buyer" | "garage" | "seller" | "admin" };

const scenes: Scene[] = [
  { eyebrow: "01  BUY WITH CONTEXT", title: "A car page that answers the next question.", body: "Search, compare evidence, arrange a viewing, and keep the decision path in one calm place.", action: "Explore cars", to: "/cars", icon: Search, preview: "buyer" },
  { eyebrow: "02  OWN WITH MEMORY", title: "Your car becomes a living record.", body: "Parts, service, mileage, receipts and reminders stay attached to the vehicle you actually own.", action: "Open My Garage", to: "/garage", icon: Wrench, preview: "garage" },
  { eyebrow: "03  SELL WITH TRUST", title: "Every seller task has a clear next step.", body: "Create a listing, submit evidence, manage enquiries, and schedule an offer that stays private until reviewed.", action: "See seller workspace", to: "/seller", icon: Gavel, preview: "seller" },
  { eyebrow: "04  OPERATE WITH CONTROL", title: "The marketplace has a control tower.", body: "Admins review evidence, listings, auctions and disputes with recorded decisions instead of loose messages.", action: "See admin workflow", to: "/admin", icon: ClipboardCheck, preview: "admin" },
];

export function ProductDemoReel({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const scene = scenes[index];
  useEffect(() => {
    if (!open || !playing) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % scenes.length), 5600);
    return () => window.clearInterval(timer);
  }, [open, playing]);
  useEffect(() => { if (!open) setIndex(0); }, [open]);

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[94vh] max-w-6xl overflow-y-auto rounded-[28px] border-0 bg-slate-950 p-0 text-white shadow-2xl sm:max-h-[90vh]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(20,184,166,.28),transparent_32%),radial-gradient(circle_at_15%_90%,rgba(14,116,144,.25),transparent_35%)]" />
        <div className="relative grid min-h-[620px] lg:grid-cols-[.88fr_1.12fr]">
          <div className="flex flex-col justify-between p-6 sm:p-10">
            <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[.18em] text-teal-200"><CirclePlay className="h-3.5 w-3.5"/>INTERACTIVE PRODUCT FILM</div><p className="mt-8 text-[10px] font-bold tracking-[.18em] text-teal-300">{scene.eyebrow}</p><h2 className="mt-3 max-w-lg text-3xl font-extrabold tracking-tight sm:text-5xl">{scene.title}</h2><p className="mt-5 max-w-md text-sm leading-7 text-slate-300 sm:text-base">{scene.body}</p></div>
            <div className="mt-10"><div className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>{String(index + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span><button type="button" onClick={() => setPlaying((value) => !value)} className="inline-flex items-center gap-2 rounded-full px-2 py-1 font-semibold hover:bg-white/10">{playing ? <Pause className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5"/>}{playing ? "Pause" : "Play"}</button></div><div className="flex gap-2">{scenes.map((item, itemIndex) => <button key={item.title} aria-label={`Show scene ${itemIndex + 1}`} onClick={() => { setIndex(itemIndex); setPlaying(false); }} className={`h-1.5 flex-1 rounded-full transition ${itemIndex === index ? "bg-teal-400" : "bg-white/20 hover:bg-white/45"}`} />)}</div><div className="mt-6 flex flex-wrap gap-3"><Button asChild className="rounded-xl bg-teal-400 text-slate-950 hover:bg-teal-300"><Link to={scene.to as never} onClick={() => onOpenChange(false)}>{scene.action}<ArrowRight className="ml-2 h-4 w-4"/></Link></Button><Button variant="outline" onClick={() => setIndex((value) => (value + 1) % scenes.length)} className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">Next scene<ChevronRight className="ml-2 h-4 w-4"/></Button></div></div>
          </div>
          <div className="flex items-center p-5 sm:p-8 lg:p-10"><DemoScreen scene={scene} /></div>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}

function DemoScreen({ scene }: { scene: Scene }) {
  const Icon = scene.icon;
  return <div className="w-full overflow-hidden rounded-[26px] border border-white/15 bg-[#f8fafc] p-3 text-slate-950 shadow-[0_32px_80px_rgba(0,0,0,.42)] sm:p-4"><div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-xl bg-slate-950 text-teal-300"><Sparkles className="h-4 w-4"/></span><div><p className="text-sm font-extrabold">Auto<span className="text-teal-600">Connect</span></p><p className="text-[9px] font-bold tracking-[.16em] text-slate-400">PRODUCT PREVIEW</p></div></div><span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(74,222,128,.16)]"/></div><div className="mt-3 min-h-[360px] rounded-2xl border border-slate-200 bg-white p-5 sm:min-h-[430px] sm:p-7"><div className="mb-6 flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.16em] text-teal-700">{scene.eyebrow.replace(/^\d+\s+/, "")}</p><h3 className="mt-1 text-xl font-extrabold">{scene.preview === "buyer" ? "Find a better fit" : scene.preview === "garage" ? "Family Tank" : scene.preview === "seller" ? "Seller control room" : "Marketplace control tower"}</h3></div><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-700"><Icon className="h-5 w-5"/></span></div><Preview kind={scene.preview} /></div><div className="mt-3 flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-[11px] font-medium text-teal-800"><CheckCircle2 className="h-3.5 w-3.5"/>Every screen has a clear next action and an honest status.</div></div>;
}

function Preview({ kind }: { kind: Scene["preview"] }) {
  const content = useMemo(() => {
    if (kind === "buyer") return <><div className="rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs text-slate-300">I need a reliable family SUV</p><div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 p-2.5"><Search className="h-4 w-4 text-teal-300"/><span className="text-sm font-semibold">Toyota Harrier under KSh 4M</span></div></div><div className="mt-4 grid grid-cols-[.9fr_1.1fr] gap-3"><div className="h-28 rounded-xl bg-[linear-gradient(140deg,#d8f3f0,#86cfc8)]"/><div><p className="font-bold">2021 Toyota Harrier</p><p className="mt-1 text-xs text-slate-500">KSh 3,850,000 · Nairobi</p><div className="mt-3 flex flex-wrap gap-1.5"><Tag text="Evidence"/><Tag text="Compare"/><Tag text="Viewing"/></div></div></div></>;
    if (kind === "garage") return <><div className="grid grid-cols-3 gap-2"><Metric value="68,240" label="Mileage"/><Metric value="3" label="Reminders"/><Metric value="12" label="Records"/></div><div className="mt-4 space-y-2"><Row title="Routine service" detail="Completed · Receipt added" tone="teal"/><Row title="Brake pads" detail="Parts quote requested" tone="slate"/><Row title="Inspection" detail="Due in 14 days" tone="amber"/></div></>;
    if (kind === "seller") return <><div className="grid grid-cols-3 gap-2"><Metric value="08" label="Listings"/><Metric value="04" label="Enquiries"/><Metric value="02" label="To review"/></div><div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4"><p className="font-bold">2019 Land Cruiser Prado</p><p className="mt-1 text-xs text-teal-800">Evidence submitted · Awaiting admin review</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-teal-100"><div className="h-full w-2/3 rounded-full bg-teal-500"/></div></div><div className="mt-4 flex gap-2"><Tag text="Create listing"/><Tag text="Submit evidence"/><Tag text="Auction"/></div></>;
    return <><div className="grid grid-cols-2 gap-3"><Queue title="Evidence review" count="12"/><Queue title="Auction approval" count="03"/><Queue title="Disputes" count="02"/><Queue title="Provider claims" count="07"/></div><div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white"><p className="text-xs font-bold tracking-[.14em] text-teal-300">RECORDED DECISION</p><p className="mt-2 font-bold">Vehicle evidence ready for review</p><div className="mt-3 flex items-center justify-between text-xs text-slate-300"><span>Seller submitted today</span><span className="rounded-lg bg-teal-400 px-2 py-1 font-bold text-slate-950">Review</span></div></div></>;
  }, [kind]);
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{content}</div>;
}

function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-lg font-extrabold">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p></div>; }
function Tag({ text }: { text: string }) { return <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600">{text}</span>; }
function Row({ title, detail, tone }: { title: string; detail: string; tone: string }) { return <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3"><div><p className="text-sm font-bold">{title}</p><p className="mt-0.5 text-[11px] text-slate-500">{detail}</p></div><span className={`h-2.5 w-2.5 rounded-full ${tone === "teal" ? "bg-teal-500" : tone === "amber" ? "bg-amber-400" : "bg-slate-400"}`}/></div>; }
function Queue({ title, count }: { title: string; count: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-2xl font-extrabold">{count}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p></div>; }
