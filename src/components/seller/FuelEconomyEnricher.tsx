import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Leaf, Loader2, Info } from "lucide-react";
import { searchFuelEconomyVehicles, getFuelEconomyVehicleDetails, type FuelEconomyVehicle } from "@/lib/fueleconomy";
import { normalizeFuel, normalizeTransmission } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface FuelEconomyEnricherProps {
  make: string;
  model: string;
  year: number;
  onAccept: (data: {
    engine_size?: string;
    fuel_type?: string;
    transmission?: string;
  }) => void;
}

export function FuelEconomyEnricher({ make, model, year, onAccept }: FuelEconomyEnricherProps) {
  const [loading, setLoading] = useState(false);
  const [vehicleData, setVehicleData] = useState<FuelEconomyVehicle | null>(null);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    // Reset state when inputs change
    setVehicleData(null);
    setNoData(false);
    
    if (!make || !model || !year) return;

    let isMounted = true;

    const fetchSpecs = async () => {
      setLoading(true);
      try {
        const vehicleIds = await searchFuelEconomyVehicles(year, make, model);
        
        if (!isMounted) return;
        
        if (vehicleIds.length > 0) {
          // Just take the first variant for simplicity of suggestion
          const details = await getFuelEconomyVehicleDetails(vehicleIds[0]);
          if (details && isMounted) {
            setVehicleData(details);
            setNoData(false);
          }
        } else {
          setNoData(true);
        }
      } catch (error) {
        console.error("Failed to fetch fuel economy data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSpecs();

    return () => {
      isMounted = false;
    };
  }, [make, model, year]);

  const handleAccept = () => {
    if (!vehicleData) return;
    
    onAccept({
      engine_size: vehicleData.engineSize ? `${vehicleData.engineSize}L` : undefined,
      fuel_type: normalizeFuel(vehicleData.fuelType),
      transmission: normalizeTransmission(vehicleData.trany),
    });
    
    toast.success("Specs enriched successfully");
    setVehicleData(null); // Hide after accepting
  };

  if (!make || !model || !year) return null;
  if (loading) {
    return (
      <div className="flex items-center text-xs text-muted-foreground p-3 border border-border rounded-xl">
        <Loader2 className="h-3 w-3 animate-spin mr-2" />
        Searching US EPA database for specs...
      </div>
    );
  }
  
  if (noData || !vehicleData) return null;

  return (
    <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 space-y-3 animate-in fade-in slide-in-from-top-2 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-green-600 flex items-center gap-2">
          <Leaf className="h-4 w-4" />
          EPA Specs Found
        </h4>
        <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600">
          FuelEconomy.gov
        </Badge>
      </div>
      
      <p className="text-xs text-muted-foreground">
        We found specs for the {year} {make} {model}. Would you like to apply these to your listing?
      </p>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex flex-col">
          <span className="text-muted-foreground">Engine</span>
          <span className="font-medium">
            {vehicleData.engineSize ? `${vehicleData.engineSize}L` : "-"}
            {vehicleData.cylinders ? ` (${vehicleData.cylinders} Cyl)` : ""}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Fuel Type</span>
          <span className="font-medium">{vehicleData.fuelType || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Transmission</span>
          <span className="font-medium">{vehicleData.trany || "-"}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-muted-foreground">Fuel Economy</span>
          <span className="font-medium">
            {vehicleData.combMpg ? `${vehicleData.combMpg} MPG Comb` : "-"}
          </span>
        </div>
      </div>

      <Button type="button" size="sm" onClick={handleAccept} className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white">
        Apply Suggested Specs
      </Button>
    </div>
  );
}
