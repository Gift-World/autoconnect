import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export interface ComparedVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number | null;
  fuel_type?: string | null;
  transmission?: string | null;
  body_type?: string | null;
  engine_size_cc?: number | null;
  drivetrain?: string | null;
  steering?: string | null;
  condition?: string | null;
  country?: string | null;
  city?: string | null;
  image_url?: string | null;
  features?: string[] | null;
  verified?: boolean | null;
}

interface ComparisonContextType {
  comparedVehicles: ComparedVehicle[];
  addToCompare: (vehicle: ComparedVehicle) => boolean;
  removeFromCompare: (id: string) => void;
  toggleCompare: (vehicle: ComparedVehicle) => void;
  clearComparison: () => void;
  isInComparison: (id: string) => boolean;
  maxVehicles: number;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = "autoconnect_compared_vehicles";
const MAX_VEHICLES = 4;

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [comparedVehicles, setComparedVehicles] = useState<ComparedVehicle[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setComparedVehicles(parsed.slice(0, MAX_VEHICLES));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const saveToStorage = (vehicles: ComparedVehicle[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch {
      // Ignore storage errors
    }
  };

  const addToCompare = (vehicle: ComparedVehicle): boolean => {
    if (comparedVehicles.some((v) => v.id === vehicle.id)) {
      toast.info(`${vehicle.year} ${vehicle.make} ${vehicle.model} is already in comparison.`);
      return false;
    }

    if (comparedVehicles.length >= MAX_VEHICLES) {
      toast.error(`You can compare up to ${MAX_VEHICLES} vehicles at a time. Remove one first.`);
      return false;
    }

    const updated = [...comparedVehicles, vehicle];
    setComparedVehicles(updated);
    saveToStorage(updated);
    toast.success(`Added ${vehicle.year} ${vehicle.make} ${vehicle.model} to comparison.`);
    return true;
  };

  const removeFromCompare = (id: string) => {
    const updated = comparedVehicles.filter((v) => v.id !== id);
    setComparedVehicles(updated);
    saveToStorage(updated);
    toast.info("Vehicle removed from comparison.");
  };

  const toggleCompare = (vehicle: ComparedVehicle) => {
    if (comparedVehicles.some((v) => v.id === vehicle.id)) {
      removeFromCompare(vehicle.id);
    } else {
      addToCompare(vehicle);
    }
  };

  const clearComparison = () => {
    setComparedVehicles([]);
    saveToStorage([]);
    toast.info("Comparison list cleared.");
  };

  const isInComparison = (id: string) => {
    return comparedVehicles.some((v) => v.id === id);
  };

  const value = useMemo(
    () => ({
      comparedVehicles,
      addToCompare,
      removeFromCompare,
      toggleCompare,
      clearComparison,
      isInComparison,
      maxVehicles: MAX_VEHICLES,
    }),
    [comparedVehicles]
  );

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export function useVehicleComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    return {
      comparedVehicles: [],
      addToCompare: () => false,
      removeFromCompare: () => {},
      toggleCompare: () => {},
      clearComparison: () => {},
      isInComparison: () => false,
      maxVehicles: MAX_VEHICLES,
    };
  }
  return context;
}
