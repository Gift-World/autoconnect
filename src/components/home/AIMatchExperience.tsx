import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Gauge,
  MapPin,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MatchedVehicle {
  id: string;
  title: string;
  year: number;
  price: string;
  location: string;
  matchScore: number;
  matchReason: string;
  image: string;
  mileage: string;
}

const AI_PRESETS: { prompt: string; count: number; matches: MatchedVehicle[] }[] = [
  {
    prompt: "Something comfortable for family trips, fuel efficient, under KSh 4.5M",
    count: 3,
    matches: [
      {
        id: "demo-car-2",
        title: "2021 Toyota Harrier Hybrid G-Edition",
        year: 2021,
        price: "KSh 4,450,000",
        location: "Nairobi, Kenya",
        matchScore: 98,
        matchReason: "22 km/L Hybrid efficiency + spacious 5-seater luxury cabin",
        image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80",
        mileage: "48,000 km",
      },
      {
        id: "demo-car-1",
        title: "2020 Toyota Land Cruiser Prado TX-L",
        year: 2020,
        price: "KSh 4,850,000",
        location: "Mombasa, Kenya",
        matchScore: 94,
        matchReason: "Full 7-seater configuration with rear climate & cruise control",
        image: "https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=1000&auto=format&fit=crop&q=80",
        mileage: "62,000 km",
      },
      {
        id: "demo-car-5",
        title: "2022 Subaru Outback 2.5i Limited",
        year: 2022,
        price: "KSh 3,900,000",
        location: "Nairobi, Kenya",
        matchScore: 92,
        matchReason: "AWD stability, EyeSight safety suite & expansive cargo room",
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1000&auto=format&fit=crop&q=80",
        mileage: "34,000 km",
      },
    ],
  },
  {
    prompt: "Executive luxury sedan with leather interior and sunroof under KSh 6M",
    count: 3,
    matches: [
      {
        id: "demo-car-3",
        title: "2020 Mercedes-Benz E300 AMG Line",
        year: 2020,
        price: "KSh 5,800,000",
        location: "Nairobi, Kenya",
        matchScore: 99,
        matchReason: "Panoramic glass roof, Burmester surround sound & AMG styling",
        image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1000&auto=format&fit=crop&q=80",
        mileage: "41,000 km",
      },
      {
        id: "demo-car-4",
        title: "2021 BMW 530i M Sport",
        year: 2021,
        price: "KSh 5,400,000",
        location: "Nairobi, Kenya",
        matchScore: 96,
        matchReason: "Executive M-Sport package with Dakota leather & digital cockpit",
        image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1000&auto=format&fit=crop&q=80",
        mileage: "38,000 km",
      },
      {
        id: "demo-car-7",
        title: "2020 Lexus ES300h Executive Hybrid",
        year: 2020,
        price: "KSh 4,950,000",
        location: "Mombasa Port",
        matchScore: 93,
        matchReason: "Whisper-quiet hybrid powertrain with Mark Levinson audio",
        image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1000&auto=format&fit=crop&q=80",
        mileage: "45,000 km",
      },
    ],
  },
  {
    prompt: "Rugged 4x4 diesel pickup with high clearance and towing capacity",
    count: 2,
    matches: [
      {
        id: "demo-car-6",
        title: "2021 Toyota Hilux Double Cab 2.8 GD-6",
        year: 2021,
        price: "KSh 4,600,000",
        location: "Nakuru, Kenya",
        matchScore: 99,
        matchReason: "Heavy-duty 4x4 differential lock + 3.5-ton towing capability",
        image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1000&auto=format&fit=crop&q=80",
        mileage: "52,000 km",
      },
      {
        id: "demo-car-8",
        title: "2022 Ford Ranger Wildtrak 2.0 Bi-Turbo",
        year: 2022,
        price: "KSh 4,950,000",
        location: "Nairobi, Kenya",
        matchScore: 95,
        matchReason: "Terrain Management System with roller shutter bed & tow package",
        image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80",
        mileage: "36,000 km",
      },
    ],
  },
];

export function AIMatchExperience() {
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const navigate = useNavigate();

  const currentPreset = AI_PRESETS[selectedPresetIdx];

  const handleRunAi = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customInput.trim() || currentPreset.prompt;
    navigate({
      to: "/cars",
      search: { q: query } as never,
    });
  };

  return (
    <section className="relative overflow-hidden bg-[#070b14] py-20 lg:py-28 text-white">
      {/* Refined ambient automotive lighting */}
      <div className="pointer-events-none absolute top-0 left-1/3 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[110px]" />

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-md">
            <Bot className="h-3.5 w-3.5 text-teal-400" />
            Automotive Concierge
          </div>

          <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            Meet your digital car advisor.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Skip complex filters. Tell our concierge exactly what your lifestyle, budget, and driving conditions require — and receive curated, verified recommendations in seconds.
          </p>
        </div>

        {/* Concierge Interactive Consultation Box */}
        <div className="mx-auto mt-10 max-w-3xl">
          <form onSubmit={handleRunAi} className="relative rounded-3xl border border-teal-500/30 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex w-full items-center gap-3 px-3 py-2">
                <Sparkles className="h-5 w-5 text-teal-400 shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={currentPreset.prompt}
                  className="w-full bg-transparent text-sm sm:text-base font-medium text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto h-12 rounded-2xl bg-teal-500 px-7 font-bold text-slate-950 hover:bg-teal-400 shadow-md transition-all shrink-0"
              >
                Consult Concierge <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Consultation Scenarios:</span>
            {AI_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedPresetIdx(idx);
                  setCustomInput("");
                }}
                className={`rounded-full border px-3.5 py-1 text-xs font-semibold transition-all duration-200 ${
                  selectedPresetIdx === idx
                    ? "border-teal-400 bg-teal-500/20 text-teal-300 shadow-sm"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-teal-400/40 hover:bg-white/10"
                }`}
              >
                {preset.prompt.slice(0, 44)}...
              </button>
            ))}
          </div>
        </div>

        {/* Live Matching Results Box */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Curated Concierge Selections
              </span>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs font-semibold">
                {currentPreset.matches.length} Recommended Matches
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Evaluated for mechanical integrity, verified odometer history, and real value
            </p>
          </div>

          {/* Matches Grid */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {currentPreset.matches.map((match) => (
              <div
                key={match.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-4 transition-all duration-300 hover:border-teal-500/50 hover:bg-slate-950 hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  {/* Image container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-slate-900">
                    <img
                      src={match.image}
                      alt={match.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-teal-500 px-2.5 py-0.5 text-xs font-extrabold text-slate-950 shadow-md">
                      {match.matchScore}% Match
                    </div>
                  </div>

                  {/* Title and price */}
                  <div className="mt-4">
                    <h4 className="font-display text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                      {match.title}
                    </h4>
                    <p className="mt-1 font-display text-lg font-bold text-teal-400">
                      {match.price}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-teal-400" />
                      <span>{match.location}</span>
                      <span>•</span>
                      <span>{match.mileage}</span>
                    </div>

                    {/* Match reason tag */}
                    <div className="mt-3 rounded-2xl bg-teal-950/40 border border-teal-500/20 p-2.5 text-xs text-teal-200">
                      <span className="font-bold text-teal-300">Advisor Note: </span>
                      {match.matchReason}
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified Inspection
                  </span>
                  <Link
                    to="/cars"
                    search={{ q: match.title } as never}
                    className="inline-flex items-center text-xs font-bold text-teal-400 hover:text-teal-300 group-hover:translate-x-0.5 transition-transform"
                  >
                    View Vehicle <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
