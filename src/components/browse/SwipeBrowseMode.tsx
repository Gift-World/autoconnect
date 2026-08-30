import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Heart,
  X,
  ChevronUp,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Gauge,
  Layers,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SwipeCar {
  id: string;
  title: string;
  year: number;
  price: number;
  currency: string;
  location_display?: string | null;
  country?: string;
  mileage?: number | null;
  mileage_unit?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  image_url?: string;
}

interface SwipeBrowseModeProps {
  cars: SwipeCar[];
  onExit: () => void;
}

export function SwipeBrowseMode({ cars, onExit }: SwipeBrowseModeProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeFeedback, setSwipeFeedback] = useState<"like" | "skip" | "details" | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // Touch coordinates
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);

  const currentCar = cars[currentIndex] || cars[0];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;

    // Horizontal threshold (swipe left or right)
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        // Swipe Right -> Like / Save Favorite
        triggerLike();
      } else {
        // Swipe Left -> Skip
        triggerSkip();
      }
    } else if (deltaY < -70 && Math.abs(deltaY) > Math.abs(deltaX)) {
      // Swipe Up -> View Details
      triggerDetails();
    }
  };

  const triggerLike = () => {
    setSwipeFeedback("like");
    toast.success("Saved to Favorites ❤️", {
      description: `${currentCar?.title} added to your wishlist.`,
    });
    setTimeout(() => {
      setSwipeFeedback(null);
      advanceNext();
    }, 300);
  };

  const triggerSkip = () => {
    setSwipeFeedback("skip");
    setTimeout(() => {
      setSwipeFeedback(null);
      advanceNext();
    }, 300);
  };

  const triggerDetails = () => {
    setSwipeFeedback("details");
    setTimeout(() => {
      void navigate({ to: `/cars/${currentCar?.id}` as never });
    }, 200);
  };

  const advanceNext = () => {
    if (currentIndex < cars.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast.info("You've viewed all vehicles in this stack!", {
        description: "Looping back to the beginning.",
      });
      setCurrentIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 text-white select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs font-mono">
            {currentIndex + 1} of {cars.length} Cars
          </Badge>
          <span className="text-xs font-bold text-slate-300">Swipe Mode</span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExit}
          className="h-8 rounded-full border-slate-700 bg-slate-900 text-xs font-bold text-white hover:bg-slate-800"
        >
          <X className="h-3.5 w-3.5 mr-1" /> Exit
        </Button>
      </div>

      {/* Main Swipeable Card Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative flex-1 my-3 max-w-sm mx-auto w-full rounded-3xl overflow-hidden border border-white/10 bg-slate-900 shadow-2xl flex flex-col justify-end transition-transform"
      >
        {/* Car Image */}
        <div className="absolute inset-0">
          <img
            src={
              currentCar?.image_url ||
              "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80"
            }
            alt={currentCar?.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        </div>

        {/* Swipe Visual Feedback Badges */}
        {swipeFeedback === "like" && (
          <div className="absolute inset-0 bg-emerald-950/60 backdrop-blur-xs flex items-center justify-center animate-in zoom-in-50 duration-200">
            <div className="p-4 rounded-full bg-emerald-500 text-slate-950 shadow-2xl animate-bounce">
              <Heart className="h-16 w-16 fill-current" />
            </div>
          </div>
        )}

        {swipeFeedback === "skip" && (
          <div className="absolute inset-0 bg-rose-950/60 backdrop-blur-xs flex items-center justify-center animate-in zoom-in-50 duration-200">
            <div className="p-4 rounded-full bg-rose-500 text-white shadow-2xl">
              <X className="h-16 w-16 stroke-[3]" />
            </div>
          </div>
        )}

        {/* Card Overlay Content */}
        <div className="relative z-10 p-5 space-y-2.5 text-white">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500 text-slate-950 font-bold text-xs font-mono">
              {currentCar?.year}
            </Badge>
            <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3 text-teal-400" /> {currentCar?.location_display || currentCar?.country || "Kenya"}
            </span>
          </div>

          <h3 className="text-xl font-black text-white leading-snug">
            {currentCar?.title}
          </h3>

          <p className="text-2xl font-black text-teal-400 font-mono">
            {formatPrice(currentCar?.price || 0, currentCar?.currency)}
          </p>

          <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
            {currentCar?.mileage && (
              <span className="flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-teal-400" />
                {(currentCar.mileage / 1000).toFixed(0)}k {currentCar.mileage_unit || "km"}
              </span>
            )}
            {currentCar?.transmission && <span>· {currentCar.transmission}</span>}
            {currentCar?.fuel_type && <span>· {currentCar.fuel_type}</span>}
          </div>

          <button
            type="button"
            onClick={triggerDetails}
            className="w-full mt-2 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all"
          >
            <ChevronUp className="h-4 w-4 text-teal-400" /> Swipe Up for Full Specs
          </button>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-center gap-5 pb-2">
        <button
          type="button"
          onClick={triggerSkip}
          className="grid h-14 w-14 place-items-center rounded-full bg-slate-900 border-2 border-slate-700 text-rose-400 shadow-xl hover:scale-110 active:scale-95 transition-transform"
          title="Skip car"
        >
          <X className="h-7 w-7" />
        </button>

        <button
          type="button"
          onClick={triggerDetails}
          className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 border border-slate-700 text-slate-300 shadow-xl hover:scale-105 active:scale-95 transition-transform"
          title="View full specs"
        >
          <ChevronUp className="h-6 w-6" />
        </button>

        <button
          type="button"
          onClick={triggerLike}
          className="grid h-14 w-14 place-items-center rounded-full bg-slate-900 border-2 border-slate-700 text-emerald-400 shadow-xl hover:scale-110 active:scale-95 transition-transform"
          title="Save to favorites"
        >
          <Heart className="h-7 w-7 fill-emerald-500/20" />
        </button>
      </div>
    </div>
  );
}
