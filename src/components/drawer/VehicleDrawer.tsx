import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { 
  X, 
  MapPin, 
  Gauge, 
  Fuel, 
  Settings2, 
  Calendar, 
  ShieldCheck, 
  Plane, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Share2,
  FileCheck,
  Zap,
  CheckCircle2,
  Scale
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { countryByCode } from "@/lib/countries";
import { DrawerInquiryForm } from "./DrawerInquiryForm";
import { VehicleImage } from "@/components/VehicleImage";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useVehicleComparison } from "@/contexts/ComparisonContext";
import { WhatsAppConcierge } from "@/components/concierge/WhatsAppConcierge";

export type DrawerCar = {
  id: string;
  title: string;
  year: number;
  price: number | string;
  currency: string;
  country: string;
  location_display?: string | null;
  available_for_export?: boolean | null;
  right_hand_drive?: boolean | null;
  featured?: boolean | null;
  mileage?: number | null;
  mileage_unit?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  make_name?: string | null;
  model_name?: string | null;
  body_type?: string | null;
  color?: string | null;
  engine_size?: string | null;
  vin?: string | null;
  car_images?: { image_url: string; is_primary?: boolean; sort_order?: number }[];
  seller?: {
    name?: string;
    phone?: string;
    email?: string;
  };
};

interface VehicleDrawerProps {
  car: DrawerCar | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VehicleDrawer({ car, isOpen, onClose }: VehicleDrawerProps) {
  const { formatPrice } = useCurrency();
  const { toggleCompare, isInComparison } = useVehicleComparison();
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  useEffect(() => {
    setSelectedImgIndex(0);
  }, [car?.id]);

  if (!car) return null;

  const rawImages = car.car_images || [];
  const images = rawImages.length > 0 
    ? rawImages.map(img => img.image_url) 
    : ["/images/hero-driving-suv.jpg"];

  const country = countryByCode(car.country);
  const numericPrice = typeof car.price === "number" ? car.price : parseFloat(car.price) || 0;
  const isCompared = isInComparison(car.id);

  const handleCompareClick = () => {
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
      image_url: images[0],
      verified: car.featured,
    });
  };

  const handlePrev = () => {
    setSelectedImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setSelectedImgIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-xl md:max-w-2xl p-0 overflow-y-auto bg-background text-foreground border-l border-border/80"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{car.title}</SheetTitle>
        </SheetHeader>

        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between p-4 sm:px-6 bg-background/95 backdrop-blur-md border-b border-border/80">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
              <span>{country?.flag ?? "🌐"}</span>
              <span className="truncate">{car.location_display || country?.name || car.country}</span>
              <span>•</span>
              <span className="text-teal-600 dark:text-teal-400 font-bold">{car.year}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate mt-0.5">
              {car.title}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCompareClick}
              className={`rounded-xl h-9 px-2.5 gap-1 text-xs border-border ${
                isCompared ? "bg-accent text-accent-foreground font-bold border-accent" : ""
              }`}
              title="Compare vehicle"
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCompared ? "Compared" : "Compare"}</span>
            </Button>
            <FavoriteButton carId={car.id} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 pb-24">
          
          {/* 1. Image Stage Carousel */}
          <div className="space-y-2">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-900 border border-border/60 shadow-lg group">
              <VehicleImage
                src={images[selectedImgIndex]}
                alt={`${car.title} view ${selectedImgIndex + 1}`}
                make={car.make_name}
                model={car.model_name}
                year={car.year}
                bodyType={car.body_type}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
                  <button
                    onClick={handlePrev}
                    className="pointer-events-auto p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-sm transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="pointer-events-auto p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 backdrop-blur-sm transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[11px] font-mono backdrop-blur-sm">
                {selectedImgIndex + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 pt-1">
                {images.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIndex(idx)}
                    className={`relative aspect-[16/10] rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImgIndex === idx 
                        ? "border-teal-500 shadow-sm" 
                        : "border-border/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Price and Status Callout */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/80">
            <div>
              <span className="text-[11px] uppercase font-bold text-muted-foreground block tracking-wider">
                Listed Price
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-mono">
                {formatPrice(numericPrice)}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 font-bold text-xs">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Escrow Protected
              </Badge>
              <WhatsAppConcierge
                car={{
                  id: car.id,
                  make: car.make_name || car.title.split(" ")[0] || "Vehicle",
                  model: car.model_name || car.title.split(" ").slice(1).join(" ") || "",
                  year: car.year,
                  price: numericPrice,
                  location: car.location_display || car.country,
                  seller_phone: car.seller?.phone,
                  seller_whatsapp: car.seller?.phone,
                }}
                compact
                className="h-8 text-xs py-1 px-2.5 rounded-lg"
              />
            </div>
          </div>

          {/* 3. Comprehensive Specifications Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-teal-500" />
              <span>Vehicle Specifications</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Mileage</span>
                <span className="text-xs font-bold text-foreground">
                  {car.mileage ? `${car.mileage.toLocaleString()} ${car.mileage_unit || "km"}` : "N/A"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Transmission</span>
                <span className="text-xs font-bold text-foreground">
                  {car.transmission || "Automatic"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Fuel / Powertrain</span>
                <span className="text-xs font-bold text-foreground">
                  {car.fuel_type || "Gasoline"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Steering Position</span>
                <span className="text-xs font-bold text-foreground">
                  {car.right_hand_drive ? "Right-Hand (RHD)" : "Left-Hand (LHD)"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Engine Displacement</span>
                <span className="text-xs font-bold text-foreground">
                  {car.engine_size || "Performance"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Body Type</span>
                <span className="text-xs font-bold text-foreground">
                  {car.body_type || "Vehicle"}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Verification Check Badges */}
          <div className="p-4 rounded-xl border border-border/80 bg-card space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-teal-500" />
              <span>Inspection & Title Guarantee</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Clean Title Record</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>150-Pt Physical Diagnostic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure Escrow Deposit</span>
              </div>
            </div>
          </div>

          {/* 5. In-Drawer Private Inquiry Block */}
          <DrawerInquiryForm
            carId={car.id}
            carTitle={car.title}
            sellerName={car.seller?.name || "AutoConnect Certified Dealership"}
            sellerPhone={car.seller?.phone}
            sellerEmail={car.seller?.email}
          />

        </div>

        {/* Sticky Drawer Footer with Full Page Action */}
        <div className="sticky bottom-0 z-30 flex items-center justify-between p-4 sm:px-6 bg-background/95 backdrop-blur-md border-t border-border/80">
          <div>
            <span className="text-[11px] text-muted-foreground block">Need full inspection breakdown?</span>
            <span className="text-xs font-bold text-foreground">View passport & deposit options</span>
          </div>

          <Link
            to="/cars/$id"
            params={{ id: car.id }}
            onClick={onClose}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <span>Full Car Profile & Escrow</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </SheetContent>
    </Sheet>
  );
}
