import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Lock,
  ChevronDown,
  MapPin,
  Car,
  Plane,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";

type HeroTab = "buy" | "import" | "sell";

const POPULAR_AI_PROMPTS = [
  "Toyota Harrier under KSh 4M in Nairobi",
  "Land Cruiser 300 Diesel with sunroof",
  "Reliable Japanese hybrid under KSh 2.5M",
  "Mercedes-Benz GLE 450 with low mileage",
];

export function CinematicHero() {
  const [activeTab, setActiveTab] = useState<HeroTab>("buy");
  const [aiQuery, setAiQuery] = useState("");
  const [isAiFocused, setIsAiFocused] = useState(false);
  const navigate = useNavigate();

  // Buy filters
  const [location, setLocation] = useState("Nairobi, KE");
  const [make, setMake] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [budget, setBudget] = useState("");

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate({
      to: "/cars",
      search: {
        ...(make ? { make } : {}),
        ...(bodyType ? { body: bodyType } : {}),
        ...(budget ? { max_price: Number(budget) } : {}),
      } as never,
    });
  };

  const handleAiSearch = (prompt: string) => {
    setAiQuery(prompt);
    navigate({
      to: "/cars",
      search: { q: prompt } as never,
    });
  };

  return (
    <section className="relative min-h-[92vh] overflow-hidden bg-[#070b14] text-white flex flex-col justify-between">
      {/* Cinematic Background with multi-stop rich dark overlay & lighting effects */}
      <div className="absolute inset-0 select-none pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=2400&auto=format&fit=crop&q=85"
          alt="Luxury performance vehicle on highway at twilight"
          className="h-full w-full object-cover object-center scale-105 animate-[pulse_10s_ease-in-out_infinite] opacity-60 brightness-[0.75] contrast-[1.1]"
        />

        {/* Cinematic multi-stop gradient overlays for Apple-level contrast and atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#070b14]/95 via-[#070b14]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-[#070b14]/80" />

        {/* Ambient atmospheric teal and deep navy glow */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 h-[450px] w-[450px] rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-16 pb-12 sm:px-6 lg:pt-24 lg:pb-16 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-300 backdrop-blur-md shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
            The New Way to Buy Cars
          </div>

          {/* Large confident headline */}
          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.05]">
            Find the car.
            <br />
            Know the story.
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Drive with confidence.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="mt-6 max-w-2xl text-base sm:text-xl font-normal leading-relaxed text-slate-300">
            Verified vehicles, trusted sellers and secure escrow payments — all in one seamless global automotive marketplace.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="group h-13 rounded-2xl bg-teal-500 px-8 text-base font-bold text-slate-950 shadow-lg shadow-teal-500/25 transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-500/35 hover:-translate-y-0.5"
            >
              <Link to="/cars">
                Browse Cars
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 rounded-2xl border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:border-white/40"
            >
              <Link to="/import">
                <Plane className="mr-2 h-4 w-4 text-teal-300" />
                Import a Car
              </Link>
            </Button>
          </div>
        </div>

        {/* Integrated Floating Search & AI Experience */}
        <div className="mt-12 w-full max-w-5xl">
          {/* Tab selector */}
          <div className="flex items-center gap-1.5 pl-1">
            {[
              { id: "buy" as const, label: "Buy Locally", icon: Car },
              { id: "import" as const, label: "Import Sourcing", icon: Globe },
              { id: "sell" as const, label: "Sell Your Car", icon: ArrowUpRight },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 rounded-t-2xl px-5 py-3 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  activeTab === t.id
                    ? "bg-slate-900/90 text-teal-400 border-t border-x border-teal-500/30 shadow-xl backdrop-blur-xl"
                    : "bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-900/50 backdrop-blur-md"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* Search container */}
          <div className="rounded-2xl rounded-tl-none border border-white/15 bg-slate-900/85 p-3 sm:p-5 shadow-2xl backdrop-blur-xl">
            {activeTab === "buy" && (
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Location field */}
                  <div className="relative rounded-xl border border-white/10 bg-slate-950/60 p-2 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Location
                    </label>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Nairobi, Mombasa..."
                        className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Make/Model selector */}
                  <div className="relative rounded-xl border border-white/10 bg-slate-950/60 p-2 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Make / Model
                    </label>
                    <Select value={make} onValueChange={setMake}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="all">All Makes</SelectItem>
                        {["Toyota", "Land Cruiser", "Prado", "Harrier", "Mercedes-Benz", "BMW", "Nissan", "Subaru", "Porsche", "Audi", "Lexus", "Ford"].map(
                          (m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Body Type */}
                  <div className="relative rounded-xl border border-white/10 bg-slate-950/60 p-2 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Body Type
                    </label>
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="all">All Body Types</SelectItem>
                        {[
                          { id: "suv", label: "SUV / 4x4" },
                          { id: "sedan", label: "Sedan" },
                          { id: "pickup", label: "Pickup Truck" },
                          { id: "hatchback", label: "Hatchback" },
                          { id: "coupe", label: "Coupe" },
                          { id: "van", label: "Van / Commercial" },
                        ].map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price budget */}
                  <div className="relative rounded-xl border border-white/10 bg-slate-950/60 p-2 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Max Price
                    </label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="Any Budget" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="all">Any Budget</SelectItem>
                        <SelectItem value="1500000">Under KSh 1.5M</SelectItem>
                        <SelectItem value="3000000">Under KSh 3.0M</SelectItem>
                        <SelectItem value="5000000">Under KSh 5.0M</SelectItem>
                        <SelectItem value="8000000">Under KSh 8.0M</SelectItem>
                        <SelectItem value="12000000">Under KSh 12.0M</SelectItem>
                        <SelectItem value="25000000">Luxury (KSh 12M+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search Button */}
                  <Button
                    type="submit"
                    className="h-full min-h-[52px] rounded-xl bg-teal-500 font-bold text-slate-950 shadow-md transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-500/25"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Cars
                  </Button>
                </div>

                {/* Natural-Language AI Search Prompt Bar */}
                <div className="relative mt-3 rounded-xl border border-teal-500/25 bg-teal-950/20 p-2.5 sm:p-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-300 shrink-0">
                      <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                      <span>Natural AI Search:</span>
                    </div>
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Describe the car you're looking for (e.g., 'Black Toyota Prado 2021+ under KSh 7M')"
                      className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAiSearch(aiQuery || POPULAR_AI_PROMPTS[0])}
                      className="h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-xs font-semibold transition"
                    >
                      AI Match
                    </Button>
                  </div>

                  {/* Quick prompt suggestions */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-slate-500">Try:</span>
                    {POPULAR_AI_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleAiSearch(prompt)}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-slate-300 hover:border-teal-400/50 hover:bg-teal-500/10 hover:text-teal-300 transition"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            )}

            {activeTab === "import" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Destination Country
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-white">🇰🇪 Kenya (Mombasa Port)</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Source Country
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-white">🇯🇵 Japan / 🇬🇧 UK / 🇦🇪 UAE</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Target Vehicle
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-slate-300">e.g. Land Cruiser, Harrier</p>
                  </div>
                  <Button
                    asChild
                    className="h-full min-h-[52px] rounded-xl bg-teal-500 font-bold text-slate-950 hover:bg-teal-400"
                  >
                    <Link to="/import">
                      Start Import Quote <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-slate-400">
                  Direct corridor sourcing with full Japanese export inspection & duty calculations.
                </p>
              </div>
            )}

            {activeTab === "sell" && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">List your vehicle to 50,000+ verified buyers</h4>
                  <p className="text-xs text-slate-400">
                    Get an instant AI valuation, verified seller protection, and guaranteed escrow payout.
                  </p>
                </div>
                <Button
                  asChild
                  className="rounded-xl bg-teal-500 px-6 font-bold text-slate-950 hover:bg-teal-400 shrink-0"
                >
                  <Link to="/seller">
                    Start Free Listing <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Architectural Trust Strip (Seamless, refined, non-boxy) */}
      <div className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 sm:grid-cols-4">
            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pr-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-white">5,000+</p>
                <p className="text-xs font-medium text-slate-400">Verified Listings</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-white">124</p>
                <p className="text-xs font-medium text-slate-400">Global Markets Active</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-white">1,892+</p>
                <p className="text-xs font-medium text-slate-400">Escrow Transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-xl font-bold tracking-tight text-white">9.7 / 10</p>
                <p className="text-xs font-medium text-slate-400">Buyer Trust Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
