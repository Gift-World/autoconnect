import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useVehicleComparison } from "@/contexts/ComparisonContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { X, Scale, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CompareFloatingBar() {
  const [mounted, setMounted] = useState(false);
  const { comparedVehicles, removeFromCompare, clearComparison, maxVehicles } = useVehicleComparison();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || comparedVehicles.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl animate-in slide-in-from-bottom-6 duration-300">
      <div className="bg-card/95 backdrop-blur-xl border border-accent/30 rounded-2xl shadow-2xl p-3 sm:p-4 text-foreground flex flex-col sm:flex-row items-center justify-between gap-3 ring-1 ring-black/5 dark:ring-white/10">
        {/* Left info & items */}
        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent/15 text-accent text-xs font-semibold shrink-0">
            <Scale className="h-3.5 w-3.5" />
            <span>
              {comparedVehicles.length} / {maxVehicles}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {comparedVehicles.map((car) => (
              <div
                key={car.id}
                className="group relative flex items-center gap-2 bg-muted/80 hover:bg-muted border border-border px-2 py-1 rounded-xl shrink-0 transition-all text-xs"
              >
                {car.image_url ? (
                  <img
                    src={car.image_url}
                    alt={`${car.make} ${car.model}`}
                    className="h-7 w-10 rounded-md object-cover"
                  />
                ) : (
                  <div className="h-7 w-10 rounded-md bg-secondary flex items-center justify-center text-[9px] text-muted-foreground font-mono">
                    Car
                  </div>
                )}
                <div className="max-w-[110px] truncate leading-tight">
                  <p className="font-semibold truncate">
                    {car.year} {car.make} {car.model}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">{formatPrice(car.price, { compact: true })}</p>
                </div>
                <button
                  onClick={() => removeFromCompare(car.id)}
                  className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors ml-0.5"
                  title="Remove from comparison"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearComparison}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive"
            title="Clear all cars"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>

          <Link to="/compare">
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold h-9 px-4 rounded-xl gap-1.5 shadow-lg shadow-accent/20 text-xs"
            >
              <span>Compare Specs ({comparedVehicles.length})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
