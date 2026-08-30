import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Gauge, Plane, Filter, X, Navigation, Loader2, Sparkles, BookmarkPlus, PlusCircle, Eye, ChevronLeft, ChevronRight, Scale } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiSmartSearch } from "@/lib/ai.functions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, countryByCode } from "@/lib/countries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { VehicleDrawer, type DrawerCar } from "@/components/drawer/VehicleDrawer";
import { PriceRangeSlider } from "@/components/filter/PriceRangeSlider";
import { ActiveFilterChips } from "@/components/filter/ActiveFilterChips";
import { QuickListingModal } from "@/components/listing/QuickListingModal";
import { AiCarFinderSearchBar, type ParsedAiFilters } from "@/components/search/AiCarFinderSearchBar";
import { AutoConnectScoreBadge } from "@/components/trust/AutoConnectScoreBadge";
import { TradeInEstimatorModal } from "@/components/estimator/TradeInEstimatorModal";
import { SwipeBrowseMode } from "@/components/browse/SwipeBrowseMode";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useVehicleComparison } from "@/contexts/ComparisonContext";

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
  condition: string | null;
  steering_side: string | null;
  right_hand_drive: boolean;
  available_for_export: boolean;
  featured: boolean;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  car_images: { image_url: string; is_primary: boolean; sort_order: number }[];
};

type SearchState = z.infer<typeof searchSchema>;

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString()}`;
  }
}

function primaryImage(car: CarRow): string | null {
  if (!car.car_images?.length) return null;
  const p = car.car_images.find((i) => i.is_primary);
  const sorted = [...car.car_images].sort((a, b) => a.sort_order - b.sort_order);
  return (p ?? sorted[0])?.image_url ?? null;
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

  const saveSearch = () => {
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => {
      if (value !== "" && value !== false && value !== 0 && value != null) params.set(key, String(value));
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
      saved.unshift({ label: qInput.trim() || "Vehicle search", query, savedAt: new Date().toISOString() });
      localStorage.setItem("autoconnect_saved_searches", JSON.stringify(saved.slice(0, 12)));
    }
    toast.success("Search saved in this browser", { description: "Sign in and connect notification delivery before offering email or WhatsApp alerts." });
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
      const { data, error } = await supabase
        .from("car_makes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const [aiSearching, setAiSearching] = useState(false);
  const runSmartSearch = async () => {
    const q = qInput.trim();
    if (!q) return;
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
      toast.success("AI applied filters", { description: applied || "Search updated" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "AI search failed";
      toast.error(msg);
    } finally {
      setAiSearching(false);
    }
  };

  const { data: cars, isLoading } = useQuery({
    queryKey: ["cars", search],
    queryFn: async () => {
      let query = supabase
        .from("cars")
        .select(
          "id,title,make_name,model_name,year,price,currency,country,city,location_display,mileage,mileage_unit,transmission,fuel_type,condition,steering_side,right_hand_drive,available_for_export,featured,created_at,latitude,longitude,car_images(image_url,is_primary,sort_order)",
        )
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(60);

      if (search.q.trim()) {
        const q = `%${search.q.trim()}%`;
        query = query.or(
          `title.ilike.${q},make_name.ilike.${q},model_name.ilike.${q}`,
        );
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

  const hasFilters = !!(
    search.q ||
    search.country ||
    search.make ||
    search.condition ||
    search.minPrice ||
    search.maxPrice ||
    search.minYear ||
    search.maxYear ||
    search.exportOnly ||
    search.rhd ||
    search.near
  );

  const displayedCars = useMemo(() => {
    let list = cars ? [...cars] : [];
    try {
      const custom = JSON.parse(localStorage.getItem("autoconnect_custom_listings") || "[]");
      if (Array.isArray(custom) && custom.length > 0) {
        list = [...custom, ...list];
      }
    } catch (_) {}

    if (!search.near || !userCoords) return list;
    const R = 6371; // km
    const toRad = (n: number) => (n * Math.PI) / 180;
    return list
      .map((c) => {
        if (c.latitude == null || c.longitude == null) return { c, d: Infinity };
        const dLat = toRad(c.latitude - userCoords.lat);
        const dLng = toRad(c.longitude - userCoords.lng);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userCoords.lat)) *
            Math.cos(toRad(c.latitude)) *
            Math.sin(dLng / 2) ** 2;
        const d = 2 * R * Math.asin(Math.sqrt(a));
        return { c, d };
      })
      .filter((x) => x.d <= search.near)
      .sort((a, b) => a.d - b.d)
      .map((x) => x.c);
  }, [cars, search.near, userCoords]);

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

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Browse Cars</h1>
          <p className="text-sm text-muted-foreground">
            Verified listings from sellers worldwide.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={() => setTradeInOpen(true)}
            className="gap-1.5 text-xs font-semibold rounded-xl border-teal-500/40 text-teal-400 hover:bg-teal-500/10"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>What's Your Car Worth?</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSwipeModeOpen(true)}
            className="gap-1.5 text-xs font-semibold rounded-xl md:hidden border-slate-700 bg-slate-900 text-slate-200"
          >
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>Swipe Mode</span>
          </Button>
          <Button 
            onClick={() => setQuickListOpen(true)} 
            className="gap-2 self-start sm:self-auto font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-md rounded-xl text-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List a Vehicle</span>
          </Button>
        </div>
      </div>

      {/* Prominent Smart AI Car Finder Bar */}
      <AiCarFinderSearchBar
        onApplyFilters={handleAiFilters}
        currentSearchQuery={search.q}
        className="mb-6"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateSearch({ q: qInput.trim() });
        }}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder='Try: "Cheap fuel-efficient Toyota under $8k from Japan, RHD" or just "BMW X5"'
            className="h-11 pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11"
          onClick={() => runSmartSearch()}
          disabled={aiSearching || !qInput.trim()}
          title="AI smart search"
        >
          {aiSearching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4 text-accent" />
          )}
          Ask AI
        </Button>
        <Button type="submit" className="h-11">
          <Search className="mr-2 h-4 w-4" /> Search
        </Button>
        <Button type="button" variant="outline" className="h-11" onClick={saveSearch}>
          <BookmarkPlus className="mr-2 h-4 w-4" /> Save search
        </Button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Filter className="h-4 w-4" /> Filters
            </h2>
            {hasFilters && (
              <button
                type="button"
                onClick={() => navigate({ search: {} as never })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            )}
          </div>
          <NearMeControl
            radius={search.near}
            userCoords={userCoords}
            loading={geoLoading}
            onLocate={requestNearMe}
            onRadius={(n) => updateSearch({ near: n })}
            onClear={() => {
              setUserCoords(null);
              updateSearch({ near: 0 });
            }}
          />
          <FilterFields search={search} updateSearch={updateSearch} makes={makes ?? []} />
        </aside>

        <section>
          {/* Active Filter Chips Bar */}
          <ActiveFilterChips
            search={search}
            onRemove={(key) => updateSearch({ [key]: undefined })}
            onResetAll={() => navigate({ search: {} as never })}
          />

          <div className="mb-3 flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span className="truncate">
              {isLoading
                ? "Loading…"
                : `${displayedCars?.length ?? 0} listing${(displayedCars?.length ?? 0) === 1 ? "" : "s"}${search.near && userCoords ? ` within ${search.near} km` : ""}`}
            </span>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" /> Filters
                  {hasFilters && (
                    <span className="ml-1.5 h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center justify-between">
                    <span>Filters</span>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => navigate({ search: {} as never })}
                        className="text-xs font-normal text-muted-foreground hover:text-foreground"
                      >
                        Reset all
                      </button>
                    )}
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-5 pb-4">
                  <NearMeControl
                    radius={search.near}
                    userCoords={userCoords}
                    loading={geoLoading}
                    onLocate={requestNearMe}
                    onRadius={(n) => updateSearch({ near: n })}
                    onClear={() => {
                      setUserCoords(null);
                      updateSearch({ near: 0 });
                    }}
                  />
                  <FilterFields search={search} updateSearch={updateSearch} makes={makes ?? []} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-2 p-4">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !displayedCars || displayedCars.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-base font-semibold">No cars match your filters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try widening your search or reset filters.
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate({ search: {} as never })}
                >
                  <X className="mr-2 h-4 w-4" /> Reset filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {displayedCars.map((car) => (
                <CarCard 
                  key={car.id} 
                  car={car} 
                  onQuickView={(c) => setDrawerCar(c as any)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Interactive Detail Drawer */}
      <VehicleDrawer
        car={drawerCar}
        isOpen={!!drawerCar}
        onClose={() => setDrawerCar(null)}
      />

      {/* Quick Showroom Listing Modal */}
      <QuickListingModal
        isOpen={quickListOpen}
        onClose={() => setQuickListOpen(false)}
      />

      {/* Trade-In Estimator Modal */}
      <TradeInEstimatorModal
        open={tradeInOpen}
        onOpenChange={setTradeInOpen}
      />

      {/* Mobile Swipe-to-Browse Experience */}
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
            image_url: primaryImage(c),
          }))}
          onExit={() => setSwipeModeOpen(false)}
        />
      )}
    </div>
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
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Country
        </Label>
        <Select
          value={search.country || "all"}
          onValueChange={(v) => updateSearch({ country: v === "all" ? "" : v })}
        >
          <SelectTrigger>
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
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Make
        </Label>
        <Select
          value={search.make || "all"}
          onValueChange={(v) => updateSearch({ make: v === "all" ? "" : v })}
        >
          <SelectTrigger>
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
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Condition
        </Label>
        <Select
          value={search.condition || "all"}
          onValueChange={(v) => updateSearch({ condition: v === "all" ? "" : v })}
        >
          <SelectTrigger>
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
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Year from
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="1990"
            value={search.minYear ?? ""}
            onChange={(e) =>
              updateSearch({
                minYear: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Year to
          </Label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="2026"
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
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          Steering
        </Label>
        <Select
          value={search.rhd || "all"}
          onValueChange={(v) => updateSearch({ rhd: v === "all" ? "" : v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="LHD or RHD" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">LHD or RHD</SelectItem>
            <SelectItem value="left">Left-hand drive (LHD)</SelectItem>
            <SelectItem value="right">Right-hand drive (RHD)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-accent" />
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

function CarCard({ car, onQuickView }: { car: CarRow; onQuickView?: (car: CarRow) => void }) {
  const { formatPrice } = useCurrency();
  const { toggleCompare, isInComparison } = useVehicleComparison();

  const sorted = [...(car.car_images ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const [imgIdx, setImgIdx] = useState(0);
  const images = sorted.length > 0 ? sorted.map(i => i.image_url) : [];
  const img = images[imgIdx] ?? primaryImage(car);
  const country = countryByCode(car.country);

  const numericPrice = Number(car.price) || 0;
  const isCompared = isInComparison(car.id);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIdx((prev) => (prev + 1) % images.length);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare({
      id: car.id,
      make: car.make_name || car.title.split(" ")[0] || "Vehicle",
      model: car.model_name || car.title.split(" ").slice(1).join(" ") || "",
      year: car.year,
      price: numericPrice,
      mileage: car.mileage,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      body_type: car.body_type,
      country: car.country,
      image_url: img,
      verified: car.featured,
    });
  };

  return (
    <div className="group relative block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to="/cars/$id"
        params={{ id: car.id }}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {img ? (
            <img
              src={img}
              alt={car.title}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No photo
            </div>
          )}

          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 z-10">
            {car.featured && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">
                Featured
              </Badge>
            )}
            {car.available_for_export && (
              <Badge variant="secondary" className="bg-white/95 text-foreground">
                <Plane className="mr-1 h-3 w-3" /> Exportable
              </Badge>
            )}
          </div>
          <div className="absolute right-2 top-2 flex items-center gap-1.5 z-10">
            <button
              type="button"
              onClick={handleCompareClick}
              className={`p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
                isCompared
                  ? "bg-accent text-accent-foreground font-bold ring-2 ring-accent"
                  : "bg-black/60 hover:bg-black text-white/90 border border-white/20"
              }`}
              title={isCompared ? "Remove from comparison" : "Add to comparison"}
            >
              <Scale className="h-3.5 w-3.5" />
            </button>
            <Badge
              variant="outline"
              className="border-white/40 bg-black/50 text-white backdrop-blur text-[11px]"
            >
              {car.right_hand_drive ? "RHD" : "LHD"}
            </Badge>
          </div>
          <div className="absolute bottom-2 left-2 z-10">
            <AutoConnectScoreBadge
              vehicleData={{
                condition: car.condition,
                mileage: car.mileage,
                mileage_unit: car.mileage_unit,
                photosCount: images.length || 4,
                isSellerVerified: !!car.featured,
                documentsVerified: true,
                hasVideo: car.featured,
              }}
              variant="compact"
            />
          </div>
          <FavoriteButton carId={car.id} className="absolute bottom-2 right-2 z-10" />

          {/* Multi-Photo Carousel Controls */}
          {images.length > 1 && (
            <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 rounded-full bg-black/75 text-white hover:bg-black border border-white/20 transition-transform active:scale-90"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1 rounded-full bg-black/75 text-white hover:bg-black border border-white/20 transition-transform active:scale-90"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Dots Indicator */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
              {images.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1 rounded-full transition-all ${
                    idx === imgIdx ? "w-3 bg-teal-400" : "w-1 bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {car.year} · {car.condition ?? "—"}
          </p>
          <h3 className="mt-1 line-clamp-1 text-base font-semibold">{car.title}</h3>
          <p className="mt-2 text-lg font-bold text-accent font-mono">
            {formatPrice(numericPrice)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {country?.flag} {car.location_display ?? country?.name ?? car.country}
            </span>
            {car.mileage != null && (
              <span className="inline-flex items-center gap-1">
                <Gauge className="h-3 w-3" />
                {car.mileage.toLocaleString()} {car.mileage_unit}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick View Button */}
      {onQuickView && (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(car);
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-secondary/80 hover:bg-teal-500 hover:text-slate-950 text-xs font-semibold text-muted-foreground transition-all duration-200 border border-border"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Specs & Inquiry</span>
          </button>
        </div>
      )}
    </div>
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
    <div className="space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground">
          <Navigation className="h-3.5 w-3.5 text-accent" /> Near me
        </Label>
        {active && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
      {!userCoords ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onLocate}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <MapPin className="mr-1.5 h-3.5 w-3.5" />
          )}
          Use my location
        </Button>
      ) : (
        <Select
          value={String(radius || 50)}
          onValueChange={(v) => onRadius(Number(v))}
        >
          <SelectTrigger className="h-9">
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
      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Filters listings with known coordinates. Some listings show city only.
      </p>
    </div>
  );
}

