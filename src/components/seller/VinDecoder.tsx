import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Search, CheckCircle2 } from "lucide-react";
import { decodeVin, type DecodedVin, normalizeBody, normalizeFuel, normalizeTransmission } from "@/lib/nhtsa";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface VinDecoderProps {
  vin: string;
  onAccept: (data: {
    make_name?: string;
    model_name?: string;
    year?: number;
    body_type?: string;
    fuel_type?: string;
    transmission?: string;
    engine_size?: string;
  }) => void;
}

export function VinDecoder({ vin, onAccept }: VinDecoderProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DecodedVin | null>(null);

  const handleDecode = async () => {
    if (!vin || vin.length !== 17) {
      toast.error("Please enter a valid 17-character VIN");
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const data = await decodeVin(vin);
      if (!data.make || !data.model) {
        toast.error("Could not decode vehicle details from this VIN.");
        return;
      }
      setResult(data);
      toast.success("VIN decoded successfully!");
    } catch (error) {
      console.error("VIN decode error:", error);
      toast.error("Failed to decode VIN. The service might be temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    
    const mappedBody = normalizeBody(result.bodyClass);
    const mappedFuel = normalizeFuel(result.fuelType);
    const mappedTrans = normalizeTransmission(result.transmission);
    
    onAccept({
      make_name: result.make,
      model_name: result.model,
      year: result.year ? parseInt(result.year, 10) : undefined,
      body_type: mappedBody,
      fuel_type: mappedFuel,
      transmission: mappedTrans,
      engine_size: result.displacementL ? `${result.displacementL}L` : undefined,
    });
    
    setResult(null);
    toast.success("Vehicle details applied to form");
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button 
        type="button" 
        variant="secondary" 
        size="sm" 
        onClick={handleDecode} 
        disabled={loading || !vin || vin.length !== 17}
        className="w-full sm:w-auto self-start"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
        Decode VIN
      </Button>

      {result && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              NHTSA VIN Record Found
            </h4>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Make</span>
              <span className="font-medium">{result.make || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{result.model || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Year</span>
              <span className="font-medium">{result.year || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Body</span>
              <span className="font-medium">{result.bodyClass || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Fuel</span>
              <span className="font-medium">{result.fuelType || "-"}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Engine</span>
              <span className="font-medium">
                {result.displacementL ? `${result.displacementL}L` : "-"}
                {result.engineCylinders ? ` V${result.engineCylinders}` : ""}
              </span>
            </div>
          </div>

          <Button type="button" size="sm" onClick={handleAccept} className="w-full mt-2">
            Apply to Listing
          </Button>
        </div>
      )}
    </div>
  );
}
