import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Search,
  Mic,
  MicOff,
  X,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Car,
  Fuel,
  Gauge,
  Layers,
  MapPin,
  Banknote,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

const ROTATING_EXAMPLES = [
  "SUV under 4M low mileage",
  "Toyota sedan automatic 2018+",
  "Hybrid SUV in Nairobi under 3.5M",
  "Diesel 4x4 Land Cruiser Prado",
  "Mercedes-Benz C-Class under 5M",
  "Low mileage pickup truck for export",
];

const SUGGESTION_CHIPS = [
  { label: "🚙 SUVs Under 4M", query: "SUV under 4M low mileage" },
  { label: "⚡ Hybrid & Economical", query: "Toyota Hybrid automatic under 3.5M" },
  { label: "🏎️ German Sedans 2019+", query: "Mercedes or BMW sedan 2019+" },
  { label: "🛻 4x4 Diesel Pickups", query: "Diesel pickup 4x4 Hilux Ranger" },
  { label: "🚢 Direct Japan Imports", query: "RHD foreign used under 3M" },
];

export interface ParsedAiFilters {
  q?: string;
  make?: string;
  model?: string;
  bodyType?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  maxMileage?: number;
  transmission?: string;
  fuelType?: string;
  country?: string;
  rhd?: string;
  exportOnly?: boolean;
}

interface AiCarFinderSearchBarProps {
  onApplyFilters: (filters: ParsedAiFilters) => void;
  className?: string;
  currentSearchQuery?: string;
}

export function AiCarFinderSearchBar({
  onApplyFilters,
  className = "",
  currentSearchQuery = "",
}: AiCarFinderSearchBarProps) {
  const { formatPrice } = useCurrency();
  const [query, setQuery] = useState(currentSearchQuery);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [extractedFilters, setExtractedFilters] = useState<ParsedAiFilters | null>(null);
  const recognitionRef = useRef<any>(null);

  // Sync internal query with external search param if updated
  useEffect(() => {
    if (currentSearchQuery && currentSearchQuery !== query) {
      setQuery(currentSearchQuery);
    }
  }, [currentSearchQuery]);

  // Rotate placeholder text every 3.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Initialize SpeechRecognition if supported
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
          toast.success("Voice Captured", {
            description: `"${transcript}"`,
            icon: <Mic className="h-4 w-4 text-teal-400" />,
          });
          parseAndApplyQuery(transcript);
        };

        recognition.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
          toast.error("Voice input error. Please try typing your search.");
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice search is not supported in this browser. Please type your query.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening...", {
          description: "Say what car you're looking for (e.g. 'Toyota SUV under 4 million')",
        });
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  /**
   * Natural Language Parsing Logic
   * Parses make, model, body type, prices (4M, 4000000, 30k), years (2018+, 2020),
   * transmission (automatic/manual), fuel (diesel/petrol/hybrid/electric), RHD, and export.
   */
  const parseNaturalLanguage = (text: string): ParsedAiFilters => {
    const raw = text.toLowerCase();
    const parsed: ParsedAiFilters = {};

    // 1. Makes
    const makesList = [
      "toyota",
      "mercedes-benz",
      "mercedes",
      "bmw",
      "mazda",
      "subaru",
      "nissan",
      "land rover",
      "ford",
      "volkswagen",
      "audi",
      "honda",
      "hyundai",
      "kia",
      "lexus",
      "mitsubishi",
      "peugeot",
      "volvo",
      "porsche",
      "isuzu",
      "suzuki",
    ];

    for (const m of makesList) {
      if (raw.includes(m)) {
        if (m === "mercedes") {
          parsed.make = "Mercedes-Benz";
        } else {
          parsed.make = m.charAt(0).toUpperCase() + m.slice(1);
        }
        break;
      }
    }

    // 2. Models
    const modelsList = [
      "prado",
      "land cruiser",
      "harrier",
      "rav4",
      "vitz",
      "axio",
      "fielder",
      "hilux",
      "outback",
      "forester",
      "cx-5",
      "cx-3",
      "demio",
      "c200",
      "c-class",
      "e300",
      "e-class",
      "530i",
      "5 series",
      "3 series",
      "x5",
      "ranger",
      "golf",
      "passat",
      "tiguan",
      "cr-v",
      "civic",
      "fit",
      "xtrail",
      "x-trail",
    ];

    for (const model of modelsList) {
      if (raw.includes(model)) {
        parsed.model = model.charAt(0).toUpperCase() + model.slice(1);
        break;
      }
    }

    // 3. Body Types
    if (raw.includes("suv") || raw.includes("4x4") || raw.includes("crossover")) {
      parsed.bodyType = "suv";
    } else if (raw.includes("sedan") || raw.includes("saloon")) {
      parsed.bodyType = "sedan";
    } else if (raw.includes("pickup") || raw.includes("truck") || raw.includes("double cab")) {
      parsed.bodyType = "pickup";
    } else if (raw.includes("hatchback") || raw.includes("hatch")) {
      parsed.bodyType = "hatchback";
    } else if (raw.includes("wagon") || raw.includes("estate")) {
      parsed.bodyType = "wagon";
    } else if (raw.includes("van") || raw.includes("minivan")) {
      parsed.bodyType = "van";
    }

    // 4. Fuel Types
    if (raw.includes("hybrid")) {
      parsed.fuelType = "hybrid";
    } else if (raw.includes("diesel")) {
      parsed.fuelType = "diesel";
    } else if (raw.includes("petrol") || raw.includes("gasoline")) {
      parsed.fuelType = "petrol";
    } else if (raw.includes("electric") || raw.includes("ev")) {
      parsed.fuelType = "electric";
    }

    // 5. Transmission
    if (raw.includes("automatic") || raw.includes("auto") || raw.includes("cvt")) {
      parsed.transmission = "automatic";
    } else if (raw.includes("manual") || raw.includes("stick")) {
      parsed.transmission = "manual";
    }

    // 6. Price Extraction: "under 4M", "below 3.5m", "under 50k", "< 4000000"
    const priceUnderMatch = raw.match(
      /(?:under|below|less than|max|up to|<)\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand|kes|usd)?/i
    );
    if (priceUnderMatch) {
      const num = parseFloat(priceUnderMatch[1]);
      const unit = (priceUnderMatch[2] || "").toLowerCase();
      if (unit.startsWith("m") || num < 20) {
        parsed.maxPrice = num * 1_000_000;
      } else if (unit.startsWith("k") || num < 200) {
        parsed.maxPrice = num * 1_000;
      } else {
        parsed.maxPrice = num;
      }
    }

    // Between price range e.g. "between 2m and 4m"
    const priceRangeMatch = raw.match(/between\s*(\d+(?:\.\d+)?)\s*m?\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\s*m/i);
    if (priceRangeMatch) {
      parsed.minPrice = parseFloat(priceRangeMatch[1]) * 1_000_000;
      parsed.maxPrice = parseFloat(priceRangeMatch[2]) * 1_000_000;
    }

    // 7. Year Extraction: "2018+", "after 2019", "from 2020", "2015 to 2022"
    const yearPlusMatch = raw.match(/(?:from|after|min|since|newer than)?\s*(201\d|202\d)\s*\+/i);
    if (yearPlusMatch) {
      parsed.minYear = parseInt(yearPlusMatch[1], 10);
    } else {
      const yearAfterMatch = raw.match(/(?:after|from|newer than)\s*(201\d|202\d)/i);
      if (yearAfterMatch) {
        parsed.minYear = parseInt(yearAfterMatch[1], 10);
      }
    }

    const yearRangeMatch = raw.match(/(201\d|202\d)\s*(?:to|-)\s*(201\d|202\d)/i);
    if (yearRangeMatch) {
      parsed.minYear = parseInt(yearRangeMatch[1], 10);
      parsed.maxYear = parseInt(yearRangeMatch[2], 10);
    }

    // 8. Mileage: "low mileage", "under 50k km"
    if (raw.includes("low mileage") || raw.includes("low km")) {
      parsed.maxMileage = 50000;
    } else {
      const mileageMatch = raw.match(/(?:under|below|max)\s*(\d+)\s*(?:k|km|000)\s*(?:km|mileage|miles)?/i);
      if (mileageMatch) {
        const num = parseInt(mileageMatch[1], 10);
        parsed.maxMileage = num < 500 ? num * 1000 : num;
      }
    }

    // 9. Right Hand Drive / Steering
    if (raw.includes("rhd") || raw.includes("right hand drive") || raw.includes("right-hand")) {
      parsed.rhd = "yes";
    }

    // 10. Export
    if (raw.includes("export") || raw.includes("shipping") || raw.includes("transit")) {
      parsed.exportOnly = true;
    }

    // 11. Location / Country
    if (raw.includes("nairobi") || raw.includes("mombasa") || raw.includes("kenya")) {
      parsed.country = "KE";
    } else if (raw.includes("japan") || raw.includes("yokohama") || raw.includes("tokyo")) {
      parsed.country = "JP";
    } else if (raw.includes("uk") || raw.includes("london") || raw.includes("britain")) {
      parsed.country = "GB";
    }

    // General search keywords fallback
    parsed.q = text.trim();

    return parsed;
  };

  const parseAndApplyQuery = (searchString: string) => {
    const text = searchString.trim();
    if (!text) return;

    const parsed = parseNaturalLanguage(text);
    setExtractedFilters(parsed);

    toast.success("AI Search Applied", {
      description: `Extracted ${Object.keys(parsed).filter((k) => k !== "q" && parsed[k as keyof ParsedAiFilters]).length} smart filters from your query.`,
      icon: <Sparkles className="h-4 w-4 text-teal-400" />,
    });

    onApplyFilters(parsed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parseAndApplyQuery(query);
  };

  const handleChipClick = (chipQuery: string) => {
    setQuery(chipQuery);
    parseAndApplyQuery(chipQuery);
  };

  const handleClear = () => {
    setQuery("");
    setExtractedFilters(null);
    onApplyFilters({ q: "" });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Futuristic AI Input Card */}
      <div className="relative rounded-2xl border-2 border-teal-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 p-2 shadow-xl backdrop-blur-xl transition-all hover:border-teal-400">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          {/* Left AI Icon Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-teal-500/15 border border-teal-500/30 rounded-xl text-teal-300">
            <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
            <span className="text-xs font-bold font-mono tracking-wider">AI FINDER</span>
          </div>

          {/* Search Input with Dynamic Rotating Placeholder */}
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground sm:hidden" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask AI: "${ROTATING_EXAMPLES[placeholderIndex]}"`}
              className="h-12 w-full pl-9 sm:pl-3 pr-10 text-sm md:text-base bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-white placeholder:text-slate-400 placeholder:transition-opacity placeholder:duration-300"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-full"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Voice Input Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={toggleVoiceInput}
              className={`h-11 w-11 shrink-0 rounded-xl border-border/80 transition-all ${
                isListening
                  ? "bg-rose-500 text-white border-rose-400 animate-pulse shadow-lg shadow-rose-500/30"
                  : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
              }`}
              title={isListening ? "Listening... click to stop" : "Search by voice"}
            >
              {isListening ? (
                <MicOff className="h-4 w-4 animate-bounce" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>

            {/* Smart Search Trigger */}
            <Button
              type="submit"
              className="h-11 px-5 rounded-xl bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 shadow-md shadow-teal-500/20 gap-2 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>Search</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Extracted Filter Summary Pills (When AI has parsed active criteria) */}
      {extractedFilters && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/40 rounded-xl border border-border/60 animate-in fade-in slide-in-from-top-1 duration-200">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
            AI Interpreted:
          </span>

          {extractedFilters.make && (
            <Badge variant="secondary" className="text-xs bg-teal-500/15 text-teal-300 border-teal-500/30 gap-1">
              <Car className="h-3 w-3" /> Make: {extractedFilters.make}
            </Badge>
          )}

          {extractedFilters.model && (
            <Badge variant="secondary" className="text-xs bg-teal-500/15 text-teal-300 border-teal-500/30 gap-1">
              Model: {extractedFilters.model}
            </Badge>
          )}

          {extractedFilters.bodyType && (
            <Badge variant="secondary" className="text-xs bg-blue-500/15 text-blue-300 border-blue-500/30 gap-1">
              <Layers className="h-3 w-3" /> {extractedFilters.bodyType.toUpperCase()}
            </Badge>
          )}

          {extractedFilters.maxPrice && (
            <Badge variant="secondary" className="text-xs bg-emerald-500/15 text-emerald-300 border-emerald-500/30 gap-1">
              <Banknote className="h-3 w-3" /> Max: {formatPrice(extractedFilters.maxPrice)}
            </Badge>
          )}

          {extractedFilters.minYear && (
            <Badge variant="secondary" className="text-xs bg-purple-500/15 text-purple-300 border-purple-500/30 gap-1">
              <Calendar className="h-3 w-3" /> Year: {extractedFilters.minYear}+
            </Badge>
          )}

          {extractedFilters.fuelType && (
            <Badge variant="secondary" className="text-xs bg-amber-500/15 text-amber-300 border-amber-500/30 gap-1">
              <Fuel className="h-3 w-3" /> {extractedFilters.fuelType}
            </Badge>
          )}

          {extractedFilters.transmission && (
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 gap-1">
              {extractedFilters.transmission}
            </Badge>
          )}

          {extractedFilters.maxMileage && (
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 gap-1">
              <Gauge className="h-3 w-3" /> &lt; {extractedFilters.maxMileage.toLocaleString()} km
            </Badge>
          )}

          {extractedFilters.country && (
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200 gap-1">
              <MapPin className="h-3 w-3" /> {extractedFilters.country}
            </Badge>
          )}

          <button
            type="button"
            onClick={handleClear}
            className="ml-auto text-[11px] text-muted-foreground hover:text-foreground underline px-1"
          >
            Clear AI Filters
          </button>
        </div>
      )}

      {/* Quick Prompt Suggestion Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[11px] font-medium text-muted-foreground shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="h-3 w-3 text-teal-400" /> Suggestions:
        </span>
        {SUGGESTION_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleChipClick(chip.query)}
            className="shrink-0 rounded-full border border-border/80 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-teal-400/50 hover:bg-teal-500/10 hover:text-teal-300 transition-all shadow-xs"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
