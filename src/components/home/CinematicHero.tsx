import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Car, Check, MapPin, Plane, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const prompts = ["Toyota Harrier under KSh 4M", "Reliable Japanese hybrid", "Prado, 2021+, low mileage"];

export function CinematicHero() {
  const navigate = useNavigate();
  const [make, setMake] = useState("");
  const [budget, setBudget] = useState("");
  const [aiQuery, setAiQuery] = useState("");

  const searchCars = (event?: React.FormEvent) => {
    event?.preventDefault();
    navigate({ to: "/cars", search: { ...(make && make !== "all" ? { make } : {}), ...(budget && budget !== "all" ? { max_price: Number(budget) } : {}) } as never });
  };
  const askAI = (value: string) => navigate({ to: "/cars", search: { q: value || prompts[0] } as never });

  return (
    <section className="relative overflow-hidden bg-[#f8fafc] text-slate-950">
      <div className="mx-auto grid min-h-[760px] max-w-[1440px] grid-cols-1 items-stretch lg:grid-cols-[minmax(0,0.94fr)_minmax(500px,1.06fr)]">
        <div className="relative z-10 flex flex-col justify-center px-5 py-20 sm:px-10 lg:pl-16 lg:pr-10 xl:pl-24">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-teal-500" />Automotive, made certain</div>
            <h1 className="mt-7 font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-6xl xl:text-[76px]">The smarter way to find your next <span className="text-teal-600">drive.</span></h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">Verified cars, trusted specialists and clear import support — from first search to handover, in one calm place.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg" className="h-12 rounded-full bg-slate-950 px-6 font-bold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800"><Link to="/cars">Explore verified cars <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button asChild size="lg" variant="outline" className="h-12 rounded-full border-slate-200 bg-white px-6 font-bold text-slate-800 hover:bg-slate-50"><Link to="/import"><Plane className="mr-2 h-4 w-4 text-teal-600" />Import with clarity</Link></Button></div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">{['Verified sellers', 'Inspection evidence', 'Clear payment milestones'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-teal-600" />{item}</span>)}</div>
          </div>
        </div>
        <div className="relative min-h-[460px] overflow-hidden lg:min-h-full">
          <video autoPlay muted loop playsInline preload="metadata" poster="/images/hero-driving-suv.jpg" className="absolute inset-0 h-full w-full object-cover object-center"><source src="/videos/hero-driving-car.mp4" type="video/mp4" /></video>
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8fafc] via-[#f8fafc]/28 to-slate-950/20" /><div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950/45 to-transparent" />
          <div className="absolute bottom-7 right-6 left-6 rounded-2xl border border-white/30 bg-white/80 p-4 shadow-xl backdrop-blur-md sm:left-auto sm:w-72"><div className="flex items-center gap-2 text-xs font-bold text-slate-900"><ShieldCheck className="h-4 w-4 text-teal-600" />BUY WITH EVIDENCE</div><p className="mt-2 text-sm leading-snug text-slate-600">See a vehicle’s checks, history and handover path before you commit.</p></div>
        </div>
      </div>
      <div className="relative z-20 mx-auto -mt-7 w-[calc(100%-2rem)] max-w-6xl rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_22px_55px_rgba(15,23,42,0.12)] sm:p-4 lg:-mt-16">
        <form onSubmit={searchCars} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_auto]">
          <div className="flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4"><MapPin className="h-4 w-4 text-teal-600" /><div><span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span><span className="text-sm font-semibold text-slate-800">Nairobi, Kenya</span></div></div>
          <Select value={make} onValueChange={setMake}><SelectTrigger className="h-14 rounded-2xl border-0 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none"><SelectValue placeholder="Any make or model" /></SelectTrigger><SelectContent>{["all", "Toyota", "Land Cruiser", "Mercedes-Benz", "BMW", "Nissan", "Subaru", "Lexus"].map((name) => <SelectItem key={name} value={name}>{name === "all" ? "Any make or model" : name}</SelectItem>)}</SelectContent></Select>
          <Select value={budget} onValueChange={setBudget}><SelectTrigger className="h-14 rounded-2xl border-0 bg-slate-50 px-4 text-sm font-semibold text-slate-700 shadow-none"><SelectValue placeholder="Choose a budget" /></SelectTrigger><SelectContent><SelectItem value="all">Any budget</SelectItem><SelectItem value="1500000">Under KSh 1.5M</SelectItem><SelectItem value="3000000">Under KSh 3M</SelectItem><SelectItem value="5000000">Under KSh 5M</SelectItem><SelectItem value="8000000">Under KSh 8M</SelectItem></SelectContent></Select>
          <Button type="submit" className="h-14 rounded-2xl bg-teal-500 px-6 font-bold text-slate-950 hover:bg-teal-400"><Search className="mr-2 h-4 w-4" />Find a car</Button>
        </form>
        <div className="mt-2 flex flex-col gap-2 rounded-2xl bg-teal-50 px-4 py-3 sm:flex-row sm:items-center"><Sparkles className="h-4 w-4 shrink-0 text-teal-600" /><input value={aiQuery} onChange={(event) => setAiQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); askAI(aiQuery); } }} className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500" placeholder="Tell AutoConnect what you need — “family SUV under KSh 4M”" /><div className="flex flex-wrap gap-1.5">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => askAI(prompt)} className="rounded-full border border-teal-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-100">{prompt}</button>)}</div></div>
      </div>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-0">{[{ icon: Car, title: "Buy", copy: "Verified local inventory" }, { icon: Plane, title: "Import", copy: "Clear cost and logistics" }, { icon: ShieldCheck, title: "Care", copy: "A trusted car life network" }].map(({ icon: Icon, title, copy }) => <div key={title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal-700"><Icon className="h-4 w-4" /></span><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="text-xs text-slate-500">{copy}</p></div></div>)}</div>
    </section>
  );
}
