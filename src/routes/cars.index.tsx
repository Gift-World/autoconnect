import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import {
  BookmarkPlus,
  Layers,
  Loader2,
  MapPin,
  MoreHorizontal,
  Navigation,
  Plane,
  PlusCircle,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiSmartSearch } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { COUNTRIES } from "@/lib/countries";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { CarCard, CarCardSkeleton } from "@/components/CarCard";
import { VehicleDrawer, type DrawerCar } from "@/components/drawer/VehicleDrawer";
import { PriceRangeSlider } from "@/components/filter/PriceRangeSlider";
import {
  ActiveFilterChips,
  getActiveFilterChips,
} from "@/components/filter/ActiveFilterChips";
import { QuickListingModal } from "@/components/listing/QuickListingModal";
import {
  parseNaturalLanguage,
  type ParsedAiFilters,
} from "@/components/search/AiCarFinderSearchBar";
import { SmartSearchBar } from "@/components/search/SmartSearchBar";
import { TradeInEstimatorModal } from "@/components/estimator/TradeInEstimatorModal";
import { SwipeBrowseMode } from "@/components/browse/SwipeBrowseMode";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  country: fallback(z.string(), "").default(""),
  make: fallback(z.string(), "").default(""),
  condition: fallback(z.string(), "").default(""),
  minPrice: z.number().optional().catch(undefined),
  maxPrice: z.number().optional().catch(undefined),
  minYear: z.number().optional().catch(undefined),
  maxYear: z.number().optional().catch(undefined),
  exportOnly: fallback(z.boolean(), false).default(false),
  rhd: fallback(z.string(), "").default(""),
  near: fallback(z.number(), 0).default(0),
});

export const Route = createFileRoute("/cars/")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Browse Cars — AutoConnect" },
      {
        name: "description",
        content:
          "Browse verified car listings from sellers worldwide. Filter by country, make, price, and export availability.",
      },
      { property: "og:title", content: "Browse Cars — AutoConnect" },
      {
        property: "og:description",
        content: "Verified global car listings — buy locally or import directly.",
      },
    ],
  }),
  component: CarsListPage,
});

type CarRow = {
  id: string;
  title: string;
  make_name: string | null;
  model_name: string | null;
  year: number;
  price: number;
  currency: string;
  country: string;
  city: string | null;
  location_display: string | null;
  mileage: number | null;
  mileage_unit: string;
  transmission: string | null;
  fuel_type: string | null;
  body_type: string | null;
  condition: string | null;
  steering_side: string | null;
  right_hand_drive: boolean;
  available_for_export: boolean;
  featured: boolean;
  is_premium?: boolean;
  is_sample?: boolean;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
};

type SearchState = z.infer<typeof searchSchema>;

function primaryImage(car: CarRow): string | null {
  if (!car.car_images?.length) return null;
  const p = car.car_images.find((i) => i.is_primary);
  const sorted = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
  return (p ?? sorted[0])?.image_url ?? null;
}

/** Plain-language labels for what smart search understood (shown under the search box). */
function describeFilters(filters: Record<string, unknown>): string[] {
  const labels: Record<string, string> = {
    make: "Make",
    model: "Model",
    bodyType: "Body",
    minPrice: "Min price",
    maxPrice: "Max price",
    minYear: "From",
    maxYear: "To",
    maxMileage: "Max km",
    transmission: "Gearbox",
    fuelType: "Fuel",
    country: "Country",
    rhd: "Steering",
    exportOnly: "Export only",
    condition: "Condition",
  };
  return Object.entries(filters)
    .filter(([k, v]) => k !== "q" && v !== undefined && v !== "" && v !== false)
    .map(([k, v]) =>
      k === "exportOnly"
        ? "Export only"
        : `${labels[k] ?? k}: ${typeof v === "number" ? v.toLocaleString() : String(v)}`,
    );
}

function CarsListPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [qInput, setQInput] = useState(search.q);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [drawerCar, setDrawerCar] = useState<DrawerCar | null>(null);
  const [quickListOpen, setQuickListOpen] = useState(false);
  const [tradeInOpen, setTradeInOpen] = useState(false);
  const [swipeModeOpen, setSwipeModeOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [interpreted, setInterpreted] = useState<string[] | null>(null);

  const saveSearch = () => {
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value !== "" && value !== false && value !== 0 && value != null)
        params.set(key, String(value));
    });
    let saved: { label: string; query: string; savedAt: string }[] = [];
    try {
      const stored = JSON.parse(localStorage.getItem("autoconnect_saved_searches") ?? "[]");
      if (Array.isArray(stored)) saved = stored;
    } catch {
      // Ignore malformed browser storage and start a new saved-search list.
    }
    const query = params.toString();
    if (!saved.some((item) => item.query === query)) {
      saved.unshift({
        label: qInput.trim() || "Vehicle search",
        query,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem("autoconnect_saved_searches", JSON.stringify(saved.slice(0, 12)));
    }
    toast.success("Search saved in this browser", {
      description:
        "Sign in and connect notification delivery before offering email or WhatsApp alerts.",
    });
  };

  useEffect(() => {
    setQInput(search.q);
  }, [search.q]);

  function requestNearMe() {
    if (!("geolocation" in navigator)) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoLoading(false);
        if (!search.near) updateSearch({ near: 50 });
      },
      () => {
        setGeoLoading(false);
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const { data: makes } = useQuery({
    queryKey: ["car_makes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("car_makes").select("id, name").order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const handleAiFilters = (filters: ParsedAiFilters) => {
    updateSearch({
      q: filters.q !== undefined ? filters.q : undefined,
      make: filters.make !== undefined ? filters.make : undefined,
      minPrice: filters.minPrice !== undefined ? filters.minPrice : undefined,
      maxPrice: filters.maxPrice !== undefined ? filters.maxPrice : undefined,
      minYear: filters.minYear !== undefined ? filters.minYear : undefined,
      maxYear: filters.maxYear !== undefined ? filters.maxYear : undefined,
      exportOnly: filters.exportOnly !== undefined ? filters.exportOnly : undefined,
      rhd: filters.rhd !== undefined ? filters.rhd : undefined,
      country: filters.country !== undefined ? filters.country : undefined,
    });
  };

  const [aiSearching, setAiSearching] = useState(false);
  /**
   * One smart search: the server AI (aiSmartSearch) turns plain words into filters.
   * If it is unavailable, the on-device parser keeps search working.
   */
  const runSmartSearch = async (text?: string) => {
    const q = (text ?? qInput).trim();
    if (!q) return;
    setQInput(q);
    setAiSearching(true);
    try {
      const filters = await aiSmartSearch({ data: { query: q } });
      const patch: Record<string, unknown> = {
        q: filters.q ?? "",
        country: filters.country ?? "",
        make: filters.make ?? "",
        condition: filters.condition ?? "",
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        exportOnly: filters.exportOnly ?? false,
        rhd: filters.rhd ?? "",
      };
      updateSearch(patch);
      const applied = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== "" && v !== false)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ");
      setInterpreted(describeFilters(filters as Record<string, unknown>));
      toast.success("AI applied filters", { description: applied || "Search updated" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI search failed";
      const parsed = parseNaturalLanguage(q);
      handleAiFilters(parsed);
      setInterpreted(describeFilters(parsed as Record<string, unknown>));
      toast.warning("AI search is unavailable, so we matched your words on this device", {
        description: msg,
      });
    } finally {
      setAiSearching(false);
    }
  };

  const {
    data: cars,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cars", search],
    queryFn: async () => {
      let query = supabase
        .from("cars")
        .select(
          "id,is_sample,title,make_name,model_name,year,price,currency,country,city,location_display,mileage,mileage_unit,transmission,fuel_type,condition,steering_side,right_hand_drive,available_for_export,featured,created_at,latitude,longitude,car_images(image_url,is_primary,sort_order)",
        )
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);

      if (search.q.trim()) {
        const q = `%${search.q.trim()}%`;
        query = query.or(`title.ilike.${q},make_name.ilike.${q},model_name.ilike.${q}`);
      }
      if (search.country) query = query.eq("country", search.country);
      if (search.make) query = query.eq("make_name", search.make);
      if (search.condition) query = query.eq("condition", search.condition);
      if (search.minPrice != null) query = query.gte("price", search.minPrice);
      if (search.maxPrice != null) query = query.lte("price", search.maxPrice);
      if (search.minYear != null) query = query.gte("year", search.minYear);
      if (search.maxYear != null) query = query.lte("year", search.maxYear);
      if (search.exportOnly) query = query.eq("available_for_export", true);
      if (search.rhd === "right") query = query.eq("right_hand_drive", true);
      if (search.rhd === "left") query = query.eq("right_hand_drive", false);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as CarRow[];
    },
  });

  const updateSearch = (patch: Record<string, unknown>) => {
    navigate({
      search: ((prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        for (const k of Object.keys(next)) {
          if (next[k] === "" || next[k] === undefined || next[k] === false) {
            delete next[k];
          }
        }
        return next;
      }) as never,
    });
  };

  const resetAll = () => {
    setInterpreted(null);
    navigate({ search: {} as never });
  };

  const activeCount = getActiveFilterChips(search).length;
  const hasFilters = activeCount > 0;

  const { displayedCars, distances } = useMemo(() => {
    let list = cars ? [...cars] : [];
    try {
      const custom = JSON.parse(localStorage.getItem("autoconnect_custom_listings") || "[]");
      if (Array.isArray(custom) && custom.length > 0) {
        list = [...custom, ...list];
      }
    } catch {
      // Ignore malformed local listings.
    }

    const dist = new Map<string, number>();
    if (!search.near || !userCoords) return { displayedCars: list, distances: dist };
    const R = 6371; // km
    const toRad = (n: number) => (n * Math.PI) / 180;
    const sorted = list
      .map((c) => {
        if (c.latitude == null || c.longitude == null) return { c, d: Infinity };
        const dLat = toRad(c.latitude - userCoords.lat);
        const dLng = toRad(c.longitude - userCoords.lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userCoords.lat)) * Math.cos(toRad(c.latitude)) * Math.sin(dLng / 2) ** 2;
        const d = 2 * R * Math.asin(Math.sqrt(a));
        return { c, d };
      })
      .filter((x) => x.d <= search.near)
      .sort((a, b) => a.d - b.d);
    sorted.forEach((x) => dist.set(x.c.id, x.d));
    return { displayedCars: sorted.map((x) => x.c), distances: dist };
  }, [cars, search.near, userCoords]);

  const nearActive = !!search.near && !!userCoords;
  const count = displayedCars?.length ?? 0;

  const clearNear = () => {
    setUserCoords(null);
    updateSearch({ near: 0 });
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] px-4 pb-20 pt-4 sm:px-6 sm:pt-8">
      {/* Title row */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="brand-kicker hidden text-muted-foreground sm:block">
            Global vehicle marketplace
          </p>
          <h1 className="font-brand text-3xl text-foreground sm:mt-2 sm:text-5xl">
            Find your next car.
          </h1>
          <p className="mt-2 hidden max-w-xl text-base leading-7 text-muted-foreground md:block">
            Search live marketplace listings, compare the information supplied, then decide your
            next step at your pace.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-foreground/40"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={() => setTradeInOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4 text-foreground" /> What's your car worth?
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={() => setSwipeModeOpen(true)}>
              <Layers className="mr-2 h-4 w-4" /> Swipe mode
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={saveSearch}>
              <BookmarkPlus className="mr-2 h-4 w-4" /> Save this search
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="min-h-11 rounded-xl" onSelect={() => setQuickListOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> List a vehicle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* One smart search */}
      <SmartSearchBar
        className="mt-4 sm:mt-6"
        value={qInput}
        onValueChange={setQInput}
        onSearch={(text) => void runSmartSearch(text)}
        onClear={() => {
          setInterpreted(null);
          updateSearch({ q: "" });
        }}
        searching={aiSearching}
        interpreted={interpreted}
      />

      {/* Compact chip row */}
      <div className="no-scrollbar -mx-4 mt-3 flex items-center gap-2 overflow-x-auto px-4 py-1 sm:-mx-6 sm:px-6">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-foreground/40"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ac-accent px-1 text-[11px] font-extrabold text-ac-ink">
              {activeCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSwipeModeOpen(true)}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-ac-ink px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <Layers className="h-4 w-4 text-ac-accent" /> Swipe
        </button>
        {!nearActive && (
          <QuickChip onClick={requestNearMe} disabled={geoLoading}>
            {geoLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4" />
            )}
            Near me
          </QuickChip>
        )}
        {!search.exportOnly && (
          <QuickChip onClick={() => updateSearch({ exportOnly: true })}>
            <Plane className="h-4 w-4" /> Export ready
          </QuickChip>
        )}
        {!search.rhd && (
          <QuickChip onClick={() => updateSearch({ rhd: "right" })}>Right-hand drive</QuickChip>
        )}
        <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden />
        <ActiveFilterChips
          variant="inline"
          search={search}
          onRemove={(key) => {
            if (key === "near") {
              clearNear();
              return;
            }
            if (key === "q") setInterpreted(null);
            updateSearch(
              key === "minYear" ? { minYear: undefined, maxYear: undefined } : { [key]: undefined },
            );
          }}
          onResetAll={resetAll}
        />
      </div>

      {/* Result summary */}
      <div className="mt-3 flex min-h-11 items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground" aria-live="polite">
          {isLoading
            ? "Finding cars…"
            : isError
              ? "Listings unavailable"
              : `${count} car${count === 1 ? "" : "s"}${nearActive ? ` within ${search.near} km` : ""}`}
        </p>
        <button
          type="button"
          onClick={saveSearch}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <BookmarkPlus className="h-4 w-4" /> Save search
        </button>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="mt-2 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      ) : isError && count === 0 ? (
        <div className="mx-auto mt-6 max-w-2xl rounded-[28px] border border-border bg-card p-8 text-center sm:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ac-apricot text-ac-ink">
            <RefreshCw className="h-6 w-6" />
          </span>
          <h2 className="font-brand mt-5 text-2xl sm:text-3xl">We couldn't load listings.</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This is a connection problem, not an empty search. Try again in a moment.
          </p>
          <Button
            type="button"
            onClick={() => void refetch()}
            className="mt-6 h-11 rounded-full bg-ac-accent px-6 font-bold text-ac-ink hover:bg-ac-accent/90"
          >
            Try again
          </Button>
        </div>
      ) : count === 0 ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[28px] border border-border bg-card p-8 sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ac-cream text-ac-ink">
              <Search className="h-5 w-5" />
            </span>
            <h2 className="font-brand mt-5 text-2xl sm:text-3xl">
              {hasFilters ? "No cars match your exact filters." : "No cars are listed yet."}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {hasFilters
                ? "We couldn't find any current listings that match. Try widening your search criteria."
                : "New listings appear here as soon as they are approved. Describe what you want and we'll filter for it."}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {hasFilters && (
                <Button
                  variant="outline"
                  className="h-11 rounded-full px-5"
                  onClick={resetAll}
                >
                  <X className="mr-2 h-4 w-4" /> Reset all filters
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 rounded-full px-5"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" /> Adjust filters
              </Button>
            </div>
          </div>
          <div className="rounded-[28px] bg-ac-ink p-8 text-white sm:p-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-ac-accent">
              <Plane className="h-5 w-5" />
            </span>
            <p className="brand-kicker mt-5 text-ac-accent">Can't find it locally?</p>
            <h3 className="font-brand mt-2 text-2xl sm:text-3xl">Import exactly what you want.</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              AutoConnect's global sourcing team can find and import exactly what you're looking
              for. We handle the purchase, shipping, duties, and delivery.
            </p>
            <Button
              className="mt-6 h-11 rounded-full bg-ac-accent px-6 font-bold text-ac-ink hover:bg-ac-accent/90"
              onClick={() => document.getElementById("ai-search-input")?.focus()}
            >
              <Sparkles className="mr-2 h-4 w-4" /> Tell AI what you want to import
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedCars.map((car, i) => (
            <CarCard
              key={car.id}
              car={car}
              priority={i < 4}
              distanceKm={distances.get(car.id)}
              onQuickView={(c) => setDrawerCar(c as unknown as DrawerCar)}
            />
          ))}
        </div>
      )}

      {/* How browsing works */}
      <div className="mt-14 grid gap-3 sm:grid-cols-3">
        {[
          { icon: Search, title: "Search by make, budget or use", tone: "bg-ac-cream" },
          { icon: Scale, title: "Compare before you contact", tone: "bg-ac-powder" },
          { icon: ShieldCheck, title: "Evidence shown per listing", tone: "bg-ac-stone" },
        ].map(({ icon: Icon, title, tone }) => (
          <div key={title} className={cn("flex items-center gap-3 rounded-3xl p-5 text-ac-ink", tone)}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/70">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-sm font-bold">{title}</p>
          </div>
        ))}
      </div>

      {/* Filters sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <SheetTitle className="font-brand text-2xl">Filters</SheetTitle>
            <SheetDescription>Narrow the list. Changes apply straight away.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            <NearMeControl
              radius={search.near}
              userCoords={userCoords}
              loading={geoLoading}
              onLocate={requestNearMe}
              onRadius={(n) => updateSearch({ near: n })}
              onClear={clearNear}
            />
            <FilterFields search={search} updateSearch={updateSearch} makes={makes ?? []} />
          </div>
          <div className="flex items-center gap-3 border-t border-border px-5 py-4">
            <button
              type="button"
              onClick={resetAll}
              disabled={!hasFilters}
              className="h-11 rounded-full px-3 text-sm font-semibold text-foreground underline-offset-4 hover:underline disabled:opacity-40"
            >
              Reset all
            </button>
            <Button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="h-12 flex-1 rounded-full bg-ac-accent font-extrabold text-ac-ink hover:bg-ac-accent/90"
            >
              {isLoading ? "Show cars" : `Show ${count} car${count === 1 ? "" : "s"}`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Interactive Detail Drawer */}
      <VehicleDrawer car={drawerCar} isOpen={!!drawerCar} onClose={() => setDrawerCar(null)} />

      {/* Quick Showroom Listing Modal */}
      <QuickListingModal isOpen={quickListOpen} onClose={() => setQuickListOpen(false)} />

      {/* Trade-In Estimator Modal */}
      <TradeInEstimatorModal open={tradeInOpen} onOpenChange={setTradeInOpen} />

      {/* Swipe-to-Browse Experience */}
      {swipeModeOpen && (
        <SwipeBrowseMode
          cars={(cars || []).map((c) => ({
            id: c.id,
            title: c.title,
            year: c.year,
            price: Number(c.price),
            currency: c.currency,
            location_display: c.location_display,
            country: c.country,
            mileage: c.mileage,
            mileage_unit: c.mileage_unit,
            transmission: c.transmission,
            fuel_type: c.fuel_type,
            image_url: primaryImage(c) ?? undefined,
            is_sample: (c as { is_sample?: boolean }).is_sample === true,
          }))}
          onExit={() => setSwipeModeOpen(false)}
        />
      )}
    </div>
  );
}

function QuickChip({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:border-foreground/40 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

function FilterFields({
  search,
  updateSearch,
  makes,
}: {
  search: SearchState;
  updateSearch: (patch: Record<string, unknown>) => void;
  makes: { id: string; name: string }[];
}) {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Country</Label>
        <Select
          value={search.country || "all"}
          onValueChange={(v) => updateSearch({ country: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.flag} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Make</Label>
        <Select
          value={search.make || "all"}
          onValueChange={(v) => updateSearch({ make: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="All makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All makes</SelectItem>
            {makes.map((m) => (
              <SelectItem key={m.id} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Condition</Label>
        <Select
          value={search.condition || "all"}
          onValueChange={(v) => updateSearch({ condition: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Any condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any condition</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="foreign-used">Foreign-used</SelectItem>
            <SelectItem value="locally-used">Locally-used</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <PriceRangeSlider
        maxPrice={search.maxPrice}
        onChange={(val) => updateSearch({ maxPrice: val })}
        min={0}
        max={100000}
        step={2500}
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Year from</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="1990"
            className="h-11 rounded-xl"
            value={search.minYear ?? ""}
            onChange={(e) =>
              updateSearch({
                minYear: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Year to</Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="2026"
            className="h-11 rounded-xl"
            value={search.maxYear ?? ""}
            onChange={(e) =>
              updateSearch({
                maxYear: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">Steering</Label>
        <Select
          value={search.rhd || "all"}
          onValueChange={(v) => updateSearch({ rhd: v === "all" ? "" : v })}
        >
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="LHD or RHD" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">LHD or RHD</SelectItem>
            <SelectItem value="left">Left-hand drive (LHD)</SelectItem>
            <SelectItem value="right">Right-hand drive (RHD)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex min-h-12 items-center justify-between rounded-2xl border border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-foreground" />
          <Label htmlFor="exportOnly" className="cursor-pointer text-sm">
            Available for export
          </Label>
        </div>
        <Switch
          id="exportOnly"
          checked={search.exportOnly}
          onCheckedChange={(v) => updateSearch({ exportOnly: v })}
        />
      </div>
    </>
  );
}

function NearMeControl({
  radius,
  userCoords,
  loading,
  onLocate,
  onRadius,
  onClear,
}: {
  radius: number;
  userCoords: { lat: number; lng: number } | null;
  loading: boolean;
  onLocate: () => void;
  onRadius: (n: number) => void;
  onClear: () => void;
}) {
  const active = radius > 0 && !!userCoords;
  return (
    <div className="space-y-2 rounded-2xl bg-ac-cream p-4 text-ac-ink">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ac-ink">
          <Navigation className="h-3.5 w-3.5 text-ac-ink" /> Near me
        </Label>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 px-2 text-xs font-semibold text-ac-ink/70 hover:text-ac-ink"
          >
            Clear
          </button>
        )}
      </div>
      {!userCoords ? (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full rounded-full border-ac-ink/20 bg-white text-ac-ink hover:bg-white/80"
          onClick={onLocate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-1.5 h-4 w-4" />
          )}
          Use my location
        </Button>
      ) : (
        <Select value={String(radius || 50)} onValueChange={(v) => onRadius(Number(v))}>
          <SelectTrigger className="h-11 rounded-xl bg-white text-ac-ink">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">Within 25 km</SelectItem>
            <SelectItem value="50">Within 50 km</SelectItem>
            <SelectItem value="100">Within 100 km</SelectItem>
            <SelectItem value="250">Within 250 km</SelectItem>
            <SelectItem value="500">Within 500 km</SelectItem>
          </SelectContent>
        </Select>
      )}
      <p className="text-[11px] leading-relaxed text-ac-ink/70">
        Filters listings with known coordinates. Some listings show city only.
      </p>
    </div>
  );
}
