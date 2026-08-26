import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  Lock,
  MapPin,
  Car,
  Plane,
  ArrowUpRight,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuickListingModal } from "@/components/listing/QuickListingModal";

type HeroTab = "buy" | "import" | "sell";

const HERO_FRAMES = [
  "/images/hero-driving-suv.jpg",
  "/images/hero-driving-sedan.jpg",
  "/images/hero-driving-crossover.jpg",
];

const POPULAR_AI_PROMPTS = [
  "Toyota Harrier under KSh 4M in Nairobi",
  "Land Cruiser 300 Diesel with sunroof",
  "Reliable Japanese hybrid under KSh 2.5M",
  "Mercedes-Benz GLE 450 with low mileage",
];

export function CinematicHero() {
  const [activeTab, setActiveTab] = useState<HeroTab>("buy");
  const [aiQuery, setAiQuery] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [quickListOpen, setQuickListOpen] = useState(false);
  const navigate = useNavigate();

  // Subtle parallax tracker on desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 16;
      const y = (e.clientY / innerHeight - 0.5) * 12;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
        ...(make && make !== "all" ? { make } : {}),
        ...(bodyType && bodyType !== "all" ? { body: bodyType } : {}),
        ...(budget && budget !== "all" ? { max_price: Number(budget) } : {}),
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
    <section className="relative min-h-[94vh] overflow-hidden bg-[#050811] text-white flex flex-col justify-between">
      {/* Cinematic Background with dynamic depth and automotive light streaks */}
      <div className="absolute inset-0 select-none pointer-events-none overflow-hidden">
        {/* Poster/fallback for slow connections and reduced-motion preferences. */}
        {HERO_FRAMES.map((src, index) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.82] contrast-[1.05] transition-[opacity,transform,filter] duration-[1800ms] ease-out motion-reduce:transition-none"
            style={{
              opacity: index === 0 ? 0.84 : 0,
              filter: index === 0 ? "saturate(1.04)" : "saturate(.9)",
              transform: `translate3d(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px, 0) scale(${index === 0 ? 1.09 : 1.03})`,
            }}
          />
        ))}

        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-driving-suv.jpg"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center brightness-[0.72] contrast-[1.05] motion-reduce:hidden"
        >
          <source src="/videos/hero-driving-car.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-x-0 bottom-[16%] h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent blur-[1px]" />

        {/* Multi-layered cinematic darkness & atmospheric gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050811] via-[#050811]/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-[#050811]/40 to-[#050811]/90" />

        {/* Dynamic Headlight beam & road reflection glow effects */}
        <div
          className="absolute top-1/3 left-1/3 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-400/12 blur-[120px] pointer-events-none transition-transform duration-500"
          style={{
            transform: `translate3d(${mousePos.x * -1.2}px, ${mousePos.y * -1.2}px, 0)`,
          }}
        />
        <div className="absolute bottom-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[140px] pointer-events-none" />

        {/* Subtle horizon road sheen reflection line */}
        <div className="absolute bottom-20 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

        <div className="absolute bottom-28 right-4 hidden items-center gap-2 rounded-full border border-white/15 bg-slate-950/45 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-200 backdrop-blur-md sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
          Live drive
        </div>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 pt-14 pb-10 sm:px-6 lg:pt-20 lg:pb-14 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-teal-300 backdrop-blur-xl shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
            </span>
            The Future of Car Buying
          </div>

          {/* Large confident headline */}
          <h1 className="mt-6 font-display text-4xl sm:text-6xl lg:text-[72px] font-extrabold tracking-tight leading-[1.05] text-white">
            Find the car.
            <br />
            Know the story.
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Drive with confidence.
            </span>
          </h1>

          {/* Supporting copy */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg font-normal leading-relaxed text-slate-300">
            Verified vehicles, trusted sellers, secure payments and intelligent search — all in one automotive marketplace.
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
              className="h-13 rounded-2xl border-white/20 bg-white/5 px-7 text-base font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/15 hover:border-white/40 hover:-translate-y-0.5"
            >
              <Link to="/import">
                <Plane className="mr-2 h-4 w-4 text-teal-300" />
                Import a Car
              </Link>
            </Button>
          </div>
        </div>

        {/* Integrated Floating Search & Concierge Experience */}
        <div className="mt-10 w-full max-w-5xl">
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
                className={`flex items-center gap-2 rounded-t-2xl px-5 py-3 text-xs sm:text-sm font-bold transition-all duration-200 ${
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
          <div className="rounded-3xl rounded-tl-none border border-white/15 bg-slate-900/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl">
            {activeTab === "buy" && (
              <form onSubmit={handleSearch} className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
                  {/* Location field */}
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
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
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Make / Model
                    </label>
                    <Select value={make} onValueChange={setMake}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
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
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Body Type
                    </label>
                    <Select value={bodyType} onValueChange={setBodyType}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
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
                  <div className="relative rounded-2xl border border-white/10 bg-slate-950/70 p-2.5 transition-colors hover:border-teal-500/40 focus-within:border-teal-400">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Max Price
                    </label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger className="h-6 border-0 bg-transparent p-0 text-sm font-medium text-white shadow-none focus:ring-0">
                        <SelectValue placeholder="Any Budget" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
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
                    className="h-full min-h-[52px] rounded-2xl bg-teal-500 font-bold text-slate-950 shadow-md transition-all duration-200 hover:bg-teal-400 hover:shadow-teal-500/25"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Search Cars
                  </Button>
                </div>

                {/* Natural-Language AI Search Prompt Bar */}
                <div className="relative rounded-2xl border border-teal-500/30 bg-teal-950/25 p-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-300 shrink-0">
                      <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
                      <span>AI Concierge:</span>
                    </div>
                    <input
                      type="text"
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      placeholder="Describe the car you're looking for (e.g., 'Black Toyota Prado, 2021+, under KSh 7M')"
                      className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAiSearch(aiQuery || POPULAR_AI_PROMPTS[0])}
                      className="h-8.5 rounded-xl bg-teal-500/20 border border-teal-400/50 text-teal-300 hover:bg-teal-500 hover:text-slate-950 text-xs font-bold transition shadow-sm"
                    >
                      AI Match
                    </Button>
                  </div>

                  {/* Quick prompt suggestions */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="text-slate-500 font-medium">Examples:</span>
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
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Destination Port
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-white">🇰🇪 Kenya (Mombasa Port)</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Source Markets
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-white">🇯🇵 Japan / 🇬🇧 UK / 🇦🇪 UAE</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-2.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Target Vehicle
                    </label>
                    <p className="mt-0.5 text-sm font-semibold text-slate-300">Land Cruiser, Harrier, Defender</p>
                  </div>
                  <Button
                    asChild
                    className="h-full min-h-[52px] rounded-2xl bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 shadow-md"
                  >
                    <Link to="/import">
                      Start Import Quote <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Direct corridor sourcing with full Japanese export inspection & duty calculations.
                </p>
              </div>
            )}

            {activeTab === "sell" && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">List your vehicle to verified buyers</h4>
                  <p className="text-xs text-slate-400">
                    Get an instant AI valuation, verified seller protection, and guaranteed escrow payout.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setQuickListOpen(true)}
                    className="rounded-2xl bg-teal-500 px-5 font-bold text-slate-950 hover:bg-teal-400 shrink-0 shadow-md gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Quick List Now</span>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-2xl border-white/20 px-5 font-bold text-white hover:bg-white/10 shrink-0"
                  >
                    <Link to="/seller">
                      Full Seller Portal <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editorial Trust Metrics Strip (Integrated, seamless, non-dashboard) */}
      <div className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
          <div className="grid grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 sm:grid-cols-4">
            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pr-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold tracking-tight text-white">Evidence-led</p>
                <p className="text-xs font-semibold text-slate-400">Vehicle listings</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold tracking-tight text-white">Seller checks</p>
                <p className="text-xs font-semibold text-slate-400">Before approval</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:px-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold tracking-tight text-white">Clear milestones</p>
                <p className="text-xs font-semibold text-slate-400">Payment workflow</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 pt-2 sm:pt-0 sm:pl-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-base font-extrabold tracking-tight text-white">Import support</p>
                <p className="text-xs font-semibold text-slate-400">Local or global</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Registry Listing Modal */}
      <QuickListingModal
        isOpen={quickListOpen}
        onClose={() => setQuickListOpen(false)}
      />
    </section>
  );
}
